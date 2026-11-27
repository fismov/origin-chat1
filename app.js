/* Origin Chat */

const KEY = "origin.chat.v2";
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

const MODELS = {
  gemma: { id: "gemma", label: "Gemma 3 270M", provider: "google", base: "https://gemmatest.onrender.com", model: "gemma", ctx: 2048, input: "Текст", langs: "Русский, английский" },
  qwen: { id: "qwen", label: "Qwen2.5 0.5B", provider: "alibaba", base: "https://qwen-render-4p6k.onrender.com", model: "qwen", ctx: 2048, input: "Текст", langs: "Русский, английский" }
};
const PROVIDERS = {
  google:  { key: "google",  name: "Google",  short: "G",   color: "#4285F4" },
  alibaba: { key: "alibaba", name: "Qwen (Alibaba)", short: "A", color: "#FF6A00" }
};
function prov(m) { return PROVIDERS[m.provider] || PROVIDERS.google; }
function provIcon(m, cls) {
  const p = prov(m);
  return '<span class="prob ' + (cls || "") + '" style="--pc:' + p.color + '">' + p.short + '</span>';
}
function modelListHTML() {
  return Object.keys(PROVIDERS).map(pr => {
    const p = PROVIDERS[pr];
    const items = Object.values(MODELS).filter(mm => mm.provider === pr);
    if (!items.length) return "";
    return '<div class="mpick-group"><div class="mpick-sep">' + esc(p.name) + '</div>' +
      items.map(m => '<button class="mpick-item' + (m.id === state.model ? " on" : "") + '" data-pick="' + m.id + '">' +
        '<span class="mpname">' + esc(m.label) + '</span>' +
        (m.id === state.model ? '<span class="mpcheck">' + ICON.check + '</span>' : '') +
      '</button>').join("") +
    '</div>';
  }).join("");
}
function paintModelPill() {
  const m = currentModel();
  const mn = $("#modelname2"); if (mn) mn.textContent = m.label;
  const ic = $("#modelpillIcon"); if (ic) ic.innerHTML = "";
}
const STYLES = { concise: "Кратко и по делу", detailed: "Подробно", friendly: "Дружелюбно" };
const PLANS = {
  start: { id: "start", name: "Start", price: 0, day: 500, note: "бесплатно" },
  plus: { id: "plus", name: "Plus", price: 990, day: 15000, note: "для ежедневной работы" },
  pro: { id: "pro", name: "Pro", price: 2490, day: 60000, note: "для больших проектов" }
};

const ICON = {
  copy: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M6 15H5.5A1.5 1.5 0 0 1 4 13.5V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V6"/></svg>',
  reload: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
  close: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  download: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>',
  edit: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V11"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L12 14l-4 1 1-4z"/></svg>',
  chat: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A2.5 2.5 0 0 1 17.5 17H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/></svg>',
  pulse: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5 6 5-14 2.5 8h4"/></svg>',
  globe: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5S14.4 18.1 12 20.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z"/></svg>',
  trash: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 12h10l1-12"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>'
};

/* ---------- storage ---------- */
function defaults() {
  return {
    account: { name: "", email: "", role: "user", plan: "Start", price: 0, dayLimit: 500, dayUsed: 0, joined: "" },
    settings: { assistantName: "Origin", style: "concise", system: "Ты — Origin. Отвечай по-русски, коротко и по существу. Если просят таблицу или сравнение — сразу оформляй ответ Markdown-таблицей (строки через |, шапка через |---|), списки через «- » или цифры. Не предлагай сделать таблицу — делай её сразу.", temperature: 0.6, showPlan: true },
    memory: [],
    chats: [],
    currentId: null,
    model: "gemma",
    server: { status: "idle" },
    session: false
  };
}
let state = load();

/* Сериализация на сервер: диалоги хранятся в БД на аккаунте (Redis/users.json),
   локально ничего не храним. save() обновляет память, а pushChats отправляет на сервер. */
let saveTimer = null;
function save() {
  // локально не пишем диалоги в localStorage — только в БД через pushChats()
  if (authToken) schedulePushChats();
}
let pushStateTimer = null;
function schedulePushState() {
  if (pushStateTimer) clearTimeout(pushStateTimer);
  pushStateTimer = setTimeout(() => {
    pushStateTimer = null;
    if (!authToken) return;
    api("/state", { method: "PUT", body: JSON.stringify({ settings: state.settings, memory: state.memory }) }).catch(() => {});
  }, 500);
}
function saveAll() { schedulePushChats(); schedulePushState(); }
function schedulePushChats() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(pushChats, 600);
}
function pushChats() {
  clearTimeout(saveTimer); saveTimer = null;
  if (!authToken) return;
  api("/chats", { method: "PUT", body: JSON.stringify({ chats: state.chats }) }).catch(() => {});
}
function load() {
  const d = defaults();
  d.session = !!localStorage.getItem("origin.token");
  return d;
}
function est(text) { return Math.max(1, Math.round(String(text || "").length / 3.6)); }
function fmt(n) { return Number(n || 0).toLocaleString("ru-RU"); }
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function timeShort(ts) {
  const d = new Date(ts); const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function currentModel() { return MODELS[state.model] || MODELS.gemma; }
function chat() { return state.chats.find(c => c.id === state.currentId) || null; }
function newChat(draw) {
  const c = { id: "c" + Date.now().toString(36), title: "Новый диалог", messages: [], updated: Date.now(), status: "" };
  state.chats.unshift(c);
  state.currentId = c.id;
  save();
  if (draw !== false) { renderSidebar(); renderThread(); }
  return c;
}

/* ---------- auth api ---------- */
let authToken = localStorage.getItem("origin.token") || "";
function api(pathname, opts) {
  const o = Object.assign({ method: "GET" }, opts || {});
  o.headers = Object.assign({ "Content-Type": "application/json" }, authToken ? { Authorization: "Bearer " + authToken } : {}, o.headers || {});
  return fetch("/api" + pathname, o).then(async r => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const err = new Error(j.error || "HTTP " + r.status); err.status = r.status; throw err; }
    return j;
  });
}
function applyUser(u) {
  state.account.email = u.email;
  state.account.name = u.name;
  state.account.role = u.role || "user";
  state.account.plan = u.planName || u.plan;
  state.account.price = u.price;
  state.account.dayLimit = u.dayLimit;
  state.account.dayUsed = u.dayUsed;
  state.account.joined = u.joined;
  save();
}
async function syncFromServer() {
  if (!authToken) return;
  try {
    const r = await api("/me");
    applyUser(r.user);
  } catch (e) {}
  try {
    const r = await api("/chats");
    if (Array.isArray(r.chats)) { state.chats = r.chats; if (state.chats.length) state.currentId = state.chats[0].id; }
  } catch (e) {}
  try {
    const r = await api("/state");
    if (r.settings && typeof r.settings === "object") state.settings = Object.assign(state.settings, r.settings);
    if (Array.isArray(r.memory)) state.memory = r.memory;
  } catch (e) {}
  if (state.view === "chat") renderAll();
}
function planLimitReached() {
  const a = state.account;
  if (!a) return false;
  if (a.dayLimit && a.dayUsed >= a.dayLimit) return true;
  return false;
}
function reportUsage(tokens) {
  if (!authToken || !tokens) return;
  api("/usage", { method: "POST", body: JSON.stringify({ tokens }) })
    .then(r => {
      applyUser(r.user); syncUsageUI();
    })
    .catch(err => {
      if (err.status === 402) {
        const u = err.data && err.data.user;
        if (u) applyUser(u);
        const which = (err.data && err.data.which) || "month";
        toast(which === "day" ? "Дневной лимит исчерпан — вернитесь завтра или смените тариф" : "Дневной лимит исчерпан — смените тариф в аккаунте");
        if (state.view === "dash" || state.view === "acc") renderAll();
      }
    });
}
function syncUsageUI() {
  if (state.view === "dash") renderDash();
  else if (state.view === "acc") renderAcc();
}

/* ---------- screens ---------- */
let screen = "landing";
function applyAuth() {
  $("#landing").hidden = screen !== "landing";
  $("#auth").hidden = screen !== "auth";
  $("#app").hidden = screen !== "app";
  if (screen === "app") renderAll();
}
function showScreen(name) {
  screen = name; applyAuth();
  if (name === "auth") setTimeout(() => { const f = $("#signin"); if (f) f.elements.email.focus(); }, 60);
  if (name === "landing") { const sc = $("#landScroll"); if (sc) sc.scrollTop = 0; }
}
function login(email, name) {
  const guess = (name || String(email).split("@")[0] || "Гость").replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
  state.account.email = email || state.account.email || "";
  state.account.name = state.account.name || guess || "Гость";
  state.session = true;
  state.sessionStart = Date.now();
  save();
  if (!chat() && state.chats[0]) state.currentId = state.chats[0].id;
  screen = "app"; applyAuth();
  toast("С возвращением, " + String(state.account.name).split(" ")[0]);
}
function logout() {
  api("/logout", { method: "POST" }).catch(() => {});
  authToken = ""; localStorage.removeItem("origin.token");
  state.session = false; save(); screen = "landing"; applyAuth();
  const f = $("#signin"); if (f) f.reset();
  toast("Сессия завершена");
}

/* ---------- sidebar ---------- */
function renderSidebar() {
  const q = ($("#search") && $("#search").value || "").trim().toLowerCase();
  const list = state.chats.filter(c => !q || (c.title + " " + c.messages.map(m => m.text).join(" ")).toLowerCase().includes(q));
  const groups = [["Сегодня", []], ["Вчера", []], ["За 7 дней", []], ["Раньше", []]];
  const today = new Date().setHours(0, 0, 0, 0);
  list.forEach(c => {
    const d = new Date(c.updated).setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    groups[diff <= 0 ? 0 : diff === 1 ? 1 : diff < 7 ? 2 : 3][1].push(c);
  });
  const html = groups.filter(g => g[1].length).map(([name, items]) =>
    '<div class="chatgroup">' + name + '</div>' +
    items.map(c => {
      const active = c.id === state.currentId;
      const busy = c.status === "thinking" || c.status === "searching" || c.status === "writing";
      return '<button class="chatitem' + (active ? " on" : "") + '" data-chat="' + c.id + '">' +
        (busy ? '<svg class="ico orbit-ring" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="orbit-ring-bg" cx="12" cy="12" r="8"/><circle class="orbit-ring-fg" cx="12" cy="12" r="8"/></svg>' : ICON.chat) +
        '<b>' + esc(c.title) + '</b><time>' + timeShort(c.updated) + '</time>' +
        '<span class="del" data-delchat-single="' + c.id + '" title="Удалить диалог" role="button" aria-label="Удалить диалог">' + ICON.trash + '</span></button>';
    }).join("")
  ).join("");
  $("#chatlist").innerHTML = html || '<div class="chats-empty">' + (q ? "Ничего не найдено" : "Пока нет диалогов") + "</div>";
}

/* ---------- markdown ---------- */
function mdInline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}
function tableHTML(head, rows) {
  return '<div class="tablewrap"><table><thead><tr>' + head.map(h => "<th>" + mdInline(h) + "</th>").join("") + "</tr></thead><tbody>" +
    rows.map(r => "<tr>" + r.map(c => "<td>" + mdInline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
}
function cells(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map(x => x.trim());
}
function isSep(line) { return /^\|?[\s:-]*-[-\s:|]*\|?$/.test(line.trim()) && line.includes("-"); }
function md(text, stream) {
  const lines = String(text || "").split("\n");
  const out = [];
  let list = null, code = null, codeLang = "", buf = [];
  const closeList = () => { if (list) { out.push("</" + list + ">"); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (code !== null) {
      if (/^```/.test(line.trim())) { out.push("<div class=\"codeblock\"><div class=\"codehead\"><span>" + esc(codeLang || "code") + "</span><button class=\"copycode\" data-copy>Копировать</button></div><pre><code>" + esc(code.join("\n")) + "</code></pre></div>"); code = null; codeLang = ""; continue; }
      code.push(line); continue;
    }
    const fence = line.match(/^```(\w*)/);
    if (fence) { closeList(); code = []; codeLang = fence[1] || ""; continue; }
    if (/^\d+\.\s+/.test(line)) { if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; } out.push("<li>" + mdInline(line.replace(/^\d+\.\s+/, "")) + "</li>"); continue; }
    if (/^[-*]\s+/.test(line)) {
      const task = line.replace(/^[-*]\s+/, "");
      const cb = task.match(/^\[([ xX])\]\s+(.*)$/);
      if (cb) { closeList(); out.push("<div class=\"taskitem\"><span class=\"taskbox\"></span><span>" + mdInline(cb[2]) + "</span></div>"); continue; }
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push("<li>" + mdInline(task) + "</li>"); continue;
    }
    if (/\|.*\|/.test(line) && line.includes("|")) {
      const head = cells(line);
      const next = lines[i + 1] || "";
      if (isSep(next) || !next.trim()) {
        closeList();
        let j = i + (isSep(next) ? 2 : 1);
        const rows = [];
        while (j < lines.length && lines[j].includes("|") && lines[j].trim()) { if (!isSep(lines[j])) rows.push(cells(lines[j])); j++; }
        out.push(tableHTML(head, rows)); i = j - 1; continue;
      }
    }
    if (/^###\s+/.test(line)) { closeList(); out.push("<h3>" + mdInline(line.slice(4)) + "</h3>"); continue; }
    if (/^##\s+/.test(line)) { closeList(); out.push("<h2>" + mdInline(line.slice(3)) + "</h2>"); continue; }
    if (/^>\s?/.test(line)) { closeList(); out.push("<blockquote>" + mdInline(line.replace(/^>\s?/, "")) + "</blockquote>"); continue; }
    if (/^---+$/.test(line.trim())) { closeList(); out.push("<hr>"); continue; }
    if (!line.trim()) { closeList(); continue; }
    closeList();
    out.push("<p>" + mdInline(line) + "</p>");
  }
  closeList();
  if (code !== null) out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
  return out.join("");
}
function caretInto(html) {
  const caret = '<span class="caret"></span>';
  let pos = -1;
  ["</p>", "</li>", "</h2>", "</h3>", "</blockquote>", "</pre>", "</td>"].forEach(tag => {
    const i = html.lastIndexOf(tag);
    if (i > pos) pos = i;
  });
  return pos < 0 ? html + caret : html.slice(0, pos) + caret + html.slice(pos);
}
function parseThink(text) {
  const m = String(text || "").match(/<plan>([\s\S]*?)(<\/plan>|$)/i);
  if (!m) return { plan: "", answer: text };
  return { plan: m[1].trim(), answer: text.slice(m[0].length).replace(/^\s+/, "") };
}
function thinkHTML(m) {
  const steps = Array.isArray(m.trace) ? m.trace : [];
  const { plan } = parseThink(m.text || "");
  const thought = String(m.thought || "").trim();
  if (!steps.length && !plan && !thought) return "";
  const th = thought ? '<div class="tthought">' + esc(thought) + '</div>' : "";
  const list = steps.map(s => '<div class="tstep">' + esc(s) + '</div>').join("");
  if (!state.settings.showPlan) return "";
  return '<details class="think"><summary>Размышление</summary><div class="thinkbody">' + th + list + (plan ? '<div class="tplan">' + esc(plan) + '</div>' : "") + '</div></details>';
}
function statsHTML(m) {
  if (!m.tout && !m.secs) return "";
  const parts = [];
  if (m.tout) parts.push(m.tout + " ток");
  if (m.tps) parts.push(m.tps.toFixed(1) + " ток/с");
  if (m.secs) parts.push(m.secs.toFixed(1) + " с");
  return '<div class="msgstats">' + parts.map(p => "<span>" + p + "</span>").join("") + "</div>";
}
function sourcesHTML(list) {
  if (!list || !list.length) return "";
  return '<div class="sources">' + list.map(s => '<a class="source" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + ICON.globe + '<span>' + esc(s.title || s.url) + "</span></a>").join("") + "</div>";
}
function msgHTML(m, i, active) {
  if (m.role === "user") {
    const actions = '<div class="mactions"><button data-resend-msg="' + i + '">' + ICON.reload + 'Вернуть</button><button data-copy-user-msg="' + i + '">' + ICON.copy + 'Копировать</button></div>';
    return '<div class="msg user" data-i="' + i + '"><div class="bubble">' + esc(m.text) + "</div>" + actions + "</div>";
  }
  const { answer } = parseThink(m.text || "");
  const pending = m.pending;
  const body = pending
    ? (answer ? caretInto(md(answer, true)) : '<div class="typing"><i></i><i></i><i></i></div>' + (m.waking ? '<span class="wake">Сервер просыпается, до минуты</span>' : ""))
    : md(answer);
  const err = m.error ? '<div class="msg-err">' + esc(m.error) + "</div>" : "";
  const actions = pending ? "" : '<div class="mactions"><button data-copy-msg="' + i + '">' + ICON.copy + "Копировать</button>" +
    (active ? '<button data-regen="' + i + '">' + ICON.reload + "Заново</button>" : "") + "</div>";
  return '<div class="msg assistant" data-i="' + i + '">' +
    thinkHTML(m) +
    '<div class="content">' + body + "</div>" +
    sourcesHTML(m.sources) + err + statsHTML(m) + actions + "</div>";
}
function renderThread() {
  const c = chat();
  const box = $("#messages");
  if (!box) return;
  if (!c) { box.innerHTML = ""; return; }
  if (!c.messages.length) {
    box.innerHTML = '<div class="hello"><h1>Чем помочь сегодня?</h1><p>Спросите про код, текст или разберите задачу. Модель можно поменять в любой момент.</p><div class="hello-actions"><button class="btn ghost sm" data-suggest="Как работает DNS?">Как работает DNS?</button><button class="btn ghost sm" data-suggest="Напиши функцию на Python для сортировки списка">Код на Python</button><button class="btn ghost sm" data-suggest="Объясни разницу между TCP и UDP">TCP и UDP</button></div></div>';
    return;
  }
  const scrollBottom = () => { box.parentElement.scrollTop = box.parentElement.scrollHeight; };
  box.innerHTML = '<div class="thread-inner">' + c.messages.map((m, i) => msgHTML(m, i, c.id === state.currentId)).join("") + "</div>";
  scrollBottom();
}
function paintMsg(idx) {
  const c = chat(); if (!c) return;
  const node = $('.msg.assistant[data-i="' + idx + '"]', $("#messages"));
  if (!node) { renderThread(); return; }
  const m = c.messages[idx];
  if (!m) return;
  const sel = document.getSelection();
  const selecting = sel && sel.rangeCount > 0 && !sel.isCollapsed &&
    (node.contains(sel.anchorNode) || node.contains(sel.focusNode));
  if (selecting) return;
  const { answer } = parseThink(m.text || "");
  const content = $("[data-content]", node) || $(".content", node);
  if (content) {
    const html = m.pending ? (answer ? caretInto(md(answer, true)) : '<div class="typing"><i></i><i></i><i></i></div>' + (m.waking ? '<span class="wake">Сервер просыпается, до минуты</span>' : "")) : md(answer);
    if (content.innerHTML !== html) content.innerHTML = html;
  }
  const thinkMarkup = thinkHTML(m);
  let think = $(".think", node);
  if (!thinkMarkup) { if (think) think.remove(); }
  else if (!think) { content.insertAdjacentHTML("beforebegin", thinkMarkup); }
  else {
    const tmp = document.createElement("div");
    tmp.innerHTML = thinkMarkup;
    const nb = $(".thinkbody", tmp), ob = $(".thinkbody", think);
    if (nb && ob && ob.innerHTML !== nb.innerHTML) ob.innerHTML = nb.innerHTML;
  }
  const sc = $(".sources", node);
  const sh = sourcesHTML(m.sources);
  if (sh && !sc) node.insertAdjacentHTML("beforeend", sh);
  const st = $(".msgstats", node);
  if (st && !m.pending) st.outerHTML = statsHTML(m);
  const box = $("#messages") && $("#messages").parentElement;
  if (box) box.scrollTop = box.scrollHeight;
}

/* ---------- api calls ---------- */
function toApiMessages(list) {
  if (state.model !== "gemma") return list;
  // Gemma-шаблон требует строгого чередования user/assistant (соседние сообщения
  // одной роли и system-роль он не принимает). Приводим список к нужному виду:
  // сливаем подряд идущие сообщения одной роли, начинаем строго с user.
  let sys = "";
  const rest = [];
  list.forEach(m => {
    if (m.role === "system") { sys += (sys ? "\n" : "") + String(m.content || ""); return; }
    rest.push(m);
  });
  const out = [];
  for (const m of rest) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const last = out[out.length - 1];
    if (last && last.role === role) {
      last.content += "\n\n" + String(m.content || "");
    } else {
      out.push({ role, content: String(m.content || "") });
    }
  }
  // Первым обязательно должен идти user — иначе модель падает с parse error.
  if (!out.length) out.push({ role: "user", content: "" });
  if (out[0].role !== "user") out.unshift({ role: "user", content: sys });
  if (sys) out[0].content = sys + "\n\n" + out[0].content;
  return out;
}
function hostOfUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
}
function buildMessages(c, maxTokens) {
  const sys = state.settings.system + (state.memory.length ? "\n\nЧто помнить: " + state.memory.map(m => m.text).join("; ") : "");
  const list = [{ role: "system", content: sys }];
  const budget = currentModel().ctx - maxTokens - 48;
  let used = est(sys);
  const tail = [];
  for (let i = c.messages.length - 1; i >= 0; i--) {
    const m = c.messages[i];
    if (m.role !== "user" && m.role !== "assistant") continue;
    let t = String(m.text || "").trim();
    if (!t) continue;
    if (m.role === "user" && Array.isArray(m.sources) && m.sources.length) {
      const src = m.sources.slice(0, 4);
      const per = Math.max(240, Math.floor(1400 / src.length));
      const facts = src.map((s, i) => {
        const snip = String(s.text || "").trim();
        const page = String(s.page || "").trim();
        const body = snip.length > 90 ? snip : (page || snip);
        return "[" + (i + 1) + "] " + s.title + " (" + hostOfUrl(s.url) + ")\n" + body.slice(0, per);
      }).join("\n\n");
      t = "Ниже даны факты, найденные в интернете по твоему вопросу (это свежие данные из поиска, но могут содержать шум):\n\n" + facts + "\n\nВопрос: " + t + "\n\nДай нормальный развёрнутый ответ на вопрос опираясь на факты выше. Если факты содержат нужную информацию — используй её своими словами. Если вопрос про новости/версии/обновления — обязательно упомяни конкретику из фактов (что именно добавили). Не выдумывай ничего сверх фактов, но и не цитируй их дословно списком — отвечай связным текстом.";
    }
    const n = est(t) + 4;
    tail.unshift({ role: m.role, content: t });
  }
  return list.concat(tail);
}
async function requestOnce(c, maxTokens, signal) {
  return fetch(currentModel().base + "/v1/chat/completions", {
    method: "POST", signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: currentModel().model, messages: toApiMessages(buildMessages(c, maxTokens)), max_tokens: maxTokens, temperature: Number(state.settings.temperature) || 0.6, stream: true })
  });
}
function readStream(res, onTok, onUsage) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  return reader.read().then(function pump({ done, value }) {
    if (done) return;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const j = JSON.parse(payload);
        if (j.usage && onUsage) onUsage(j.usage);
        const d = j.choices && j.choices[0] && j.choices[0].delta;
        if (d && d.content) onTok(d.content);
      } catch (e) {}
    }
    return reader.read().then(pump);
  });
}
async function runModel(c, idx) {
  const msg = c.messages[idx];
  if (!msg) return;
  const isActive = () => state.currentId === c.id && screen === "app" && state.view === "chat";
  let raf = 0;
  const paint = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; if (isActive()) paintMsg(idx); }); };
  const started = Date.now();
  msg.pending = true; msg.text = ""; msg.error = ""; msg.firstTs = started; msg.tout = 0;
  c.status = "writing";
  renderSidebar(); if (isActive()) renderThread();
  const maxTokens = Math.max(96, Math.min(420, Math.floor(currentModel().ctx * 0.28)));
  const controller = new AbortController();
  state.abort = controller;
  const bar = document.querySelector(".composer-bar"); if (bar) bar.classList.add("busy");
  const stopBtn = $("#stop"); if (stopBtn) stopBtn.hidden = false;
  let lastActive = Date.now();
  let warned = false;
  const watchdog = setInterval(() => {
    if (!msg.pending) { clearInterval(watchdog); return; }
    const idle = Date.now() - lastActive;
    if (idle > 60000 && !warned && isActive() && msg.tout === 0) { warned = true; showBusyModal(idx); }
    if (idle > 125000) controller.abort();
  }, 2000);
  try {
    let res = await requestOnce(c, maxTokens, controller.signal);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("ошибка " + res.status + (t ? ": " + t.slice(0, 300) : ""));
    }
    await readStream(res, chunk => {
      msg.text += chunk;
      lastActive = Date.now();
      msg.waking = false;
      const prev = msg.tout || 0;
      msg.tout = est(msg.text);
      const added = msg.tout - prev;
      if (added > 0) reportUsage(added);
      paint();
    }, u => { if (u.prompt_tokens) msg.tin = u.prompt_tokens; if (u.completion_tokens) msg.tout = u.completion_tokens; });
    if (!parseThink(msg.text).answer.trim()) throw new Error("Модель вернула пустой ответ");
  } catch (e) {
    if (!msg.text.trim()) msg.error = String(e.message || e).includes("abort") ? "Остановлено" : "Не получилось: " + String(e.message || e);
  } finally {
    clearInterval(watchdog);
    msg.pending = false; msg.waking = false;
    msg.secs = (Date.now() - started) / 1000;
    msg.tps = msg.secs > 0.2 ? msg.tout / msg.secs : 0;
    if (msg.tin) reportUsage(msg.tin);
    c.status = "";
    c.updated = Date.now();
    state.abort = null;
    const bar2 = document.querySelector(".composer-bar"); if (bar2) bar2.classList.remove("busy");
    const stopBtn2 = $("#stop"); if (stopBtn2) stopBtn2.hidden = true;
    save();
    renderSidebar();
    if (isActive()) { renderThread(); updateCtx(); }
  }
}

/* ---------- search ---------- */
const SEARCH_HINT = /(что такое|кто так|что нового|новост|обновлен|добав|появил|изменил|релиз|выпуст|вышел|выйдет|дата выхода|версия|курс|погод|сравни|\b\d+\.\d+\b)/i;
const ASKS_FACT = /(\?|^\s*(что|кто|когда|где|почему|зачем|сколько|какой|какая|какие|чем|куда)\b)/i;
const SMALLTALK = /^(привет|здравствуй|хай|доброе утро|добрый день|добрый вечер|как дела|как ты|что делаешь|чем занят|спасибо|благодарю|пока|до свидания|ок|окей|норм|хорошо|ясно|понял|поняла)[\s!.,?)…]*$/i;
const normQuery = q => String(q || "").replace(/(^|[^а-яёa-z])гта(?=[^а-яёa-z]|$)/gi, "$1GTA").replace(/(^|[^а-яёa-z])ии(?=[^а-яёa-z]|$)/gi, "$1AI").replace(/[?!.,;:]+/g, " ").replace(/\s+/g, " ").trim();
function looksLikeQuestion(t) { return /(что такое|кто так|где|когда|почему|зачем|сколько|какой|какая|какие|новост|сегодня|сейчас|курс|погод|найди|поищи|погугли|расскажи про|расскажи о)/i.test(t); }
function isStructured(t) {
  const s = String(t || "");
  if (/(таблиц|составь\s+(список|план|сравнен)|сделай\s+(список|план|сравнен))/i.test(s)) return true;
  const fact = /(курс|погод|вышл|выйдет|дата выхода|новост|релиз|обновлен|\b\d+\.\d+\b)/i.test(s);
  return !fact && /(таблиц)/i.test(s);
}
function isCodeRequest(t) {
  const s = String(t || "");
  if (/```/.test(s)) return true;
  if (/(напиши|написать|перепиши|исправь|реализуй|сгенерируй|отрефактор)/i.test(s)) return true;
  return /(python|питон|javascript|js|typescript|html|css|sql|react|node\.js|java|c\+\+|php|golang)/i.test(s) && /(код|функци|скрипт|класс|программ|переменн|массив|цикл)/i.test(s);
}
function isGoodQuery(q) {
  if (!q || q.length < 2) return false;
  if (/^(запрос|query|слово|тема|текст|ничего|нет)$/i.test(q)) return false;
  if (/(подумай|напиши|написать|сделай|пожалуйста|объясни|расскажи|помоги|ответь)/i.test(q)) return false;
  return true;
}
function searchQueryFrom(text) {
  let q = String(text || "").replace(/^(что такое|кто такой|кто такая|кто такие|расскажи про|расскажи о|объясни|найди|поищи|погугли|сравни)\s+/i, "");
  // сохраняем версии вида 26.1 / 1.21 / 1.20.4, чтобы поиск искал по точному номеру версии
  q = q.replace(/(\d)[.,](\d)/g, "$1.$2");
  q = q.replace(/[?!;:()"]+/g, " ");
  // кодовые имена и понятия приводим к общему виду (gta/AI и т.п.)
  q = normQuery(q);
  const stop = ["расскажи", "коротко", "пожалуйста", "пожалуй", "мне", "подробнее", "просто", "это", "такое", "в", "на", "и", "двух", "словах", "плиз", "подумай", "хорошо", "напиши", "написать", "ответь", "дай", "покажи", "можешь", "там", "нового", "новое", "скажи", "а", "же", "уже", "вообще", "есть", "пожалуйста", "что", "какие", "как"];
  const words = q.split(/\s+/).filter(Boolean).filter(w => !stop.includes(w.toLowerCase()));
  let s = normQuery(words.slice(0, 6).join(" "));
  // для вопросов про версии / обновления добавляем контекстное слово, чтобы поиск вернул свежие новости
  if (/(\d+\.\d+|верси[яеию]|обновлен)/i.test(text) && !/(обновлени|изменени|патч|что нового|добавили)/i.test(s)) s += " обновление";
  return s;
}
function planSearch(text) {
  // Детерминированный план поиска: без слабой модели. Решает только по тексту пользователя.
  const src = String(text || "").trim();
  if (isCodeRequest(src) || isStructured(src) || SMALLTALK.test(src)) return { query: null, thought: "" };
  const forced = /найди|поищи|погугли|в интернете|новост|версия|свеж/i.test(src);
  const q = searchQueryFrom(src);
  if (forced && q) return { query: q, thought: "" };
  if (isGoodQuery(q) && (looksLikeQuestion(src) || SEARCH_HINT.test(src) || ASKS_FACT.test(src))) return { query: q, thought: "" };
  return { query: null, thought: "" };
}
async function thinkAbout(text) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const sysTxt = "Подумай, как лучше ответить на сообщение пользователя. Напиши 2–3 коротких предложения своими словами: что важно учесть, с чего начать, чего избегать. Не пиши готовый ответ и не здоровайся.";
    const msgs = toApiMessages([{ role: "system", content: sysTxt }, { role: "user", content: String(text || "").slice(0, 300) }]);
    const res = await fetch(currentModel().base + "/v1/chat/completions", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: currentModel().model, messages: msgs, max_tokens: 140, temperature: 0.3 })
    });
    if (res.ok) {
      const j = await res.json();
      const s = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "").trim();
      return s.replace(/^(мысли|размышление|план)\s*[:—-]\s*/i, "").replace(/\s+/g, " ").slice(0, 300);
    }
  } catch (e) {} finally { clearTimeout(timer); }
  return "";
}
async function wikiSearch(lang, q) {
  const base = "https://" + lang + ".wikipedia.org/w/api.php";
  const url = base + "?action=query&list=search&srsearch=" + encodeURIComponent(q) + "&srlimit=4&format=json&origin=*";
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json();
  return ((j.query && j.query.search) || []).map(x => ({ title: x.title, url: "https://" + lang + ".wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")), text: x.snippet.replace(/<[^>]+>/g, "") }));
}
async function searchWeb(q0) {
  const q = normQuery(q0);
  if (!q) return [];
  let results = [];
  try {
    const r = await fetch("/api/search?q=" + encodeURIComponent(q), { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      results = Array.isArray(j.results) ? j.results : [];
    }
  } catch (e) {}
  if (!results.length) {
    try { results = results.concat(await wikiSearch("ru", q)); } catch (e) {}
    try { results = results.concat(await wikiSearch("en", q)); } catch (e) {}
  }
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  results.forEach(r => {
    const t = (r.title + " " + r.text).toLowerCase();
    r.score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  });
  const scored = results.filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  const filtered = (scored.length ? scored : results);
  // Отсеиваем явный мусор и дубли по домену/заголовку, чтобы не тащить лишнее
  const lower = q.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const keep = filtered.filter(r => {
    const hay = (r.title + " " + (r.text || "")).toLowerCase();
    const titleWords = lower.split(/\s+/).filter(w => w.length > 2);
    if (titleWords.length && titleWords.every(w => !hay.includes(w))) return false;
    return true;
  });
  return (keep.length ? keep : filtered).slice(0, 5);
}

/* ---------- факт-ответ из источников (без галлюцинаций) ---------- */
function splitSentences(t) {
  return String(t || "").split(/(?<=[.!?])\s+|\.(?=\s+[А-ЯЁA-Z])/g)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 400 && /[а-яёa-z]{4}/i.test(s));
}
function queryWords(q) {
  return String(q || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(w => w.length > 2);
}
function scoreSentence(s, terms) {
  const lower = s.toLowerCase();
  let hits = 0;
  terms.forEach(t => { if (lower.includes(t)) hits += 1; });
  let score = hits * 4;
  if (hits >= 1) score += 2;
  if (/^(согласно|по данным|по сообщени|в (1\d|20\d{2}) год)/i.test(s.trim())) score += 2;
  if (/^(это|такое|версия|обновлени|релиз)/i.test(s.trim())) score += 1;
  if (/\d{4}|\d+\.\d+/.test(s)) score += 1;
  return score;
}
function extractFactAnswer(sources, query) {
  const terms = queryWords(query);
  if (!terms.length) return "";
  const chosen = [];
  let used = new Set();
  const sourcesWithPage = sources.filter(s => String(s.page || "").length > 120);
  const pool = (sourcesWithPage.length ? sourcesWithPage : sources).slice(0, 5);
  pool.forEach(s => {
    const body = String(s.page || s.text || "");
    splitSentences(body).forEach(sent => {
      const sc = scoreSentence(sent, terms);
      if (sc < 4) return;
      const key = sent.toLowerCase().slice(0, 60);
      if (used.has(key)) return;
      used.add(key);
      chosen.push({ s, sent, sc });
    });
  });
  chosen.sort((a, b) => b.sc - a.sc);
  const top = chosen.slice(0, 6);
  if (!top.length) return "";
  // формируем ответ обычными предложениями (без чек-боксов)
  const lines = top.map((c, i) => c.sent);
  return lines.join(" ");
}

/* ---------- context ---------- */
function contextTokens() {
  let n = est(state.settings.system) + state.memory.reduce((a, m) => a + est(m.text) + 2, 0);
  const c = chat();
  if (c) c.messages.forEach(m => { n += est(m.text) + 4; });
  return n;
}
function updateCtx() {
  const el = $("#ctxmeter"); if (!el) return;
  const n = contextTokens(), ctx = currentModel().ctx;
  const pct = Math.max(0, Math.min(1, n / ctx)), C = 50.27;
  const ring = $(".ctxfg", el);
  if (ring) ring.setAttribute("stroke-dasharray", (C * pct).toFixed(2) + " " + C.toFixed(2));
  const pctEl = $(".ctxpct", el);
  if (pctEl) pctEl.textContent = Math.round(pct * 100) + "%";
  el.classList.toggle("warn", pct > 0.8);
  el.classList.toggle("full", pct >= 0.99);
  el.title = Math.round(pct * 100) + "% контекста · " + fmt(n) + " из " + ctx + " токенов";
}

/* ---------- memory ---------- */
function addMemory(text) {
  const t = String(text || "").trim().replace(/\s+/g, " ").slice(0, 200);
  if (!t) return;
  if (state.memory.some(m => m.text.toLowerCase() === t.toLowerCase())) { toast("Это уже в памяти"); return; }
  state.memory.unshift({ id: "m" + Math.random().toString(36).slice(2, 7), text: t, ts: Date.now() });
  state.memory = state.memory.slice(0, 20);
  save(); schedulePushState(); updateCtx();
}
function removeMemory(id) { state.memory = state.memory.filter(m => m.id !== id); save(); schedulePushState(); updateCtx(); }

/* ---------- send ---------- */
function send(text) {
  text = String(text || "").trim();
  if (!text) return;
  if (planLimitReached()) { showLimitModal(); return; }
  const fact = text.match(/^(?:запомни|запомнить|remember)[,:\s]+(.+)$/i);
  if (fact) addMemory(fact[1]);
  if (!chat()) newChat(false);
  const c = chat();
  c.messages.push({ role: "user", text: text, ts: Date.now() });
  if (c.messages.length === 1) c.title = text.slice(0, 54);
  c.updated = Date.now();
  const input = $("#prompt"); if (input) { input.value = ""; autoGrow(); }
  save(); renderThread(); renderSidebar();

  const idx = c.messages.length;
  c.messages.push({ role: "assistant", text: "", ts: Date.now(), pending: true, trace: ["Разбираю вопрос"], thought: "" });
  renderThread(); updateCtx();

  const started = Date.now();
  const a = c.messages[idx];
  (async () => {
    c.status = "thinking";
    renderSidebar();
    let plan = { query: null, thought: "" };
    try { plan = planSearch(text); } catch (e) {}
    a.trace.push("Ищу свежие данные");
    c.status = "searching";
    renderSidebar();
    const thoughtP = thinkAbout(text);
    let found = [];
    if (plan.query) found = await searchWeb(plan.query);
    // Мысль подгружается асинхронно, не блокируя основной поток/стрим ответа.
    thoughtP.then(thought => { if (thought) { a.thought = thought; if (state.currentId === c.id && state.view === "chat") paintMsg(idx); } }).catch(() => {});
    if (found.length) {
      a.sources = found;
      c.messages[idx - 1].searchTried = true;
      c.messages[idx - 1].sources = found;
      a.trace.push("Прочитал " + found.length + " " + plural(found.length, "источник", "источника", "источников"));
    }
    a.trace.push("Пишу ответ");
    c.status = "writing";
    renderSidebar();
    if (state.currentId === c.id && state.view === "chat") paintMsg(idx);
    // Отвечает всегда модель — найденные факты уже ложатся в контекст внутри runModel/buildMessages.
    // Выжимка из страниц — только страховка, если модель не смогла ответить (пусто/ошибка).
    await runModel(c, idx);
    const ai = c.messages[idx];
    if (ai && found.length && (!ai.text || !parseThink(ai.text).answer.trim()) && !ai.pending) {
      const factAnswer = extractFactAnswer(found, plan.query || text);
      if (factAnswer) {
        ai.text = factAnswer;
        ai.error = "";
        ai.secs = (Date.now() - started) / 1000;
        ai.tout = est(factAnswer);
        ai.tps = ai.secs > 0.2 ? ai.tout / ai.secs : 0;
        if (ai.tout) reportUsage(ai.tout);
        c.status = "";
        c.updated = Date.now();
        save();
        renderSidebar();
        if (state.currentId === c.id && state.view === "chat") { renderThread(); updateCtx(); }
      }
    }
  })();
}

/* ---------- attachments (отключено) ---------- */

/* ---------- dashboard ---------- */
function sessionStats() {
  const c = chat();
  const msgs = c ? c.messages.filter(m => !m.pending).length : 0;
  let tin = 0, tout = 0;
  state.chats.forEach(x => x.messages.forEach(m => { tin += m.tin || 0; tout += m.tout || 0; }));
  return { msgs, tin, tout };
}
function totals() {
  let tin = 0, tout = 0;
  state.chats.forEach(c => c.messages.forEach(m => { tin += m.tin || 0; tout += m.tout || 0; }));
  return { tin, tout };
}
let dashTick = null;
function limitsHTML() {
  const a = state.account || {};
  const used = a.dayUsed || 0, lim = a.dayLimit || (PLANS.start.day);
  const pct = lim ? Math.min(100, Math.round(used / lim * 100)) : 0;
  return '<section class="panel"><div class="panel-head"><h2>Лимиты</h2><span class="sub">' + esc(a.planName || "Start") + '</span></div>' +
    '<div class="usage2">' +
    '<div class="row"><div class="top"><span>Дневной лимит</span><b>' + fmt(used) + ' / ' + fmt(lim) + '</b></div>' +
    '<div class="usagebar' + (pct > 85 ? " hot" : "") + '"><i style="width:' + pct + '%"></i></div></div>' +
    '</div></section>';
}
function renderDash() {
  const sess = sessionStats(), all = totals();
  const chats = state.chats;
  const answers = chats.reduce((n, c) => n + c.messages.filter(m => m.role === "assistant" && !m.error && m.tout).length, 0);
  const avgOut = answers ? Math.round(all.tout / answers) : 0;
  const sessTotal = sess.tin + sess.tout;
  const days = 7;
  const buckets = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toDateString();
    let n = 0;
    chats.forEach(c => c.messages.forEach(m => { if (new Date(m.ts).toDateString() === key) n++; }));
    buckets.push({ n, label: d.toLocaleDateString("ru-RU", { weekday: "short" }) });
  }
  const max = Math.max(1, ...buckets.map(b => b.n));
  $("#viewDash").innerHTML = '<div class="page">' +
    '<header class="dhead"><div><h1>Дашборд</h1><p>Токены и активность</p></div><div class="dactions"><button class="btn ghost sm" data-export>Экспорт</button><button class="btn primary sm" data-new>Новый диалог</button></div></header>' +
    '<section class="statline">' +
    '<div class="stat"><span>Сообщений</span><b>' + sess.msgs + '</b></div>' +
    '<div class="stat"><span>Токенов в сессии</span><b>' + fmt(sessTotal) + '</b></div>' +
    '<div class="stat"><span>Диалогов</span><b>' + chats.length + '</b></div>' +
    '<div class="stat"><span>Ответов</span><b>' + answers + '</b></div>' +
    '</section>' +
    limitsHTML() +
    '<section class="panel"><div class="panel-head"><h2>Токены</h2><span class="sub">оценка по символам</span></div>' +
    '<div class="tokgrid">' +
    '<div class="tok"><span>Вход</span><b>' + fmt(sess.tin) + '</b><small>промпты и контекст сессии</small></div>' +
    '<div class="tok"><span>Выход</span><b>' + fmt(sess.tout) + '</b><small>ответы модели за сессию</small></div>' +
    '<div class="tok"><span>Средний ответ</span><b>' + avgOut + '</b><small>токенов на ответ</small></div>' +
    '<div class="tok"><span>Всего за всё время</span><b>' + fmt(all.tin + all.tout) + '</b><small>' + chats.length + ' ' + plural(chats.length, "диалог", "диалога", "диалогов") + '</small></div>' +
    '</div>' +
    (sessTotal ? '<div class="split"><i class="in" style="width:' + Math.round(sess.tin / sessTotal * 100) + '%"></i><i class="out" style="width:' + (100 - Math.round(sess.tin / sessTotal * 100)) + '%"></i></div>' : "") +
    '<div class="splitx"><span>вход ' + fmt(sess.tin) + '</span><span>выход ' + fmt(sess.tout) + '</span></div>' +
    '</section>' +
    '<section class="panel"><div class="panel-head"><h2>Активность</h2><span class="sub">сообщения за 7 дней</span></div>' +
    '<div class="chartbox">' + buckets.map((b, i) => '<i class="' + (i === days - 1 ? "today" : "") + '" style="height:' + Math.max(3, Math.round(b.n / max * 100)) + '%;animation-delay:' + (i * 30) + 'ms" title="' + b.n + '"></i>').join("") + '</div>' +
    '<div class="chartx">' + buckets.map(b => '<span>' + b.label + '</span>').join("") + '</div>' +
    '</section>' +
    '</div>';
}

/* ---------- account ---------- */
function planNameById(id) { return (PLANS[id] || PLANS.start).name; }
function renderAcc() {
  const a = state.account, s = state.settings;
  const all = totals(), sess = sessionStats();
  const dayUsed = a.dayUsed || 0, dayLimit = a.dayLimit || PLANS.start.day;
  const pctDaily = Math.min(100, Math.round(dayUsed / dayLimit * 100));
  const planId = (Object.keys(PLANS).find(k => PLANS[k].name === a.plan) || "start");
  $("#viewAcc").innerHTML = '<div class="page">' +
    '<header class="dhead"><div><h1>Аккаунт</h1><p>Профиль, тариф и статистика</p></div><button class="btn ghost sm" data-logout>Выйти</button></header>' +
    '<section class="profile"><span class="avatar xl">' + esc((a.name || "?").charAt(0).toUpperCase()) + '</span>' +
    '<div class="pinfo"><h2>' + esc(a.name || "Гость") + '</h2><p>' + esc(a.email || "email не указан") + '</p></div>' +
    '<span class="badge">' + esc(a.plan) + '</span></section>' +
    '<div class="accgrid">' +
    '<section class="panel"><div class="panel-head"><h2>Статистика</h2><span class="sub">' + state.chats.length + ' ' + plural(state.chats.length, "диалог", "диалога", "диалогов") + '</span></div>' +
    '<div class="tokgrid">' +
    '<div class="tok"><span>В сессии</span><b>' + fmt(sess.tin + sess.tout) + '</b><small>токенов · ' + sess.msgs + ' сообщ.</small></div>' +
    '<div class="tok"><span>Всего</span><b>' + fmt(all.tin + all.tout) + '</b><small>' + fmt(all.tin) + ' вход · ' + fmt(all.tout) + ' выход</small></div>' +
    '<div class="tok"><span>Диалогов</span><b>' + state.chats.length + '</b><small>история на аккаунте</small></div>' +
    '<div class="tok"><span>Модель</span><b class="sm">' + esc(currentModel().label) + '</b><small>меняется на ходу</small></div>' +
    '</div>' +
    '<div class="btnrow"><button class="btn ghost sm" type="button" data-open-chat>' + ICON.chat + 'К диалогу</button><button class="btn ghost sm" type="button" data-test-server>' + ICON.pulse + 'Проверить модель</button></div>' +
    '</section>' +
    '</div>' +
    '<section class="panel"><div class="panel-head"><h2>Тариф</h2><span class="sub">' + (a.role === "admin" ? "выберите подходящий" : "тариф вашего аккаунта") + '</span></div>' +
    '<div class="plan-grid">' + Object.keys(PLANS).filter(k => a.role === "admin" || k === planId || k === "start").map(k => {
      const p = PLANS[k], on = k === planId;
      const locked = a.role !== "admin" && !on;
      let btn;
      if (on) btn = '<button class="btn ghost sm" disabled>Текущий</button>';
      else if (a.role === "admin") btn = '<button class="btn primary sm" data-plan="' + k + '">Выбрать</button>';
      else btn = '<button class="btn ghost sm" disabled>Недоступно</button>';
      let badge = on ? '<span class="badge">текущий</span>' : (locked ? '<span class="badge">заблокирован</span>' : '');
      return '<div class="plan-card' + (on ? " on" : "") + (locked ? " locked" : "") + '"><div class="pc-head"><span class="pc-name">' + p.name + '</span>' + badge + '</div>' +
        '<div class="pc-price">' + (p.price ? p.price + ' <small>₽/мес</small>' : 'бесплатно') + '</div>' +
        '<div class="pc-meta">' + p.note + '</div>' +
        btn +
        '</div>';
    }).join("") + '</div>' +
    (a.role !== "admin" ? '<p class="plan-note">Смена тарифа пока недоступна. Аккаунт использует бесплатный тариф Start.</p>' : '') +
    '</section>' +
    (a.role === "admin" ? adminPanel() : "") +
    '<section class="panel"><div class="panel-head"><h2>Данные</h2><span class="sub">' + state.chats.length + ' ' + plural(state.chats.length, "диалог", "диалога", "диалогов") + ' · ' + fmt(all.tin + all.tout) + ' токенов</span></div>' +
    '<div class="datarow"><div><b>История диалогов</b><small>Хранится на аккаунте (в облаке)</small></div><button class="btn secondary sm" data-export>' + ICON.download + 'Экспорт</button></div>' +
    '<div class="datarow"><div><b>Очистить историю</b><small>Удалить все диалоги без возможности восстановления</small></div><button class="btn danger sm" data-wipe>Удалить</button></div>' +
    '</section>' +
    '</div>';
}

/* ---------- admin ---------- */
let adminUsers = [];
function adminPanel() {
  if (!adminUsers.length) { loadAdminUsers(); return '<section class="panel"><div class="panel-head"><h2>Админка</h2><span class="sub">загружаю…</span></div></section>'; }
  return '<section class="panel"><div class="panel-head"><h2>Админка</h2><span class="sub">пользователи и тарифы</span></div>' +
    '<div class="admin-table"><div class="admin-row head"><span>Email</span><span>План</span><span>Токенов</span><span></span></div>' +
    adminUsers.map(u => '<div class="admin-row"><span><b>' + esc(u.name) + '</b><small>' + esc(u.email) + '</small></span>' +
      '<span class="admin-plan"><select data-admin-plan="' + esc(u.email) + '">' + Object.keys(PLANS).map(k => '<option value="' + k + '"' + (k === u.plan ? " selected" : "") + '>' + PLANS[k].name + '</option>').join("") + '</select></span>' +
      '<span>' + fmt(u.dayUsed) + '</span>' +
      '<span' + (u.role === "admin" ? ' class="admin-tag"' : '') + '>' + (u.role === "admin" ? "админ" : "пользователь") + '</span></div>').join("") +
    '</div></section>';
}
function loadAdminUsers() {
  api("/admin/users").then(r => { adminUsers = r.users; renderAcc(); }).catch(() => {});
}
function changeAdminPlan(email, plan) {
  api("/admin/users", { method: "PATCH", body: JSON.stringify({ email, plan }) })
    .then(() => { loadAdminUsers(); toast("Тариф обновлён"); }).catch(err => toast(err.message || "Ошибка"));
}

/* ---------- render ---------- */
function renderAll() {
  $("#sideAvatar").textContent = (state.account.name || "?").charAt(0).toUpperCase();
  $("#sideName").textContent = state.account.name || "Гость";
  $("#sidePlan").textContent = state.account.planName || "Start";
  renderSidebar();
  renderThread();
  renderDash();
  renderAcc();
  updateCtx();
  paintModelPill();
  applyView();
}
function applyView() {
  const v = state.view || "chat";
  $("#viewChat").hidden = v !== "chat";
  $("#viewDash").hidden = v !== "dash";
  $("#viewAcc").hidden = v !== "acc";
  $$(".side-link,.side-user").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  const crumb = $("#crumb"); if (crumb) crumb.textContent = v === "dash" ? "Дашборд" : v === "acc" ? "Аккаунт" : (chat() ? chat().title : "Диалог");
  if (v === "chat") renderThread();
  updateCtx();
}
function setView(v) { state.view = v; save(); applyView(); }

/* ---------- toast/modal ---------- */
let toastTimer = null;
function toast(text) {
  const t = $("#toast");
  t.textContent = text; t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
}
function openModal(html) { $("#modalBox").innerHTML = html; $("#modal").hidden = false; }
function closeModal() { $("#modal").hidden = true; $("#modalBox").innerHTML = ""; }
function showBusyModal(idx) {
  if (!$("#modal").hidden) return;
  openModal('<div class="modal-form"><div class="modal-head"><h2>Модель нагружена</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<p class="hint">Ответа нет уже минуту. Выберите другую модель или подождите.</p><div class="picklist">' +
    Object.values(MODELS).map(m => '<button class="pickrow' + (m.id === state.model ? " on" : "") + '" data-switch="' + m.id + '"><b>' + provIcon(m) + esc(m.label) + '</b><small>контекст ' + m.ctx + ' · ' + esc(m.input) + '</small></button>').join("") +
    '</div><div class="modal-foot"><button type="button" class="btn ghost sm" data-close-modal>Подождать</button></div></div>');
}
function showLimitModal() {
  if (!$("#modal").hidden) return;
  const a = state.account || {};
  const used = a.dayUsed || 0, lim = a.dayLimit || (PLANS.start.day);
  openModal('<div class="modal-form limit-modal"><div class="modal-head"><h2>Лимит исчерпан</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<div class="limit-icon">&#9679;</div>' +
    '<p class="limit-title">Дневной лимит израсходован</p>' +
    '<p class="hint">Сегодня использовано <b>' + fmt(used) + ' / ' + fmt(lim) + '</b> токенов. Сообщение не отправлено.</p>' +
    '<p class="limit-hint">Пополните план — лимит станет больше и обновится завтра.</p>' +
    '<div class="modal-foot"><button type="button" class="btn ghost sm" data-close-modal>Закрыть</button><button type="button" class="btn primary sm" data-goto-acc>К тарифам</button></div></div>');
}
function modalModel() {
  if (!$("#modal").hidden) return;
  openModal('<div class="modal-form"><div class="modal-head"><h2>Модель</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<div class="mpick-list">' + modelListHTML() +
    '</div></div>');
}
function modalRename() {
  const c = chat(); if (!c) return;
  openModal('<form id="renameform" class="modal-form"><div class="modal-head"><h2>Переименовать диалог</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<label class="field"><span>Название</span><input name="title" value="' + esc(c.title) + '" maxlength="64"></label>' +
    '<div class="modal-foot"><button type="button" class="btn ghost sm" data-close-modal>Отмена</button><button class="btn primary sm">Сохранить</button></div></form>');
}

/* ---------- chat menu ---------- */
function modalChatMenu() {
  if (!$("#modal").hidden) return;
  const c = chat();
  if (!c) {
    openModal('<div class="modal-form"><div class="modal-head"><h2>Диалог</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
      '<p class="hint">Нет открытого диалога. Создайте новый — действия появятся здесь.</p><div class="picklist">' +
      '<button class="pickrow" data-new><b>' + ICON.edit + 'Новый диалог</b><small>Начать с чистого листа</small></button>' +
      '<button class="pickrow" data-export><b>' + ICON.download + 'Экспорт</b><small>Скачать все диалоги в JSON</small></button>' +
      '</div></div>');
    return;
  }
  openModal('<div class="modal-form"><div class="modal-head"><h2>Диалог</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<p class="hint">' + esc(c.title) + '</p><div class="picklist">' +
    '<button class="pickrow" data-rename><b>' + ICON.edit + 'Переименовать</b><small>Другое название в списке</small></button>' +
    '<button class="pickrow" data-new><b>Новый диалог</b><small>Начать с чистого листа</small></button>' +
    '<button class="pickrow" data-export><b>' + ICON.download + 'Экспорт</b><small>Скачать все диалоги в JSON</small></button>' +
    '<button class="pickrow" data-clear><b>' + ICON.trash + 'Очистить сообщения</b><small>Диалог останется, история уйдёт</small></button>' +
    '<button class="pickrow danger" data-delchat><b>' + ICON.trash + 'Удалить диалог</b><small>Без возможности восстановления</small></button>' +
    '</div></div>');
}
function modalDeleteChat() {
  const c = chat(); if (!c) return;
  openModal('<div class="modal-form"><div class="modal-head"><h2>Удалить диалог?</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
    '<p class="hint">«' + esc(c.title) + '» и все сообщения в нём будут удалены навсегда.</p>' +
    '<div class="modal-foot"><button type="button" class="btn ghost sm" data-close-modal>Отмена</button><button type="button" class="btn danger sm" data-delchat-yes>Удалить</button></div></div>');
}
function deleteChat(id) {
  const i = state.chats.findIndex(c => c.id === id);
  if (i < 0) return;
  state.chats.splice(i, 1);
  // Не создаём новый пустой диалог: после удаления последнего остаётся пустой экран
  if (!state.chats.length) state.currentId = null;
  else if (!state.chats.some(c => c.id === state.currentId)) state.currentId = state.chats[0].id;
  save(); closeModal(); renderAll(); toast("Диалог удалён");
}

/* ---------- export ---------- */
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
function exportChats() {
  download(new Blob([JSON.stringify({ account: state.account, chats: state.chats }, null, 2)], { type: "application/json" }), "origin-chats.json");
}

/* ---------- server check ---------- */
async function checkServer() {
  const m = currentModel();
  state.server.status = "loading"; save();
  try {
    const r = await fetch(m.base + "/health", { cache: "no-store" });
    state.server.status = r.ok ? "ok" : "error";
  } catch (e) { state.server.status = "error"; }
  save();
  toast(state.server.status === "ok" ? "Модель на связи" : "Модель не отвечает");
}

/* ---------- landing fx ---------- */
(function landingFx() {
  const cv = $("#landFx");
  if (cv && cv.getContext) {
    const ctx = cv.getContext("2d");
    let w, h, dots = [];
    const resize = () => {
      w = cv.width = cv.clientWidth; h = cv.height = cv.clientHeight;
      dots = Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + .4, v: Math.random() * .18 + .05 }));
    };
    resize();
    addEventListener("resize", resize);
    (function loop() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      dots.forEach(d => { d.y -= d.v; if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; } ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); });
      requestAnimationFrame(loop);
    })();
  }
  const glow = $("#landGlow");
  if (glow) addEventListener("pointermove", e => { glow.style.transform = "translate(" + (e.clientX - 320) + "px," + (e.clientY - 320) + "px)"; });
})();

/* ---------- composer ---------- */
let pendingText = "";
function autoGrow() {
  const p = $("#prompt"); if (!p) return;
  p.style.height = "auto";
  p.style.height = Math.min(180, p.scrollHeight) + "px";
}

/* ---------- events ---------- */
$("#signin").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  const email = f.email.value.trim();
  const pass = f.password.value;
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  f.email.classList.toggle("bad", !okEmail);
  f.password.classList.toggle("bad", pass.length < 6);
  if (!okEmail) return toast("Проверьте email");
  if (pass.length < 6) return toast("Пароль — минимум 6 символов");
  const btn = f.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    let res;
    try {
      res = await api("/login", { method: "POST", body: JSON.stringify({ email, password: pass }) });
    } catch (err) {
      if (err.status === 401) res = await api("/register", { method: "POST", body: JSON.stringify({ email, password: pass }) });
      else throw err;
    }
    authToken = res.token; localStorage.setItem("origin.token", authToken);
    applyUser(res.user);
    if (!state.account.name) state.account.name = email.split("@")[0];
    login(email, state.account.name);
    syncFromServer();
  } catch (err) {
    toast(err.message || "Не удалось войти");
  } finally { btn.disabled = false; }
});
$("[data-eye]").addEventListener("click", e => {
  const input = $('input[name="password"]');
  input.type = input.type === "password" ? "text" : "password";
  e.currentTarget.setAttribute("aria-label", input.type === "password" ? "Показать пароль" : "Скрыть пароль");
});
$("[data-forgot]").addEventListener("click", () => toast("Восстановление пароля появится позже"));
(function landingReveal() {
  const sc = $("#landScroll"), info = $("#landInfo"), arrow = $(".land-arrow");
  if (!sc || !info) return;
  const tick = () => {
    const on = sc.scrollTop > 30;
    info.classList.toggle("in", sc.scrollTop > 40);
    if (arrow) arrow.classList.toggle("hide", on);
  };
  sc.addEventListener("scroll", tick, { passive: true });
  tick();
})();
$$("[data-cta]").forEach(el => el.addEventListener("click", () => {
  // чат/логин всегда на /chat
  location.href = "/chat";
}));
$("[data-scroll-down]")?.addEventListener("click", () => {
  const sc = $("#landScroll"); if (sc) sc.scrollTo({ top: sc.clientHeight, behavior: "smooth" });
});
// назад из авторизации ведёт на главную (/ — всегда лендинг)
$("[data-back]").addEventListener("click", () => { location.href = "/"; });

/* параллакс главной: заголовок и кнопка реагируют на мышь (depth-сдвиг) */
(function heroParallax() {
  const hero = $(".land-hero");
  if (!hero) return;
  const words = $$(".land-title>.originline,.land-title>.dim");
  const cta = $(".cta-hero");
  let rafTL = 0;
  const onMove = e => {
    const x = e.clientX / innerWidth - .5;
    const y = e.clientY / innerHeight - .5;
    cancelAnimationFrame(rafTL);
    rafTL = requestAnimationFrame(() => {
      words.forEach((w, i) => {
        const d = (i === 0 ? 22 : 36);
        w.style.transform = "translate(" + (x * -d).toFixed(1) + "px," + (y * (d * .5)).toFixed(1) + "px)";
      });
      if (cta) cta.style.transform = "translate(" + (x * 12).toFixed(1) + "px," + (y * 8).toFixed(1) + "px)";
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(rafTL);
    words.forEach(w => w.style.transform = "");
    if (cta) cta.style.transform = "";
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseleave", onLeave);
  const sc = document.querySelector(".land-hero").parentElement;
  if (sc) {
    sc.dataset.parallax = "1";
    sc.addEventListener("scroll", () => {
      const y = sc.scrollTop / sc.clientHeight;
      const heroEl = $(".land-hero");
      if (heroEl) heroEl.style.transform = "translateY(" + (y * 60).toFixed(1) + "px)";
    }, { passive: true });
  }
})();

/* роутинг: главная (лендинг) на /, чат — только на /chat */
(function route() {
  const path = location.pathname.toLowerCase();
  if (path.endsWith("/chat") || (location.hash === "#chat")) {
    // чат всегда на /chat: авторизован — в приложение, нет — на логин
    screen = authToken ? "app" : "auth";
  } else {
    // всё остальное (/, главное меню) показывает лендинг, даже если пользователь авторизован
    screen = "landing";
  }
})();
applyAuth();

document.addEventListener("click", e => {
  const t = e.target;
  if (t.closest("[data-close-modal]") || t.id === "modal") { closeModal(); return; }
  if (t.closest("[data-chatmenu]")) { modalChatMenu(); return; }
  if (t.closest("[data-delchat-single]")) {
    e.stopPropagation();
    const id = t.closest("[data-delchat-single]").dataset.delchatSingle;
    const c = state.chats.find(x => x.id === id);
    if (!c) return;
    openModal('<div class="modal-form"><div class="modal-head"><h2>Удалить диалог?</h2><button type="button" class="iconbtn" data-close-modal aria-label="Закрыть">' + ICON.close + '</button></div>' +
      '<p class="hint">«' + esc(c.title) + '» и все сообщения в нём будут удалены навсегда.</p>' +
      '<div class="modal-foot"><button type="button" class="btn ghost sm" data-close-modal>Отмена</button><button type="button" class="btn danger sm" data-delchat-yes-id="' + id + '">Удалить</button></div></div>');
    return;
  }
  if (t.closest("[data-delchat-yes-id]")) { deleteChat(t.closest("[data-delchat-yes-id]").dataset.delchatYesId); return; }
  if (t.closest("[data-delchat]")) { modalDeleteChat(); return; }
  if (t.closest("[data-delchat-yes]")) { deleteChat(state.currentId); return; }
  if (t.closest("[data-new]")) { newChat(); setView("chat"); closeModal(); return; }
  if (t.closest("[data-goto-acc]")) { closeModal(); setView("acc"); return; }
  if (t.closest("[data-view]")) { setView(t.closest("[data-view]").dataset.view); return; }
  if (t.closest("[data-menu]")) { $("#side").classList.toggle("open"); $("#scrim").hidden = !$("#side").classList.contains("open"); return; }
  if (t.id === "scrim") { $("#side").classList.remove("open"); $("#scrim").hidden = true; return; }
  if (t.closest("[data-logout]")) { logout(); return; }
  if (t.closest("[data-export]")) { exportChats(); return; }
  if (t.closest("[data-open-chat]")) { setView("chat"); return; }
  if (t.closest("[data-test-server]")) { checkServer(); return; }
  if (t.closest("[data-rename]")) { closeModal(); modalRename(); return; }
  if (t.closest("[data-clear]")) { closeModal(); const c = chat(); if (c) { c.messages = []; c.title = "Новый диалог"; save(); renderThread(); renderSidebar(); toast("Диалог очищен"); } return; }
  if (t.closest("[data-plan]")) {
    const id = t.closest("[data-plan]").dataset.plan;
    api("/plan", { method: "POST", body: JSON.stringify({ plan: id }) }).then(r => { applyUser(r.user); renderAll(); toast("Тариф: " + r.user.planName); }).catch(err => toast(err.message || "Не удалось сменить тариф"));
    return;
  }
  if (t.closest("[data-switch]")) {
    const id = t.closest("[data-switch]").dataset.switch;
    state.model = id; save(); paintModelPill();
    closeModal(); renderAll(); toast("Модель: " + currentModel().label); return;
  }
  if (t.closest("[data-pick]")) {
    const id = t.closest("[data-pick]").dataset.pick;
    state.model = id; save(); paintModelPill();
    closeModal(); renderAll(); toast("Модель: " + currentModel().label);
    return;
  }
  if (t.closest("[data-copy]")) {
    const pre = t.closest(".codeblock").querySelector("code");
    navigator.clipboard.writeText(pre.textContent).then(() => toast("Скопировано"));
    return;
  }
  if (t.closest("[data-copy-msg]")) {
    const i = Number(t.closest("[data-copy-msg]").dataset.copyMsg);
    const c = chat(); if (!c) return;
    navigator.clipboard.writeText(parseThink(c.messages[i].text).answer).then(() => toast("Скопировано"));
    return;
  }
  if (t.closest("[data-copy-user-msg]")) {
    const i = Number(t.closest("[data-copy-user-msg]").dataset.copyUserMsg);
    const c = chat(); if (!c) return;
    navigator.clipboard.writeText(c.messages[i].text || "").then(() => toast("Скопировано"));
    return;
  }
  if (t.closest("[data-resend-msg]")) {
    const i = Number(t.closest("[data-resend-msg]").dataset.resendMsg);
    const c = chat(); if (!c) return;
    const txt = (c.messages[i] && c.messages[i].text) || "";
    if (txt) send(txt);
    return;
  }
  if (t.closest("[data-regen]")) {
    const i = Number(t.closest("[data-regen]").dataset.regen);
    const c = chat(); if (!c) return;
    c.messages.splice(i, 1);
    const idx = c.messages.length;
    c.messages.push({ role: "assistant", text: "", ts: Date.now(), pending: true, trace: ["Разбираю вопрос"], thought: "" });
    save(); renderThread(); runModel(c, idx); return;
  }
  if (t.closest("[data-suggest]")) {
    const v = t.closest("[data-suggest]").dataset.suggest;
    send(v); return;
  }
  const item = t.closest("[data-chat]");
  if (item) { state.currentId = item.dataset.chat; state.view = "chat"; save(); renderSidebar(); applyView(); return; }
  if (t.closest("#modelpill")) { modalModel(); return; }
});

$("#composer").addEventListener("submit", e => {
  e.preventDefault();
  const p = $("#prompt");
  const text = p.value.trim();
  if (!text) return;
  send(text);
});
$("#prompt").addEventListener("input", autoGrow);
$("#prompt").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").dispatchEvent(new Event("submit", { cancelable: true })); }
});
$("#stop").addEventListener("click", () => { if (state.abort) state.abort.abort(); });
$("#search").addEventListener("input", renderSidebar);

document.addEventListener("change", e => {
  const sel = e.target && e.target.closest("[data-admin-plan]");
  if (sel) { changeAdminPlan(sel.dataset.adminPlan, sel.value); }
});

document.addEventListener("submit", e => {
  if (e.target.id === "renameform") {
    e.preventDefault();
    const c = chat(); if (c) { c.title = e.target.title.value.trim().slice(0, 64) || c.title; save(); renderSidebar(); }
    closeModal();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!$("#modal").hidden) return closeModal();
    if (!$("#palette").hidden) return ($("#palette").hidden = true);
    if (state.abort) state.abort.abort();
  }
  if (e.key === "Enter" && e.target.classList && e.target.classList.contains("palette-input")) {}
});

/* boot */
state.view = state.view || "chat";
var heroCtaLabel = $("#ctaHeroLabel");
if (heroCtaLabel) heroCtaLabel.textContent = authToken ? "Продолжить" : "Присоединиться";
applyAuth();
$("#ctxpct").textContent = "0%";
updateCtx();

/* при загрузке синхронизируем данные с сервера: токены, диалоги и настройки
   хранятся в БД на аккаунте — ничего не лежит в localStorage */
if (authToken) {
  syncFromServer().then(() => { if (screen === "app") renderAll(); }).catch(() => {});
}

window.OriginChat = { login, logout, newChat, send, state, setView, showScreen, checkServer, searchWeb, planSearch, searchQueryFrom, renderAll };









