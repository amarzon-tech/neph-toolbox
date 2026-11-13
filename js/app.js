/**
 * Nephrology Toolbox UI. No network. Patient inputs are never stored.
 * Favorites and recents store only calculator ids on this device.
 */
(function () {
  "use strict";
  const cfg = window.NephConfig;
  const { SECTIONS, CALCULATORS } = window.NephCalculators;

  const DIM = {
    creatinine: { us: "mg/dL", si: "µmol/L", toUS: (x) => x / 88.4, toSI: (x) => x * 88.4 },
    bun: { us: "mg/dL (BUN)", si: "mmol/L (urea)", toUS: (x) => x * 2.8, toSI: (x) => x / 2.8 },
    glucose: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 18, toSI: (x) => x / 18 },
    calcium: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 4, toSI: (x) => x / 4 },
    phosphate: { us: "mg/dL", si: "mmol/L", toUS: (x) => x * 3.097, toSI: (x) => x / 3.097 },
    albumin: { us: "g/dL", si: "g/L", toUS: (x) => x / 10, toSI: (x) => x / 1 * 10 },
    acr: { us: "mg/g", si: "mg/mmol", toUS: (x) => x * 8.84, toSI: (x) => x / 8.84 },
    ica: { us: "mmol/L", si: "mmol/L", toUS: (x) => x, toSI: (x) => x },
  };

  const CHIP = {
    kidney: "Kidney",
    electrolytes: "Electrolytes",
    acidbase: "Acid–Base",
    proteinuria: "Proteinuria",
    hd: "Hemodialysis",
    crrt: "CRRT",
    pd: "PD",
  };

  const FAV_KEY = "neph-toolbox-favs";
  const REC_KEY = "neph-toolbox-recents";
  const UNIT_KEY = "neph-toolbox-units";

  const state = {
    units: "us",
    fieldUnits: {},
    query: "",
    section: "all",
    calcId: null,
    values: {},
    favs: [],
    recents: [],
    lastPrimary: null,
  };

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function num(v) {
    if (v === "" || v == null) return null;
    const x = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(x) ? x : null;
  }

  function fieldUnit(field) {
    if (!field.dim || !DIM[field.dim]) return null;
    return state.fieldUnits[field.key] || state.units;
  }

  function unitLabel(field) {
    const dim = field.dim && DIM[field.dim];
    if (dim) return dim[fieldUnit(field)];
    return field.unit || "";
  }

  function canToggleUnits(field) {
    const dim = field.dim && DIM[field.dim];
    return !!(dim && dim.us !== dim.si);
  }

  function toCanonical(field, displayed) {
    const x = num(displayed);
    if (x == null) return null;
    if (field.dim && DIM[field.dim] && fieldUnit(field) === "si") return DIM[field.dim].toUS(x);
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

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ── device-only prefs (ids and unit system — never inputs) ─────────── */

  function readList(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(v)) return [];
      const known = new Set(CALCULATORS.map((c) => c.id));
      return v.filter((x) => typeof x === "string" && known.has(x));
    } catch (e) {
      return [];
    }
  }

  function writeList(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { /* private mode */ }
  }

  function isFav(id) { return state.favs.indexOf(id) !== -1; }

  function toggleFav(id, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (isFav(id)) state.favs = state.favs.filter((x) => x !== id);
    else state.favs = [id].concat(state.favs.filter((x) => x !== id));
    writeList(FAV_KEY, state.favs);
    syncFavButton();
    if (!state.calcId) renderHome();
  }

  function pushRecent(id) {
    state.recents = [id].concat(state.recents.filter((x) => x !== id)).slice(0, 8);
    writeList(REC_KEY, state.recents);
  }

  /* ── icons (SF-symbol-like, 24 viewBox) ─────────────────────────────── */

  const ICONS = {
    kidney: '<path d="M12 4.5c-3.2 0-5.5 2.8-6.2 5.7C5.2 12.4 5 14.6 5 16.2 5 19.2 6.4 21.5 8.6 22.2 9.8 20.6 10.5 18 10.5 15c0-1.4.2-3.2.8-4.6.5 1.4.7 3.2.7 4.6 0 3 .7 5.6 1.9 7.2C16.1 21.5 17.5 19.2 17.5 16.2c0-1.6-.2-3.8-.8-6C16 7.3 13.7 4.5 12 4.5z"/>',
    kidneyPlus: '<path d="M10.6 4.8c-2.9 0-5 2.6-5.6 5.2C4.6 12.2 4.4 14.2 4.4 15.6c0 2.7 1.2 4.8 3.2 5.4 1.1-1.5 1.7-3.8 1.7-6.5 0-1.3.2-2.9.7-4.2.5 1.3.6 2.9.6 4.2 0 2.7.6 5 1.7 6.5 2-.6 3.2-2.7 3.2-5.4 0-1.4-.2-3.4-.6-5.6-.6-2.6-2.7-5.2-5.6-5.2z"/><circle cx="18" cy="18" r="3.3"/><path d="M18 16.4v3.2M16.4 18h3.2"/>',
    flask: '<path d="M9.5 3.5h5M10 3.5v5.2L5.8 20.2A1.6 1.6 0 0 0 7.3 22.5h9.4a1.6 1.6 0 0 0 1.5-2.3L14 8.7V3.5"/><path d="M8.6 14.5h6.8"/>',
    chart: '<path d="M4.5 19.5h15"/><path d="M7 16.5v-3M12 16.5V8.5M17 16.5V5.5"/>',
    trend: '<path d="M4 17.5 9.2 11l3.6 3.4L20 6.5"/><path d="M14.5 6.5H20v5.5"/>',
    na: '<path d="M17.5 6.5 6.5 17.5"/><circle cx="8" cy="8" r="2.15"/><circle cx="16" cy="16" r="2.15"/>',
    urea: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="15" r="3"/><path d="M11.2 11.2 12.8 12.8"/>',
    gap: '<path d="M5 12h4M15 12h4M10.2 8.5 13.8 12l-3.6 3.5"/>',
    osm: '<circle cx="12" cy="12" r="7.5"/><path d="M12 7.5v9M8.5 10.5h7"/>',
    glucose: '<path d="M12 3.8c2.6 3.3 6.5 7 6.5 10.4A6.5 6.5 0 1 1 5.5 14.2C5.5 10.8 9.4 7.1 12 3.8z"/>',
    water: '<path d="M12 3.5C12 3.5 6.5 10.2 6.5 14.2a5.5 5.5 0 0 0 11 0C17.5 10.2 12 3.5 12 3.5z"/>',
    lungs: '<path d="M12 5.5v13"/><path d="M12 8.5C9 8.5 6 10 5.2 13.5 4.6 16 5.5 19.5 8 20c1.4-2 2.4-5 2.6-7.8"/><path d="M12 8.5C15 8.5 18 10 18.8 13.5c.6 2.5-.3 6-2.8 6.5-1.4-2-2.4-5-2.6-7.8"/>',
    delta: '<path d="M12 5 20 19H4z"/>',
    balance: '<path d="M12 4v16M7 20h10"/><path d="M12 7 6.5 14.5h11L12 7z"/>',
    protein: '<path d="M5 16.5c2-5 5-9 7-12 2 3 5 7 7 12"/><path d="M7.5 16.5h9"/><circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none"/><circle cx="15" cy="12.5" r="0.8" fill="currentColor" stroke="none"/>',
    albumin: '<circle cx="12" cy="12" r="7.5"/><path d="M9 15.2c1.1 1 4.9 1 6 0"/>',
    dialysis: '<rect x="4.5" y="5.5" width="15" height="13" rx="2"/><path d="M8 5.5V3.8M16 5.5V3.8M8 18.5v1.7M16 18.5v1.7"/><path d="M8 10h8M8 13.5h5"/>',
    proteinBar: '<path d="M5 18.5V8.5h3.5v10M10.5 18.5V5.5h3.5v13M16 18.5v-7h3v7"/>',
    flow: '<path d="M4 8.5h11a3.5 3.5 0 1 1 0 7H8.5"/><path d="m7 6.5-3 2 3 2M8.5 18.5l3-2-3-2"/>',
    body: '<circle cx="12" cy="6" r="2.3"/><path d="M7 20.5v-4.2A5 5 0 0 1 12 11.5a5 5 0 0 1 5 4.8v4.2"/>',
    continuous: '<path d="M3.5 12c2.2-6 4.6-6 6.6 0s4.4 6 6.6 0 4.4-6 6.8 0"/>',
    calcium: '<path d="M8 19.5 12 4.5l4 15"/><path d="M9.3 14.5h5.4"/>',
    pd: '<circle cx="12" cy="12" r="7.5"/><path d="M12 7.5v9M8.5 11.2H12c1.8 0 3 1 3 2.5s-1.3 2.8-3.2 2.8"/>',
    membrane: '<path d="M5 6.5h14M5 17.5h14"/><path d="M8 6.5v11M12 6.5v11M16 6.5v11"/>',
    residual: '<path d="M12 4.5c-3 0-5.2 2.6-5.9 5.4C5.5 12 5.4 14 5.4 15.5c0 2.6 1.1 4.7 3 5.5 1-1.5 1.7-3.8 1.7-6.5"/><path d="M14.5 12.5h5.2v5.8h-5.2z"/>',
    default: '<circle cx="12" cy="12" r="7.5"/>',
  };

  const CALC_ICON = {
    "egfr-2021-cr": "kidney",
    "egfr-2021-crcys": "kidneyPlus",
    "egfr-2012-cys": "water",
    "cockcroft-gault": "flask",
    "kfre-4": "chart",
    "kfre-8": "trend",
    "fena": "na",
    "feurea": "urea",
    "anion-gap": "gap",
    "osmolal-gap": "osm",
    "na-correction": "glucose",
    "free-water-deficit": "water",
    "winters": "lungs",
    "delta-delta": "delta",
    "compensation": "balance",
    "upcr": "protein",
    "uacr": "albumin",
    "hd-dose": "dialysis",
    "npcr": "proteinBar",
    "ufr": "flow",
    "watson": "body",
    "crrt-dose": "continuous",
    "citrate-ca": "calcium",
    "pd-adequacy": "pd",
    "pet": "membrane",
    "rkf": "residual",
  };

  function iconSvg(id, section) {
    const key = CALC_ICON[id] || "default";
    const path = ICONS[key] || ICONS.default;
    return `<span class="icon-tile s-${esc(section)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
  }

  const STAR_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.6 14.7 9l6 .9-4.3 4.2 1 5.9L12 17.2 6.6 20l1-5.9L3.3 9.9l6-.9L12 3.6z"/></svg>';
  const STAR_FILL = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.6 14.7 9l6 .9-4.3 4.2 1 5.9L12 17.2 6.6 20l1-5.9L3.3 9.9l6-.9L12 3.6z"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>';

  /* ── home ────────────────────────────────────────────────────────────── */

  function matchesQuery(c, s, q) {
    if (!q) return true;
    const blob = (c.title + " " + c.short + " " + (c.keywords || "") + " " + s.title).toLowerCase();
    return blob.indexOf(q) !== -1;
  }

  function cardHtml(c, s) {
    const fav = isFav(c.id);
    return `<a class="calc-card" href="#/c/${esc(c.id)}" data-id="${esc(c.id)}">
      ${iconSvg(c.id, c.section)}
      <div class="card-copy">
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.short)}</p>
      </div>
      <span class="card-chevron">
        <button type="button" class="star-mini" data-fav="${esc(c.id)}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}" aria-pressed="${fav ? "true" : "false"}">${fav ? STAR_FILL : STAR_OUT}</button>
        ${CHEV}
      </span>
    </a>`;
  }

  function listBlock(title, cards, countLabel) {
    if (!cards.length) return "";
    const items = cards.map(({ c, s }) => cardHtml(c, s)).join("");
    return `<section class="section-block">
      <div class="section-head"><h2>${esc(title)}</h2><span class="count">${esc(countLabel || (cards.length + ""))}</span></div>
      <div class="card-list">${items}</div>
    </section>`;
  }

  function renderHome() {
    const q = state.query.trim().toLowerCase();
    const nav = $("#section-nav");
    nav.innerHTML = "";
    const chips = [{ id: "all", label: "All" }].concat(SECTIONS.map((s) => ({ id: s.id, label: CHIP[s.id] || s.title })));
    chips.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = ch.label;
      b.setAttribute("aria-pressed", state.section === ch.id ? "true" : "false");
      b.addEventListener("click", () => {
        state.section = ch.id;
        renderHome();
        $("#home-body").scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
      });
      nav.appendChild(b);
    });

    const byId = Object.fromEntries(CALCULATORS.map((c) => [c.id, c]));
    const secOf = (c) => SECTIONS.find((s) => s.id === c.section);

    let html = "";
    const showRails = !q && state.section === "all";
    if (showRails && state.favs.length) {
      const cards = state.favs.map((id) => byId[id]).filter(Boolean).map((c) => ({ c, s: secOf(c) }));
      html += listBlock("Favorites", cards, cards.length + "");
    }
    if (showRails && state.recents.length) {
      const cards = state.recents.map((id) => byId[id]).filter(Boolean).map((c) => ({ c, s: secOf(c) }));
      html += listBlock("Recents", cards, "On this device");
    }

    const sections = SECTIONS.filter((s) => state.section === "all" || state.section === s.id);
    let shown = 0;
    sections.forEach((s) => {
      const cards = CALCULATORS.filter((c) => c.section === s.id && matchesQuery(c, s, q)).map((c) => ({ c, s }));
      if (!cards.length) return;
      shown += cards.length;
      html += listBlock(s.title, cards, cards.length + " calculator" + (cards.length === 1 ? "" : "s"));
    });
    if (!shown) html += `<p class="empty">No calculators match “${esc(state.query)}”.</p>`;
    $("#home-body").innerHTML = html;
    $$(".star-mini", $("#home-body")).forEach((btn) => {
      btn.addEventListener("click", (e) => toggleFav(btn.getAttribute("data-fav"), e));
    });
  }

  /* ── calculator screen ───────────────────────────────────────────────── */

  function openScreen(which) {
    const calc = $("#calc");
    const about = $("#about");
    const home = $("#home");
    const target = which === "about" ? about : which === "calc" ? calc : null;
    [calc, about].forEach((el) => {
      if (el !== target) {
        el.classList.remove("is-open");
        const hide = () => { if (!el.classList.contains("is-open")) el.hidden = true; };
        if (reduceMotion()) hide();
        else setTimeout(hide, 430);
      }
    });
    if (target) {
      target.hidden = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => target.classList.add("is-open"));
      });
      document.body.classList.add("is-pushed");
    } else {
      document.body.classList.remove("is-pushed");
    }
    home.classList.toggle("is-dimmed", !!target);
    home.setAttribute("aria-hidden", target ? "true" : "false");
    if ("inert" in home) home.inert = !!target;
  }

  function renderCalc() {
    const c = currentCalc();
    if (!c) {
      $("#calc-title").textContent = "Calculator not found";
      $("#fields").innerHTML = `<p class="placeholder"><a href="#/">Back to the list</a></p>`;
      return;
    }
    const section = SECTIONS.find((s) => s.id === c.section);
    $("#calc-section-label").textContent = section ? section.title : "";
    $("#calc-title").textContent = c.title;
    $("#calc-nav-title").textContent = c.title;
    $("#calc-nav-title").classList.remove("is-shown");
    $("#calc-lede").textContent = c.short;
    state.values = {};
    state.fieldUnits = {};
    state.lastPrimary = null;
    syncFavButton();
    renderFields();
    renderResults();
    $("#calc-scroll").scrollTop = 0;
    buildSheet(c);
  }

  function syncFavButton() {
    const btn = $("#fav-btn");
    if (!btn || !state.calcId) return;
    const on = isFav(state.calcId);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
  }

  function renderFields() {
    const c = currentCalc();
    const wrap = $("#fields");
    if (!c || !wrap) return;
    wrap.innerHTML = "";
    c.fields.forEach((f) => {
      const div = document.createElement("div");
      div.className = "field";
      div.dataset.key = f.key;
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
            $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
            renderResults();
          });
          seg.appendChild(b);
        });
        div.appendChild(seg);
      } else {
        const row = document.createElement("div");
        row.className = "field-row";
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "decimal";
        input.enterKeyHint = "next";
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.spellcheck = false;
        input.id = "f-" + f.key;
        input.setAttribute("aria-label", f.label + (unitLabel(f) ? ", " + unitLabel(f) : ""));
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
          const pill = document.createElement("button");
          pill.type = "button";
          pill.className = "unit-pill" + (canToggleUnits(f) ? "" : " is-static");
          pill.textContent = u;
          pill.dataset.key = f.key;
          if (canToggleUnits(f)) {
            pill.setAttribute("aria-label", "Toggle units, currently " + u);
            pill.addEventListener("click", () => toggleFieldUnit(f));
          } else {
            pill.disabled = true;
            pill.setAttribute("aria-label", u);
          }
          row.appendChild(pill);
        }
        div.appendChild(row);
      }
      wrap.appendChild(div);
    });
  }

  function toggleFieldUnit(field) {
    if (!canToggleUnits(field)) return;
    const from = fieldUnit(field);
    const to = from === "us" ? "si" : "us";
    if (state.values[field.key] != null && state.values[field.key] !== "") {
      state.values[field.key] = convertDisplayed(state.values[field.key], field.dim, from, to);
    }
    state.fieldUnits[field.key] = to;
    const input = $("#f-" + field.key);
    const pill = document.querySelector('.unit-pill[data-key="' + field.key + '"]');
    if (input) {
      input.value = state.values[field.key] != null ? state.values[field.key] : "";
      input.setAttribute("aria-label", field.label + ", " + unitLabel(field));
    }
    if (pill) {
      pill.textContent = unitLabel(field);
      pill.setAttribute("aria-label", "Toggle units, currently " + unitLabel(field));
    }
    renderResults();
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

  function visualKind(ch) {
    const u = String((ch && ch.text) || "").toUpperCase().replace(/[–—]/g, "-");
    if (/\bG5\b/.test(u) || /\bA3\b/.test(u)) return "danger";
    if (/\bG4\b/.test(u) || /\bG3B\b/.test(u)) return "warn";
    if (/\bG3A\b/.test(u) || /\bG3\b/.test(u)) return "caution";
    if (/\bG1\b/.test(u) || /\bA1\b/.test(u)) return "ok";
    if (/\bG2\b/.test(u) || /\bA2\b/.test(u)) return "info";
    if (/HIGH TRANSPORTER/.test(u) && !/AVERAGE/.test(u)) return "warn";
    if (/LOW TRANSPORTER/.test(u) && !/AVERAGE/.test(u)) return "info";
    return (ch && ch.kind) || "info";
  }
  function strongestTone(kinds) {
    const rank = { danger: 4, warn: 3, caution: 2, info: 1, ok: 1 };
    let best = "", n = 0;
    kinds.forEach((k) => {
      const r = rank[k] || 0;
      if (r > n) { n = r; best = k; }
    });
    return best;
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
      state.lastPrimary = null;
      return;
    }
    if (!result) {
      box.innerHTML = `<p class="placeholder">Enter the values. The result updates as you type — nothing is stored.</p>`;
      state.lastPrimary = null;
      return;
    }
    const changed = state.lastPrimary !== null && state.lastPrimary !== String(result.primary.value);
    state.lastPrimary = String(result.primary.value);
    const chipKinds = (result.chips || []).map(visualKind);
    const tone = strongestTone(chipKinds);
    let html = `<div class="result-main${tone ? " tone-" + tone : ""}">
        <div class="name">${esc(result.primary.name)}</div>
        <div class="value${changed && !reduceMotion() ? " is-updating" : ""}">${esc(result.primary.value)}<span class="unit">${esc(result.primary.unit || "")}</span></div>
      </div>`;
    (result.extra || []).forEach((r) => {
      html += `<div class="result-row"><span class="name">${esc(r.name)}</span><span class="value">${esc(r.value)} ${esc(r.unit || "")}</span></div>`;
    });
    if (result.chips && result.chips.length) {
      html += `<div class="chip-row">`;
      result.chips.forEach((ch, i) => {
        html += `<span class="chip chip-${esc(chipKinds[i])}">${esc(ch.text)}</span>`;
      });
      html += `</div>`;
    }
    if (result.notes && result.notes.length) {
      html += result.notes.map((n) => `<p class="interp">${esc(n)}</p>`).join("");
    }
    box.innerHTML = html;
  }

  function setUnits(next) {
    if (next === state.units && Object.keys(state.fieldUnits).length === 0) {
      syncUnitToggle();
      return;
    }
    const c = currentCalc();
    if (c) {
      c.fields.forEach((f) => {
        if (!f.dim || !DIM[f.dim]) return;
        const from = fieldUnit(f);
        if (state.values[f.key] != null && state.values[f.key] !== "") {
          state.values[f.key] = convertDisplayed(state.values[f.key], f.dim, from, next);
        }
      });
    }
    state.units = next;
    state.fieldUnits = {};
    try { localStorage.setItem(UNIT_KEY, next); } catch (e) { /* ignore */ }
    syncUnitToggle();
    if (c) {
      // update pills and inputs in place
      c.fields.forEach((f) => {
        if (f.type === "seg") return;
        const input = $("#f-" + f.key);
        const pill = document.querySelector('.unit-pill[data-key="' + f.key + '"]');
        if (input && state.values[f.key] != null) input.value = state.values[f.key];
        if (pill && f.dim) {
          pill.textContent = unitLabel(f);
        }
      });
      renderResults();
    }
  }

  function syncUnitToggle() {
    $$(".unit-toggle button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.units === state.units ? "true" : "false");
    });
  }

  /* ── about-this-formula sheet ────────────────────────────────────────── */

  function buildSheet(c) {
    const body = $("#sheet-body");
    if (!c || !body) return;
    body.innerHTML = `
      <h3>Equation</h3>
      <div class="eq">${esc(c.equation)}</div>
      <h3>Citation</h3>
      <p class="cite">${esc(c.citation.text)}
        ${c.citation.doi ? `<br><a href="https://doi.org/${esc(c.citation.doi)}" target="_blank" rel="noopener">doi:${esc(c.citation.doi)}</a>` : ""}
        ${c.citation.pmid ? ` · <a href="https://pubmed.ncbi.nlm.nih.gov/${esc(c.citation.pmid)}/" target="_blank" rel="noopener">PubMed ${esc(c.citation.pmid)}</a>` : ""}
      </p>
      <h3>Limitations</h3>
      <ul>${(c.caveats || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  }

  let sheetPrevFocus = null;

  function openSheet() {
    const sheet = $("#sheet");
    sheet.hidden = false;
    sheetPrevFocus = document.activeElement;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sheet.classList.add("is-open");
        $("#sheet-close").focus();
      });
    });
    document.addEventListener("keydown", onSheetKey);
  }

  function closeSheet() {
    const sheet = $("#sheet");
    sheet.classList.remove("is-open");
    document.removeEventListener("keydown", onSheetKey);
    const hide = () => { if (!sheet.classList.contains("is-open")) sheet.hidden = true; };
    if (reduceMotion()) hide();
    else setTimeout(hide, 420);
    if (sheetPrevFocus && sheetPrevFocus.focus) sheetPrevFocus.focus();
  }

  function onSheetKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closeSheet(); }
    if (e.key !== "Tab") return;
    const panel = $("#sheet-panel");
    const focusables = $$("a, button", panel).filter((el) => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ── navigation & gestures ───────────────────────────────────────────── */

  function navigate() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const parts = hash.split("/").filter(Boolean);
    if (parts[0] === "about") {
      state.calcId = null;
      state.values = {};
      openScreen("about");
    } else if (parts[0] === "c" && parts[1]) {
      const same = state.calcId === parts[1] && !$("#calc").hidden;
      state.calcId = parts[1];
      if (!same) {
        renderCalc();
        if (CALCULATORS.some((c) => c.id === parts[1])) pushRecent(parts[1]);
      }
      openScreen("calc");
    } else {
      state.calcId = null;
      state.values = {};
      openScreen(null);
      renderHome();
    }
  }

  function setupSwipeBack() {
    const calc = $("#calc");
    let startX = 0, startY = 0, tracking = false, dx = 0;
    const threshold = 22;
    calc.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      if (x > 28) return;
      startX = x;
      startY = e.touches[0].clientY;
      tracking = true;
      dx = 0;
      calc.style.transition = "none";
    }, { passive: true });
    calc.addEventListener("touchmove", (e) => {
      if (!tracking) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      if (Math.abs(y - startY) > Math.abs(x - startX) && dx === 0) { tracking = false; calc.style.transition = ""; return; }
      dx = Math.max(0, x - startX);
      if (dx > 2) calc.style.transform = "translate3d(" + dx + "px,0,0)";
    }, { passive: true });
    function end() {
      if (!tracking) return;
      tracking = false;
      calc.style.transition = "";
      calc.style.transform = "";
      if (dx > Math.min(110, window.innerWidth * 0.28)) location.hash = "#/";
    }
    calc.addEventListener("touchend", end);
    calc.addEventListener("touchcancel", end);
  }

  function setupTitleFade() {
    const sc = $("#calc-scroll");
    const title = $("#calc-nav-title");
    sc.addEventListener("scroll", () => {
      const show = sc.scrollTop > 72;
      title.classList.toggle("is-shown", show);
    }, { passive: true });
  }

  /* ── init ────────────────────────────────────────────────────────────── */

  function init() {
    const banner = $("#draft-banner");
    if (cfg.DRAFT) {
      banner.textContent = cfg.DRAFT_BANNER;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
    $("#app-name").textContent = cfg.APP_NAME;
    $("#app-sub").textContent = "Clinician calculators · " + cfg.PUBLISHER;
    $("#support-email").textContent = cfg.SUPPORT_EMAIL;
    $("#support-email").href = "mailto:" + cfg.SUPPORT_EMAIL;
    $("#version").textContent = cfg.APP_VERSION;

    state.favs = readList(FAV_KEY);
    state.recents = readList(REC_KEY);
    try {
      const u = localStorage.getItem(UNIT_KEY);
      if (u === "si" || u === "us") state.units = u;
    } catch (e) { /* ignore */ }
    syncUnitToggle();

    $("#search").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderHome();
    });
    $$(".unit-toggle button").forEach((b) => {
      b.addEventListener("click", () => setUnits(b.dataset.units));
    });
    $("#back-btn").addEventListener("click", () => { location.hash = "#/"; });
    $("#about-back").addEventListener("click", () => { location.hash = "#/"; });
    $("#fav-btn").addEventListener("click", () => { if (state.calcId) toggleFav(state.calcId); });
    $("#about-formula-btn").addEventListener("click", openSheet);
    $("#sheet-close").addEventListener("click", closeSheet);
    $("#sheet-backdrop").addEventListener("click", closeSheet);

    window.addEventListener("hashchange", navigate);
    setupSwipeBack();
    setupTitleFade();
    renderHome();
    navigate();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
