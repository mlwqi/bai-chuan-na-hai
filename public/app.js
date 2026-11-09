(function () {
  "use strict";

  const app = document.getElementById("app");
  const themeSwitch = document.getElementById("theme-switch");
  const tocToggle = document.getElementById("toc-toggle");
  const backBtn = document.getElementById("back-btn");
  const backtop = document.getElementById("backtop");
  const THEMES = ["paper", "eye", "night"];

  const state = {
    catalog: null,
    topic: null,
    theme: "paper",
    activeSection: "",
  };

  init();

  function init() {
    initTheme();
    bindTheme();
    bindBacktop();
    window.addEventListener("hashchange", route);
    route();
  }

  /* ---------- Routing ---------- */

  async function route() {
    document.body.classList.remove("toc-open");
    const r = parseHash();
    if (r.view === "topic") {
      await renderTopic(r.id);
    } else {
      await renderHome();
    }
  }

  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#\/?/, "");
    const parts = raw.split("?")[0].split("/").filter(Boolean);
    if (parts[0] === "topic" && parts[1]) {
      return { view: "topic", id: decodeURIComponent(parts[1]) };
    }
    return { view: "home" };
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("加载失败：" + res.status);
    return res.json();
  }

  async function loadCatalog() {
    if (!state.catalog) state.catalog = await fetchJSON("./data/catalog.json");
    return state.catalog;
  }

  /* ---------- Home ---------- */

  async function renderHome() {
    setTocToggle(false);
    backBtn.hidden = true;
    backtop.hidden = true;
    app.innerHTML = '<div class="loading">正在加载主题目录……</div>';
    let catalog;
    try {
      catalog = await loadCatalog();
    } catch (err) {
      renderError(err);
      return;
    }

    const topics = catalog.topics || [];
    const cards = topics
      .map(
        (t, i) => `
        <a class="topic-card" href="#/topic/${encodeURIComponent(t.id)}">
          <div class="topic-index">${String(i + 1).padStart(2, "0")}</div>
          <div class="topic-body">
            <h3>${esc(t.title)}</h3>
            <div class="tagrow">
              ${(t.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}
              <span class="tag">${t.sectionCount || 0} 部类</span>
            </div>
          </div>
          <div class="topic-meta">
            <strong>${t.textCount || 0}</strong><span>部经论</span>
            <strong>${t.entryCount || 0}</strong><span>条文句</span>
            <span class="arrow" aria-hidden="true">→</span>
          </div>
        </a>`
      )
      .join("");

    app.innerHTML = `
      <section class="catalog">
        <div class="section-head">
          <h2>主题目录</h2>
          <span>${topics.length} 个主题</span>
        </div>
        <div class="topic-grid">${cards || '<p class="empty-search">暂无主题。</p>'}</div>
      </section>`;
  }

  /* ---------- Topic ---------- */

  async function renderTopic(id) {
    setTocToggle(false);
    app.innerHTML = '<div class="loading">正在加载主题……</div>';
    let topic;
    try {
      const catalog = await loadCatalog();
      if (!(catalog.topics || []).some((t) => t.id === id)) {
        throw new Error("未找到这个主题。");
      }
      topic = await fetchJSON("./data/topics/" + encodeURIComponent(id) + ".json");
      state.topic = topic;
    } catch (err) {
      renderError(err);
      return;
    }

    setTocToggle(true);
    backBtn.hidden = false;
    document.title = topic.title + " · 佰川纳海，积微知化";

    const toc = topic.sections
      .map(
        (s, i) => `
        <button class="toc-link" type="button" data-target="s${i + 1}">
          <span class="idx">${String(i + 1).padStart(2, "0")}</span>
          <span>${esc(displayTitle(s.title))}</span>
        </button>`
      )
      .join("");

    app.innerHTML = `
      <header class="topic-head">
        <h1>${esc(topic.title)}</h1>
      </header>
      <div class="layout">
        <aside class="toc" id="toc">
          <div class="toc-head">目录</div>
          <nav class="toc-list">${toc}</nav>
        </aside>
        <article class="article" id="article"></article>
      </div>`;

    renderArticle();
    bindTopicEvents(topic);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function bindTopicEvents(topic) {
    tocToggle.onclick = () => {
      document.body.classList.toggle("toc-open");
    };

    document.querySelectorAll(".toc-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        document.body.classList.remove("toc-open");
      });
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateActiveSection(topic);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateActiveSection(topic);
  }

  function updateActiveSection(topic) {
    let current = "";
    topic.sections.forEach((s, i) => {
      const el = document.getElementById("s" + (i + 1));
      if (el && el.getBoundingClientRect().top <= 120) current = "s" + (i + 1);
    });
    if (current === state.activeSection) return;
    state.activeSection = current;
    document.querySelectorAll(".toc-link").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-target") === current);
    });
    backtop.hidden = window.scrollY < 600;
  }

  function renderArticle() {
    const topic = state.topic;
    let html = "";

    topic.sections.forEach((section, si) => {
      const texts = section.texts
        .map((text, ti) => {
          const entries = text.entries
            .map(
              (entry) => `
              <article class="entry">
                <div class="entry-head">
                  <span class="entry-label">${esc(entry.label)}</span>
                  <span class="entry-source">${esc(entry.source)}</span>
                </div>
                <blockquote class="quote">${esc(entry.quote)}</blockquote>
                <p class="explain">${esc(entry.explain)}</p>
              </article>`
            )
            .join("");
          const notes = text.notes
            .map((n) => `<div class="note">${esc(n)}</div>`)
            .join("");
          return `
            <div class="text-block" id="s${si + 1}-t${ti + 1}">
              <h3 class="text-title">${esc(text.title)}</h3>
              ${notes}
              ${entries}
            </div>`;
        })
        .join("");

      html += `
        <section class="part" id="s${si + 1}">
          <header class="part-head">
            <span class="part-no">${String(si + 1).padStart(2, "0")}</span>
            <h2>${esc(displayTitle(section.title))}</h2>
          </header>
          ${texts}
        </section>`;
    });

    document.getElementById("article").innerHTML = html;
  }

  /* ---------- Helpers ---------- */

  function setTocToggle(show) {
    tocToggle.hidden = !show;
    if (!show) {
      document.body.classList.remove("toc-open");
      document.title = "佰川纳海，积微知化";
    }
  }

  function bindTheme() {
    themeSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme-opt]");
      if (!btn) return;
      setTheme(btn.getAttribute("data-theme-opt"), true);
    });
  }

  function initTheme() {
    const saved = localStorage.getItem("bcnh-theme");
    setTheme(THEMES.includes(saved) ? saved : "paper", false);
  }

  function setTheme(theme, persist) {
    if (!THEMES.includes(theme)) return;
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    if (persist !== false) localStorage.setItem("bcnh-theme", theme);
    themeSwitch.querySelectorAll("[data-theme-opt]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-opt") === theme;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function bindBacktop() {
    window.addEventListener(
      "scroll",
      () => {
        backtop.hidden = window.scrollY < 600;
      },
      { passive: true }
    );
    backtop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function displayTitle(title) {
    return String(title || "").replace(/^[一二三四五六七八九十]+、/, "");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderError(err) {
    setTocToggle(false);
    backBtn.hidden = true;
    app.innerHTML = `
      <div class="empty-search">
        <p><strong>加载失败。</strong></p>
        <p>${esc(err && err.message ? err.message : String(err))}</p>
        <p>请通过本地服务器访问，而不是直接双击打开 HTML 文件。</p>
        <p><a href="#/">← 返回主题目录</a></p>
      </div>`;
  }
})();
