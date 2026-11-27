const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4174);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

/* Upstash Redis бэкенд (опционально).
   Если заданы переменные окружения UPSTASH_URL (https://...upstash.io) и UPSTASH_TOKEN —
   пользователи и сессии хранятся в Redis REST API. Иначе — локальный users.json.
   Общие данные и аккаунты переносятся прозрачно, интерфейс endpoints не меняется. */
/* Upstash принимает rediss:// URL (redis wire), но REST API ходит на https://host
   с тем же токеном (пароль из connection string). Парсим rediss:// в эти части,
   либо берём явные UPSTASH_URL/UPSTASH_TOKEN. */
let redisUrl = process.env.UPSTASH_URL || "";
let redisToken = process.env.UPSTASH_TOKEN || "";
const redisConn = process.env.REDISS_URL || process.env.UPSTASH_REDISS_URL || "";
if (!redisUrl && redisConn) {
  try {
    const u = new URL(redisConn);
    redisUrl = "https://" + u.hostname;
    redisToken = u.password ? decodeURIComponent(u.password) : "";
  } catch (e) {}
}
const USE_REDIS = !!(redisUrl && redisToken) && !process.env.FORCE_FILE;
const REDIS_KEY = "origin:db:v1";
async function redisGet() {
  const r = await fetch(redisUrl + "/get/" + encodeURIComponent(REDIS_KEY), { headers: { Authorization: "Bearer " + redisToken } });
  if (!r.ok) throw new Error("redis get " + r.status);
  const j = await r.json();
  if (j.error) throw new Error("redis " + j.error);
  return j.result || null;
}
async function redisSet(db) {
  // Upstash REST /set хранит строковое значение = raw body.
  // Отправляем один JSON.stringify: строка-значение = JSON представление db.
  const r = await fetch(redisUrl + "/set/" + encodeURIComponent(REDIS_KEY), {
    method: "POST",
    headers: { Authorization: "Bearer " + redisToken, "Content-Type": "application/json" },
    body: JSON.stringify(db)
  });
  if (!r.ok) throw new Error("redis set " + r.status);
}
async function parseDb(raw) {
  if (!raw) return null;
  let v = JSON.parse(raw);
  // сопротивление оставшемуся двойному кодированию из старых версий
  while (typeof v === "string") { v = JSON.parse(v); }
  return v && v.users ? v : null;
}
async function readUsersAsync() {
  if (!USE_REDIS) return readUsers();
  try {
    const raw = await redisGet();
    const db = await parseDb(raw);
    if (db) return db;
    // В Redis пусто либо битый ключ — переносим локальные данные (users.json) в Redis
    const local = readUsers();
    if (local && (local.users || []).length) {
      try { await redisSet(local); } catch (e) {}
      return local;
    }
    return { users: [], sessions: {} };
  } catch (e) {
    return { users: [], sessions: {} };
  }
}
async function writeUsersAsync(db) {
  if (!USE_REDIS) { writeUsers(db); return; }
  await redisSet(db);
}

async function readDbAsync() {
  const db = await readUsersAsync();
  if (!Array.isArray(db.users)) db.users = [];
  if (!db.users.some(u => u.email === ADMIN_EMAIL)) {
    // создаём админа с известным паролем при первом запуске
    const salt = crypto.randomBytes(16).toString("hex");
    db.users.push({
      email: ADMIN_EMAIL,
      name: "Admin",
      role: "admin",
      salt,
      hash: hash("admin2026", salt),
      plan: "pro",
      joined: new Date().toISOString().slice(0, 10),
      usage: { day: today(), dayTokens: 0 },
      chats: []
    });
    await writeUsersAsync(db);
  }
  return db;
}

function userChats(u) {
  if (!u) return [];
  if (!Array.isArray(u.chats)) u.chats = [];
  return u.chats;
}
function chatIn(u, id) { return (userChats(u).find(c => c.id === id)) || null; }

const PLANS = {
  start: { id: "start", name: "Start", price: 0, day: 500, models: ["gemma", "qwen"] },
  plus: { id: "plus", name: "Plus", price: 990, day: 15000, models: ["gemma", "qwen"] },
  pro: { id: "pro", name: "Pro", price: 2490, day: 60000, models: ["gemma", "qwen"] }
};
const ADMIN_EMAIL = "admin@origin.chat";
const ADMIN_ROLE = "admin";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch (e) {
    return { users: [], sessions: {} };
  }
}
function writeUsers(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2));
}
function hash(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString("hex");
}
function newToken() {
  return crypto.randomBytes(24).toString("hex");
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function emptyUsage() {
  return { day: today(), dayTokens: 0 };
}
function rollUsage(u) {
  const base = emptyUsage();
  if (!u.usage || typeof u.usage !== "object") u.usage = base;
  const s = u.usage;
  if (s.day !== base.day) { s.day = base.day; s.dayTokens = 0; }
  s.dayTokens = Number(s.dayTokens) || 0;
  return s;
}
function publicUser(u) {
  const plan = PLANS[u.plan] || PLANS.start;
  const s = rollUsage(u);
  return {
    email: u.email,
    name: u.name,
    role: u.role || "user",
    plan: plan.id,
    planName: plan.name,
    price: plan.price,
    dayLimit: plan.day,
    dayUsed: Math.round(s.dayTokens),
    joined: u.joined
  };
}
function send(res, code, data, headers) {
  const body = JSON.stringify(data);
  res.writeHead(code, Object.assign({
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  }, headers || {}));
  res.end(body);
}
function body(req, limit) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > (limit || 20000)) { req.destroy(); reject(new Error("too large")); }
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
function sessionUser(db, req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const email = db.sessions[token];
  if (!email) return null;
  return db.users.find(u => u.email === email) || null;
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/" || urlPath === "/chat" || urlPath === "/index.html") urlPath = "/index.html";
  const file = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT) || file.startsWith(DATA_DIR)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found"); return; }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function stripTags(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function unwrapUrl(u) {
  try {
    const x = new URL(u, "https://duckduckgo.com");
    const t = x.searchParams.get("uddg");
    if (t) return decodeURIComponent(t);
    return u.startsWith("//") ? "https:" + u : u;
  } catch (e) { return u; }
}
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
async function fetchTimed(url, ms, opts) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms || 7000);
  try {
    return await fetch(url, Object.assign({ signal: ac.signal, headers: { "User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8", Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" } }, opts || {}));
  } finally { clearTimeout(t); }
}
function cleanPage(html) {
  let s = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const main = /<article[\s\S]*?<\/article>/i.exec(s) || /<main[\s\S]*?<\/main>/i.exec(s);
  if (main) s = main[0];
  return stripTags(s)
    .replace(/Jump to (navigation|search)/gi, " ")
    .replace(/From (Wikipedia|Minecraft Wiki)[^.]{0,60}\./gi, " ")
    .replace(/Содержание|Навигация|Перейти к (поиску|навигации)|Пропустить/gi, " ")
    .replace(/\s+/g, " ").trim();
}
async function pageText(url) {
  if (!/^https?:/i.test(url)) return "";
  const r = await fetchTimed(url, 6000);
  if (!r.ok) return "";
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (ct && !/(text\/html|text\/plain|application\/xhtml)/.test(ct)) return "";
  const body = await r.text();
  let txt = cleanPage(body.slice(0, 1500000));
  if (txt.length < 240) txt = cleanPage(body);
  if (txt.length < 240) txt = stripTags(body);
  if (txt.length < 200) return "";
  return txt.slice(0, 2200);
}
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
const BAD_HOST = /(dzen\.ru|zen\.yandex|pinterest|facebook\.com|instagram|tiktok|vk\.com|ok\.ru|quora\.com|otvet\.mail|bolshoyvopros|yandex\.ru\/images|google\.com\/search|youtube\.com\/shorts)/i;
function queryTerms(q) {
  return String(q).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(w => w.length > 2);
}
function rankResults(list, q) {
  const terms = queryTerms(q);
  list.forEach(r => {
    const hay = (r.title + " " + r.text + " " + hostOf(r.url)).toLowerCase();
    let s = 0;
    terms.forEach(t => { if (hay.includes(t)) s += 2; });
    if (r.title && terms.some(t => r.title.toLowerCase().includes(t))) s += 3;
    if (BAD_HOST.test(r.url)) s -= 8;
    if (/wikipedia\.org$/.test(hostOf(r.url))) s -= 1;
    if (r.page) s += 2;
    r.score = s;
  });
  const perHost = {};
  return list
    .filter(r => r.score > 0 && r.title && /^https?:/i.test(r.url))
    .sort((a, b) => b.score - a.score)
    .filter(r => { const h = hostOf(r.url); perHost[h] = (perHost[h] || 0) + 1; return perHost[h] <= 2; });
}
async function ddgSearch(q) {
  const r = await fetchTimed("https://lite.duckduckgo.com/lite/?q=" + encodeURIComponent(q), 8000);
  if (!r.ok) throw new Error("ddg " + r.status);
  const html = await r.text();
  const linkRe = /<a[^>]*href="([^"]+)"[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi;
  const snipRe = /class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;
  const snips = [];
  let sm;
  while ((sm = snipRe.exec(html))) snips.push({ at: sm.index, text: stripTags(sm[1]) });
  const out = [];
  let lm;
  while ((lm = linkRe.exec(html)) && out.length < 8) {
    const title = stripTags(lm[2]);
    const link = unwrapUrl(decodeEntities(lm[1]));
    if (!title || !/^https?:/i.test(link)) continue;
    const next = snips.find(s => s.at > lm.index);
    out.push({ title, url: link, text: next ? next.text : "" });
  }
  return out;
}
async function wikiServer(lang, q) {
  const api = "https://" + lang + ".wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(q) + "&srlimit=3&format=json";
  const r = await fetch(api, { headers: { "User-Agent": "OriginChat/1.0" } });
  const j = await r.json();
  return ((j.query && j.query.search) || []).map(x => ({
    title: x.title,
    url: "https://" + lang + ".wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")),
    text: stripTags(x.snippet)
  }));
}

async function handler(req, res) {
  const url = (req.url || "/").split("?")[0];
  try {
    if (!url.startsWith("/api/")) return serveStatic(req, res);
    const db = await readDbAsync();

    if (url === "/api/plans" && req.method === "GET") {
      return send(res, 200, { plans: Object.values(PLANS).map(p => ({ id: p.id, name: p.name, price: p.price, day: p.day })) });
    }

    if (url === "/api/register" && req.method === "POST") {
      const b = await body(req);
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      const name = String(b.name || "").trim().slice(0, 40);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: "Некорректный email" });
      if (password.length < 6) return send(res, 400, { error: "Пароль короче 6 символов" });
      if (db.users.some(u => u.email === email)) return send(res, 409, { error: "Такой аккаунт уже есть" });
      const salt = crypto.randomBytes(16).toString("hex");
      const user = {
        email,
        name: name || email.split("@")[0],
        role: "user",
        salt,
        hash: hash(password, salt),
        plan: "start",
        joined: new Date().toISOString().slice(0, 10),
        usage: { day: today(), dayTokens: 0 },
        chats: []
      };
      db.users.push(user);
      const token = newToken();
      db.sessions[token] = email;
      await writeUsersAsync(db);
      return send(res, 200, { token, user: publicUser(user) });
    }

    if (url === "/api/login" && req.method === "POST") {
      const b = await body(req);
      const email = String(b.email || "").trim().toLowerCase();
      const password = String(b.password || "");
      const user = db.users.find(u => u.email === email);
      if (!user || hash(password, user.salt) !== user.hash) return send(res, 401, { error: "Неверный email или пароль" });
      const token = newToken();
      db.sessions[token] = email;
      await writeUsersAsync(db);
      return send(res, 200, { token, user: publicUser(user) });
    }

    if (url === "/api/logout" && req.method === "POST") {
      const auth = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
      if (auth && db.sessions[auth]) { delete db.sessions[auth]; await writeUsersAsync(db); }
      return send(res, 200, { ok: true });
    }

    if (url === "/api/me" && req.method === "GET") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      return send(res, 200, { user: publicUser(user) });
    }

    if (url === "/api/usage" && req.method === "POST") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const b = await body(req);
      const add = Math.max(0, Math.min(100000, Math.round(Number(b.tokens) || 0)));
      const s = rollUsage(user);
      s.dayTokens += add;
      const plan = PLANS[user.plan] || PLANS.start;
      await writeUsersAsync(db);
      const overDay = s.dayTokens > plan.day;
      return send(res, overDay ? 402 : 200, {
        user: publicUser(user),
        over: overDay,
        which: overDay ? "day" : ""
      });
    }

    if (url === "/api/plan" && req.method === "POST") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const b = await body(req);
      if (!PLANS[b.plan]) return send(res, 400, { error: "Нет такого тарифа" });
      // Только админ может менять тариф. Обычные пользователи всегда на бесплатном Start.
      if (user.role !== "admin") {
        user.plan = "start";
        await writeUsersAsync(db);
        return send(res, 200, { user: publicUser(user) });
      }
      user.plan = b.plan;
      await writeUsersAsync(db);
      return send(res, 200, { user: publicUser(user) });
    }

    /* ---------- chats (диалоги хранятся в БД на аккаунте) ---------- */
    if (url === "/api/chats" && req.method === "GET") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const chats = userChats(user).sort((a, b) => (b.updated || 0) - (a.updated || 0));
      const out = chats.map(c => ({ id: c.id, title: c.title, updated: c.updated, status: c.status, messages: c.messages }));
      return send(res, 200, { chats: out });
    }

    if (url === "/api/state" && req.method === "GET") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      return send(res, 200, { settings: user.settings || null, memory: user.memory || [] });
    }

    if (url === "/api/state" && req.method === "PUT") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const b = await body(req);
      if (b.settings && typeof b.settings === "object") user.settings = b.settings;
      if (Array.isArray(b.memory)) user.memory = b.memory.slice(0, 20);
      await writeUsersAsync(db);
      return send(res, 200, { ok: true });
    }

    if (url === "/api/chats" && req.method === "PUT") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const b = await body(req);
      if (!Array.isArray(b.chats)) return send(res, 400, { error: "Нет chats" });
      const clean = b.chats.map(c => ({
        id: String(c.id).slice(0, 60),
        title: String(c.title || "Диалог").slice(0, 120),
        updated: Number(c.updated) || Date.now(),
        status: String(c.status || "").slice(0, 20),
        messages: Array.isArray(c.messages) ? c.messages.slice(0, 400) : []
      })).filter(c => c.id).slice(0, 300);
      user.chats = clean;
      await writeUsersAsync(db);
      return send(res, 200, { ok: true });
    }

    if (url === "/api/chats" && req.method === "DELETE") {
      const user = sessionUser(db, req);
      if (!user) return send(res, 401, { error: "Не авторизован" });
      const sp = new URL(req.url, "http://local");
      const id = String(sp.searchParams.get("id") || "");
      user.chats = userChats(user).filter(c => c.id !== id);
      await writeUsersAsync(db);
      return send(res, 200, { chats: user.chats });
    }

    /* ---------- admin ---------- */
    if (url === "/api/admin/users" && req.method === "GET") {
      const user = sessionUser(db, req);
      if (!user || user.role !== "admin") return send(res, 403, { error: "Только для админа" });
      const users = db.users.map(u => {
        const s = rollUsage(u);
        return { email: u.email, name: u.name, role: u.role || "user", plan: u.plan, planName: (PLANS[u.plan] || PLANS.start).name, dayUsed: Math.round(s.dayTokens), joined: u.joined, chats: userChats(u).length };
      });
      return send(res, 200, { users });
    }

    if (url === "/api/admin/users" && req.method === "PATCH") {
      const user = sessionUser(db, req);
      if (!user || user.role !== "admin") return send(res, 403, { error: "Только для админа" });
      const b = await body(req);
      const target = db.users.find(u => u.email === String(b.email || "").toLowerCase());
      if (!target) return send(res, 404, { error: "Нет пользователя" });
      if (b.plan && PLANS[b.plan]) target.plan = b.plan;
      if (typeof b.role === "string" && (b.role === "admin" || b.role === "user")) target.role = b.role;
      await writeUsersAsync(db);
      return send(res, 200, { ok: true });
    }

    if (url === "/api/search" && req.method === "GET") {
      const sp = new URL(req.url, "http://local").searchParams;
      const q = String(sp.get("q") || "").trim();
      if (!q) return send(res, 400, { error: "Пустой запрос" });
      let results = [];
      try { results = await ddgSearch(q); } catch (e) {}
      if (results.length < 3) {
        try { results = results.concat(await wikiServer("ru", q)); } catch (e) {}
        try { results = results.concat(await wikiServer("en", q)); } catch (e) {}
      }
      const seen = new Set();
      results = results.filter(r => {
        const k = r.url.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      results = rankResults(results, q).slice(0, 6);
      const top = results.slice(0, 5);
      await Promise.all(top.map(async r => {
        try { r.page = await pageText(r.url); } catch (e) {}
      }));
      return send(res, 200, { results });
    }

    return send(res, 404, { error: "Не найдено" });
  } catch (e) {
    return send(res, 500, { error: "Ошибка сервера" });
  }
}

if (require.main === module) {
  // Локальный запуск: `node server.js` слушает порт и раздаёт статику.
  // На Vercel этот модуль импортируется через api/index.js как serverles-хендлер.
  const server = http.createServer(handler);
  const listenHost = process.env.LISTEN_HOST || "127.0.0.1";
  server.listen(PORT, listenHost, () => {
    console.log("Origin Chat: http://" + listenHost + ":" + PORT);
  });
}

module.exports = { handler, serveStatic, readDbAsync, writeUsersAsync };


