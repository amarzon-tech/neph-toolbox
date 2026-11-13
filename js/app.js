/**
 * Nephrology Toolbox UI. No network, no storage of inputs.
 */
(function () {
  "use strict";
  const cfg = window.NephConfig;
  const { SECTIONS, CALCULATORS } = window.NephCalculators;
  const F = window.NephFormulas;

  const DIM = {
    creatinine: { us: "mg/dL", si: "µmol/L", toUS: (x) => x / 88.4, toSI: (x) => x * 88.4 },
    bun: { us: "mg/dL (BUN)", si: "mmol/L (urea)", toUS: (x) => x * 2.8, toSI: (x) => x / 2.8 },
    glucose: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 18, toSI: (x) => x / 18 },
    calcium: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 4, toSI: (x) => x / 4 },
    phosphate: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 3.097, toSI: (x) => x / 3.097 },
    albumin: { us: "g/dL", si: "g/L", toUS: (x) => x / 10, toSI: (x) => x * 10 },
    acr: { us: "mg/g", si: "mg/mmol", toUS: (x) => x * 8.84, toSI: (x) => x / 8.84 },
    ica: { us: "mmol/L", si: "mmol/L", toUS: (x) => x, toSI: (x) => x },
  };

  const state = {
    units: "us", // "us" | "si"
    query: "",
    section: "all",
    calcId: null,
    values: {}, // raw field values as currently displayed (strings / seg values)
  };

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  function num(v) {
    if (v === "" || v == null) return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  }

  function unitLabel(field) {
    if (field.dim && DIM[field.dim]) return DIM[field.dim][state.units];
    return field.unit || "";
  }

  function toCanonical(field, displayed) {
    const x = num(displayed);
    if (x == null) return null;
    if (field.dim && DIM[field.dim] && state.units === "si") return DIM[field.dim].toUS(x);
    return x;
  }

  function convertDisplayed(value, dim, from, to) {
    const x = num(value);
    if (x == null || !dim || !DIM[dim] || from === to) return value;
    if (from === "us" && to === "si") return String(roundNice(DIM[dim].toSI(x)));
    if (from === "si" && to === "us") return String(roundNice(DIM[dim].toUS(x)));
    return value;
  }

  function roundNice(x) {
    if (!Number.isFinite(x)) return x;
    const a = Math.abs(x);
    const d = a >= 100 ? 1 : a >= 10 ? 2 : 3;
    return Number(x.toFixed(d));
  }

  function currentCalc() {
    return CALCULATORS.find((c) => c.id === state.calcId) || null;
  }

  function setView(name) {
    document.body.classList.remove("view-calc", "view-about");
    if (name === "calc") document.body.classList.add("view-calc");
    if (name === "about") document.body.classList.add("view-about");
  }

  function navigate() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const parts = hash.split("/").filter(Boolean);
    if (parts[0] === "about") {
      state.calcId = null;
      setView("about");
    } else if (parts[0] === "c" && parts[1]) {
      state.calcId = parts[1];
      state.values = {};
      setView("calc");
      renderCalc();
    } else {
      state.calcId = null;
      setView("home");
    }
  }

  function renderHome() {
    const q = state.query.trim().toLowerCase();
    const root = $("#home-sections");
    const nav = $("#section-nav");
    nav.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.textContent = "All";
    allBtn.setAttribute("aria-pressed", state.section === "all" ? "true" : "false");
    allBtn.addEventListener("click", () => { state.section = "all"; renderHome(); });
    nav.appendChild(allBtn);
    SECTIONS.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.title;
      b.setAttribute("aria-pressed", state.section === s.id ? "true" : "false");
      b.addEventListener("click", () => { state.section = s.id; renderHome(); });
      nav.appendChild(b);
    });

    const sections = SECTIONS.filter((s) => state.section === "all" || state.section === s.id);
    let html = "";
    let shown = 0;
    sections.forEach((s) => {
      const cards = CALCULATORS.filter((c) => {
        if (c.section !== s.id) return false;
        if (!q) return true;
        const blob = (c.title + " " + c.short + " " + (c.keywords || "") + " " + s.title).toLowerCase();
        return blob.indexOf(q) !== -1;
      });
      if (!cards.length) return;
      shown += cards.length;
      html += `<section class="section-block" id="sec-${s.id}">
        <h2>${esc(s.title)} <span>${cards.length} calculator${cards.length === 1 ? "" : "s"} · ${esc(s.blurb)}</span></h2>
        <div class="card-grid">
          ${cards.map((c) => `<a class="calc-card" href="#/c/${c.id}">
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.short)}</p>
            <span class="tag">${esc(s.title)}</span>
          </a>`).join("")}
        </div>
      </section>`;
    });
    if (!shown) html = `<p class="empty">No calculators match “${esc(state.query)}”.</p>`;
    root.innerHTML = html;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderCalc() {
    const c = currentCalc();
    const root = $("#calc-view");
    if (!c) {
      root.innerHTML = `<p class="empty">Calculator not found. <a href="#/">Back to the list</a>.</p>`;
      return;
    }
    const section = SECTIONS.find((s) => s.id === c.section);
    root.innerHTML = `
      <p class="calc-lede">${esc(section ? section.title : "")}</p>
      <h1>${esc(c.title)}</h1>
      <p class="calc-lede">${esc(c.short)}</p>
      <div class="calc-layout">
        <div class="panel" id="fields-panel">
          <div id="fields"></div>
        </div>
        <div class="results-col">
          <div class="panel">
            <div id="results" aria-live="polite"></div>
          </div>
          <div class="info-panel" style="margin-top:1rem">
            <details>
              <summary>Formula, citation &amp; caveats</summary>
              <div class="info-body">
                <h3>Equation</h3>
                <div class="eq">${esc(c.equation)}</div>
                <h3>Citation</h3>
                <p class="cite">${esc(c.citation.text)}
                  ${c.citation.doi ? `<br><a href="https://doi.org/${esc(c.citation.doi)}" target="_blank" rel="noopener">doi:${esc(c.citation.doi)}</a>` : ""}
                  ${c.citation.pmid ? ` · <a href="https://pubmed.ncbi.nlm.nih.gov/${esc(c.citation.pmid)}/" target="_blank" rel="noopener">PubMed ${esc(c.citation.pmid)}</a>` : ""}
                </p>
                <h3>Limitations</h3>
                <ul>${(c.caveats || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              </div>
            </details>
          </div>
        </div>
      </div>`;
    renderFields();
    renderResults();
  }

  function renderFields() {
    const c = currentCalc();
    const wrap = $("#fields");
    if (!c || !wrap) return;
    wrap.innerHTML = "";
    c.fields.forEach((f) => {
      const div = document.createElement("div");
      div.className = "field";
      const label = document.createElement("label");
      label.setAttribute("for", "f-" + f.key);
      label.innerHTML = esc(f.label) + (f.optional ? ' <span class="hint">(optional)</span>' : "") + (f.hint ? ` <span class="hint">· ${esc(f.hint)}</span>` : "");
      div.appendChild(label);

      if (f.type === "seg") {
        const seg = document.createElement("div");
        seg.className = "seg";
        seg.setAttribute("role", "group");
        seg.setAttribute("aria-label", f.label);
        const cur = state.values[f.key];
        f.options.forEach(([val, lab]) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = lab;
          b.setAttribute("aria-pressed", cur === val ? "true" : "false");
          b.addEventListener("click", () => {
            state.values[f.key] = val;
            renderFields();
            renderResults();
          });
          seg.appendChild(b);
        });
        div.appendChild(seg);
      } else {
        const row = document.createElement("div");
        row.className = "field-row";
        const input = document.createElement("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.step = "any";
        input.id = "f-" + f.key;
        input.autocomplete = "off";
        if (f.min != null) input.min = f.min;
        if (f.max != null) input.max = f.max;
        if (state.values[f.key] != null) input.value = state.values[f.key];
        input.addEventListener("input", () => {
          state.values[f.key] = input.value;
          renderResults();
        });
        row.appendChild(input);
        const u = unitLabel(f);
        if (u) {
          const span = document.createElement("span");
          span.className = "unit-label";
          span.textContent = u;
          row.appendChild(span);
        }
        div.appendChild(row);
      }
      wrap.appendChild(div);
    });
  }

  function collectCanonical() {
    const c = currentCalc();
    const out = {};
    c.fields.forEach((f) => {
      const raw = state.values[f.key];
      if (f.type === "seg") out[f.key] = raw || null;
      else out[f.key] = toCanonical(f, raw);
    });
    return out;
  }

  function renderResults() {
    const c = currentCalc();
    const box = $("#results");
    if (!c || !box) return;
    let result = null;
    try {
      result = c.compute(collectCanonical());
    } catch (e) {
      box.innerHTML = `<p class="placeholder">${esc(e.message)}</p>`;
      return;
    }
    if (!result) {
      box.innerHTML = `<p class="placeholder">Enter the required values. Results update as you type. Nothing is stored.</p>`;
      return;
    }
    let html = `<div class="results">
      <div class="result-main">
        <div class="name">${esc(result.primary.name)}</div>
        <div class="value">${esc(result.primary.value)}<span class="unit">${esc(result.primary.unit || "")}</span></div>
      </div>`;
    (result.extra || []).forEach((r) => {
      html += `<div class="result-row"><span class="name">${esc(r.name)}</span><span class="value">${esc(r.value)} ${esc(r.unit || "")}</span></div>`;
    });
    html += `</div>`;
    if (result.chips && result.chips.length) {
      html += `<div style="margin-top:.75rem">`;
      result.chips.forEach((ch) => {
        html += `<span class="chip chip-${esc(ch.kind)}">${esc(ch.text)}</span>`;
      });
      html += `</div>`;
    }
    if (result.notes && result.notes.length) {
      html += result.notes.map((n) => `<p class="interp">${esc(n)}</p>`).join("");
    }
    box.innerHTML = html;
  }

  function setUnits(next) {
    if (next === state.units) return;
    const prev = state.units;
    const c = currentCalc();
    if (c) {
      c.fields.forEach((f) => {
        if (f.dim && state.values[f.key] != null && state.values[f.key] !== "") {
          state.values[f.key] = convertDisplayed(state.values[f.key], f.dim, prev, next);
        }
      });
    }
    state.units = next;
    $$(".unit-toggle button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.units === next ? "true" : "false");
    });
    if (c) {
      renderFields();
      renderResults();
    }
  }

  function init() {
    $("#draft-banner").textContent = cfg.DRAFT ? cfg.DRAFT_BANNER : "";
    $("#draft-banner").hidden = !cfg.DRAFT;
    $("#app-name").textContent = cfg.APP_NAME;
    $("#app-sub").textContent = "Draft · " + cfg.PUBLISHER;
    $("#support-email").textContent = cfg.SUPPORT_EMAIL;
    $("#support-email").href = "mailto:" + cfg.SUPPORT_EMAIL;
    $("#version").textContent = cfg.APP_VERSION;

    $("#search").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderHome();
    });
    $$(".unit-toggle button").forEach((b) => {
      b.addEventListener("click", () => setUnits(b.dataset.units));
    });
    $("#back-btn").addEventListener("click", () => { location.hash = "#/"; });

    window.addEventListener("hashchange", () => {
      navigate();
      if (!state.calcId) renderHome();
    });
    renderHome();
    navigate();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () { /* offline setup is best-effort */ });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
