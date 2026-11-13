/**
 * Calculator catalog: fields, compute wrappers, equations, citations, caveats.
 * Pure display metadata; math lives in formulas.js.
 */
(function (global) {
  "use strict";
  const F = global.NephFormulas;

  function fmt(x, d) {
    if (x == null || !Number.isFinite(x)) return "—";
    if (Math.abs(x) === Infinity) return "∞";
    const dec = d == null ? 1 : d;
    return Number(x).toLocaleString(undefined, { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  }
  function chip(text, kind) {
    return { type: "chip", text: text, kind: kind || "info" };
  }

  const SECTIONS = [
    { id: "kidney", title: "Kidney function", blurb: "eGFR, creatinine clearance, and kidney-failure risk" },
    { id: "electrolytes", title: "Electrolytes", blurb: "FENa, anion and osmolal gaps, sodium, free water" },
    { id: "acidbase", title: "Acid–base", blurb: "Winter's, delta–delta, and expected compensation" },
    { id: "proteinuria", title: "Proteinuria", blurb: "Spot ratios, 24-hour estimates, KDIGO A categories" },
    { id: "hd", title: "Hemodialysis", blurb: "URR, Kt/V, standard weekly dose, nPCR, UFR, Watson V" },
    { id: "crrt", title: "CRRT", blurb: "Effluent dose, filtration fraction, citrate ratio" },
    { id: "pd", title: "Peritoneal dialysis", blurb: "Weekly Kt/V, CrCl, PET, residual kidney function" },
  ];

  const C = [];

  C.push({
    id: "egfr-2021-cr",
    section: "kidney",
    title: "eGFR CKD-EPI 2021 (creatinine)",
    short: "Race-free creatinine equation recommended by NKF and ASN.",
    keywords: "egfr ckd-epi 2021 creatinine inker race-free gfr",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120, hint: "Adults ≥ 18 years" },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "scr", label: "Serum creatinine", dim: "creatinine", min: 0.1 },
    ],
    compute(v) {
      if (v.age == null || v.sex == null || v.scr == null) return null;
      const egfr = F.egfrCkdEpi2021Cr(v.scr, v.age, v.sex === "female");
      const g = F.kdigoGCategory(egfr);
      return {
        primary: { name: "eGFR", value: fmt(egfr, 1), unit: "mL/min/1.73 m²", raw: egfr },
        extra: [],
        chips: [chip("KDIGO " + g, g === "G4" || g === "G5" ? "warn" : "info")],
        notes: ["Indexed to 1.73 m². For drug dosing that needs non-indexed GFR, consider BSA adjustment (and Cockcroft–Gault)."],
      };
    },
    equation: "eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 [if female]\nκ = 0.7 (female) or 0.9 (male);  α = −0.241 (female) or −0.302 (male)\nScr in mg/dL (µmol/L ÷ 88.4). Adults ≥ 18 years.",
    citation: { text: "Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. N Engl J Med. 2021;385:1737-1749.", doi: "10.1056/NEJMoa2102953", pmid: "34554658" },
    caveats: [
      "Validated in adults. Not for AKI (creatinine not in steady state), pregnancy, extremes of muscle mass, or amputation — consider cystatin C or measured GFR.",
      "Less accurate than the 2021 combined creatinine–cystatin C equation. P30 is about 87% in the 2021 validation data.",
    ],
  });

  C.push({
    id: "egfr-2021-crcys",
    section: "kidney",
    title: "eGFR CKD-EPI 2021 (creatinine–cystatin C)",
    short: "Race-free combined equation; more accurate than creatinine alone.",
    keywords: "egfr cystatin combined 2021 inker",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "scr", label: "Serum creatinine", dim: "creatinine", min: 0.1 },
      { key: "cys", label: "Serum cystatin C", unit: "mg/L", min: 0.1, hint: "Standardized (IFCC) assay, mg/L" },
    ],
    compute(v) {
      if (v.age == null || v.sex == null || v.scr == null || v.cys == null) return null;
      const egfr = F.egfrCkdEpi2021CrCys(v.scr, v.cys, v.age, v.sex === "female");
      return {
        primary: { name: "eGFR cr-cys", value: fmt(egfr, 1), unit: "mL/min/1.73 m²", raw: egfr },
        extra: [],
        chips: [chip("KDIGO " + F.kdigoGCategory(egfr), "info")],
        notes: ["Preferred when a decision threshold is close, or when creatinine or cystatin C alone may be biased."],
      };
    },
    equation: "eGFR = 135 × min(Scr/κ,1)^α × max(Scr/κ,1)^−0.544 × min(Scys/0.8,1)^−0.323 × max(Scys/0.8,1)^−0.778 × 0.9961^age × 0.963 [if female]\nκ = 0.7 (F) or 0.9 (M);  α = −0.219 (F) or −0.144 (M)\nScr mg/dL; Scys mg/L.",
    citation: { text: "Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med. 2021;385:1737-1749.", doi: "10.1056/NEJMoa2102953", pmid: "34554658" },
    caveats: [
      "Cystatin C should be measured with a standardized (IFCC-traceable) assay.",
      "Cystatin C can be influenced by inflammation, smoking, obesity, corticosteroids and thyroid status, independently of GFR.",
      "Adults ≥ 18 years; not for AKI.",
    ],
  });

  C.push({
    id: "egfr-2012-cys",
    section: "kidney",
    title: "eGFR CKD-EPI 2012 (cystatin C)",
    short: "Cystatin C–only equation; already race-free in 2012.",
    keywords: "egfr cystatin 2012 inker",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "cys", label: "Serum cystatin C", unit: "mg/L", min: 0.1 },
    ],
    compute(v) {
      if (v.age == null || v.sex == null || v.cys == null) return null;
      const egfr = F.egfrCkdEpi2012Cys(v.cys, v.age, v.sex === "female");
      return {
        primary: { name: "eGFR cys", value: fmt(egfr, 1), unit: "mL/min/1.73 m²", raw: egfr },
        extra: [],
        chips: [chip("KDIGO " + F.kdigoGCategory(egfr), "info")],
      };
    },
    equation: "eGFR = 133 × min(Scys/0.8, 1)^−0.499 × max(Scys/0.8, 1)^−1.328 × 0.996^age × 0.932 [if female]\nScys in mg/L. Age coefficient 0.996 as published in 2012 and on the NKF page.\n(Inker 2021 Table 2 lists 0.9962 as a more precise fit; we use the published 2012 equation.)",
    citation: { text: "Inker LA, Schmid CH, Tighiouart H, et al. Estimating glomerular filtration rate from serum creatinine and cystatin C. N Engl J Med. 2012;367:20-29.", doi: "10.1056/NEJMoa1114248", pmid: "22762315" },
    caveats: [
      "Already race-free. Useful when creatinine is unreliable (low muscle mass, amputation).",
      "See cystatin C non-GFR determinants under the 2021 combined equation.",
    ],
  });

  C.push({
    id: "cockcroft-gault",
    section: "kidney",
    title: "Cockcroft–Gault CrCl",
    short: "Creatinine clearance with actual, ideal, or adjusted body weight.",
    keywords: "cockcroft gault crcl clearance ibw adjusted drug dosing",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "scr", label: "Serum creatinine", dim: "creatinine", min: 0.1 },
      { key: "weight", label: "Actual body weight", unit: "kg", min: 20, max: 400 },
      { key: "height", label: "Height", unit: "cm", min: 100, max: 230, hint: "Needed for ideal and adjusted weight" },
    ],
    compute(v) {
      if (v.age == null || v.sex == null || v.scr == null || v.weight == null) return null;
      const female = v.sex === "female";
      const actual = F.cockcroftGault(v.scr, v.age, v.weight, female);
      const extra = [];
      const chips = [];
      const notes = ["Not indexed to 1.73 m². Developed from 249 men (with a 15% downward adjustment for women). Still widely used for drug dosing."];
      if (v.height != null) {
        const ibw = F.devineIbw(v.height, female);
        const adj = F.adjustedBodyWeight(v.weight, ibw);
        extra.push({ name: "Devine IBW", value: fmt(ibw, 1), unit: "kg" });
        extra.push({ name: "CrCl using IBW", value: fmt(F.cockcroftGault(v.scr, v.age, ibw, female), 1), unit: "mL/min" });
        extra.push({ name: "Adjusted BW (IBW + 0.4×excess)", value: fmt(adj, 1), unit: "kg" });
        extra.push({ name: "CrCl using adjusted BW", value: fmt(F.cockcroftGault(v.scr, v.age, adj, female), 1), unit: "mL/min" });
        if (v.height / 2.54 < 60) chips.push(chip("Height < 5 ft: Devine IBW is outside its usual range", "warn"));
        const bmi = v.weight / Math.pow(v.height / 100, 2);
        extra.push({ name: "BMI", value: fmt(bmi, 1), unit: "kg/m²" });
        notes.push("Common practice (Winter et al., Pharmacotherapy 2012): actual weight if underweight, IBW if normal BMI, adjusted weight if overweight. Confirm against the drug’s dosing reference.");
      }
      return {
        primary: { name: "CrCl (actual weight)", value: fmt(actual, 1), unit: "mL/min", raw: actual },
        extra: extra,
        chips: chips,
        notes: notes,
      };
    },
    equation: "CrCl (mL/min) = [(140 − age) × weight_kg × (0.85 if female)] / (72 × Scr_mg/dL)\nDevine IBW: male 50 + 2.3 × (height_in − 60); female 45.5 + 2.3 × (height_in − 60)\nAdjusted BW = IBW + 0.4 × (actual − IBW)",
    citation: { text: "Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41. IBW: Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655. Weight selection: Winter MA et al. Pharmacotherapy. 2012;32:604-612.", doi: "10.1159/000180580", pmid: "1244564" },
    caveats: [
      "Overestimates GFR at low muscle mass and in the elderly if actual weight is used uncritically. Underestimates in obesity if IBW is used.",
      "Original study used non-standardized creatinine; modern IDMS-traceable creatinine slightly raises calculated CrCl.",
      "The 0.4 adjustment factor is conventional, not from Cockcroft and Gault’s paper.",
    ],
  });

  function kfreNotes() {
    return [
      "North American coefficients are the original Tangri 2011 (Canadian) coefficients. Tangri 2016 found calibration adequate in North American cohorts; a separate downward recalibration applies to many non-North-American cohorts (not used here).",
      "Intended for CKD G3–G5 (eGFR < 60) in adults. Do not use after kidney transplant or in AKI.",
      "UACR uses albumin/creatinine. The ln(ACR) centering constant 5.137 corresponds to ACR in mg/g (≈170 mg/g).",
      "Risk is of treated kidney failure (dialysis or transplant) and does not account for the competing risk of death.",
      "Common thresholds (kidneyfailurerisk.com / KDIGO discussion): 3–5% at 5 years for nephrology referral; 10% at 2 years for multidisciplinary care; 20–40% at 2 years for access or transplant planning.",
    ];
  }

  function kfreCompute(v, variables) {
    if (v.age == null || v.sex == null || v.egfr == null || v.acr == null) return null;
    if (variables === 8 && (v.albumin == null || v.phos == null || v.bicarb == null || v.calcium == null)) return null;
    const opts = { age: v.age, female: v.sex === "female", egfr: v.egfr, acrMgg: v.acr, variables: variables };
    if (variables === 8) {
      opts.albuminGdl = v.albumin;
      opts.phosphateMgDl = v.phos;
      opts.bicarbonate = v.bicarb;
      opts.calciumMgDl = v.calcium;
    }
    const r2 = F.kfreNorthAmerican(Object.assign({}, opts, { years: 2 }));
    const r5 = F.kfreNorthAmerican(Object.assign({}, opts, { years: 5 }));
    const chips = [];
    if (r5.riskPct < 5) chips.push(chip("5-year risk < 5% (lower-risk range used for referral discussions)", "ok"));
    else if (r2.riskPct >= 20) chips.push(chip("2-year risk ≥ 20% (range often used for access / transplant planning)", "warn"));
    else if (r2.riskPct >= 10) chips.push(chip("2-year risk ≥ 10% (range often used for multidisciplinary CKD care)", "warn"));
    else chips.push(chip("Intermediate 5-year risk", "info"));
    return {
      primary: { name: "2-year kidney-failure risk", value: fmt(r2.riskPct, 1), unit: "%", raw: r2.riskPct },
      extra: [
        { name: "5-year risk", value: fmt(r5.riskPct, 1), unit: "%" },
        { name: "2-year baseline survival S₀ (NA)", value: fmt(r2.s0, 4), unit: "" },
        { name: "5-year baseline survival S₀ (NA)", value: fmt(r5.s0, 4), unit: "" },
        { name: "Linear predictor (2-year model)", value: fmt(r2.lp, 3), unit: "" },
      ],
      chips: chips,
      notes: ["North American original coefficients (Tangri 2011; calibration adequate in NA per Tangri 2016)."],
    };
  }

  C.push({
    id: "kfre-4",
    section: "kidney",
    title: "KFRE 4-variable (North American)",
    short: "2- and 5-year kidney-failure risk from age, sex, eGFR and UACR.",
    keywords: "kfre tangri kidney failure risk 4-variable",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73 m²", min: 1, max: 90, hint: "Typically CKD-EPI; intended for eGFR < 60" },
      { key: "acr", label: "UACR", dim: "acr", min: 0.1 },
    ],
    compute(v) { return kfreCompute(v, 4); },
    equation: "Risk = 1 − S₀^exp(LP)\nLP = −0.2201(age/10 − 7.036) + 0.2467(male − 0.5642) − 0.5567(eGFR/5 − 7.222) + 0.4510(ln(ACR_mg/g) − 5.137)\nMale = 1, female = 0.  North American S₀: 2-year 0.9750, 5-year 0.9240.\nACR in mg/g (mg/mmol × 8.84).",
    citation: { text: "Tangri N et al. A predictive model for progression of chronic kidney disease to kidney failure. JAMA. 2011;305:1553-1559. Validation: Tangri N et al. JAMA. 2016;315:164-174.", doi: "10.1001/jama.2011.451", pmid: "21482743" },
    caveats: kfreNotes(),
  });

  C.push({
    id: "kfre-8",
    section: "kidney",
    title: "KFRE 8-variable (North American)",
    short: "Adds albumin, phosphate, bicarbonate and calcium to the 4-variable model.",
    keywords: "kfre 8-variable albumin phosphate bicarbonate calcium",
    fields: [
      { key: "age", label: "Age", unit: "years", min: 18, max: 120 },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "egfr", label: "eGFR", unit: "mL/min/1.73 m²", min: 1, max: 90 },
      { key: "acr", label: "UACR", dim: "acr", min: 0.1 },
      { key: "albumin", label: "Serum albumin", dim: "albumin" },
      { key: "phos", label: "Serum phosphate", dim: "phosphate" },
      { key: "bicarb", label: "Serum bicarbonate", unit: "mEq/L" },
      { key: "calcium", label: "Serum calcium", dim: "calcium", hint: "Total calcium, as in the original model" },
    ],
    compute(v) { return kfreCompute(v, 8); },
    equation: "LP = −0.1992(age/10 − 7.036) + 0.1602(male − 0.5642) − 0.4919(eGFR/5 − 7.222) + 0.3364(ln(ACR) − 5.137)\n     −0.3441(albumin − 3.997) + 0.2604(phosphate − 3.916) − 0.07354(bicarbonate − 25.57) − 0.2228(calcium − 9.355)\nAlbumin g/dL, phosphate mg/dL, bicarbonate mEq/L, calcium mg/dL, ACR mg/g.\nNorth American S₀: 2-year 0.9780, 5-year 0.9301.",
    citation: { text: "Tangri N et al. JAMA. 2011;305:1553-1559. doi:10.1001/jama.2011.451. Validation: Tangri N et al. JAMA. 2016;315:164-174. doi:10.1001/jama.2015.18202.", doi: "10.1001/jama.2011.451", pmid: "21482743" },
    caveats: kfreNotes().concat(["The 8-variable model was less often usable in routine data because calcium, phosphate, bicarbonate and albumin are frequently missing."]),
  });

  C.push({
    id: "fena",
    section: "electrolytes",
    title: "FENa",
    short: "Fractional excretion of sodium for oliguric AKI (when not on diuretics).",
    keywords: "fena fractional excretion sodium prerenal atn",
    fields: [
      { key: "una", label: "Urine sodium", unit: "mEq/L" },
      { key: "pna", label: "Plasma sodium", unit: "mEq/L" },
      { key: "ucr", label: "Urine creatinine", dim: "creatinine" },
      { key: "pcr", label: "Plasma creatinine", dim: "creatinine" },
    ],
    compute(v) {
      if (v.una == null || v.pna == null || v.ucr == null || v.pcr == null) return null;
      const x = F.fena(v.una, v.pna, v.ucr, v.pcr);
      const chips = [];
      if (x < 1) chips.push(chip("FENa < 1%: traditionally favors a prerenal state", "info"));
      else if (x > 2) chips.push(chip("FENa > 2%: traditionally favors acute tubular injury", "info"));
      else chips.push(chip("FENa 1–2%: indeterminate", "info"));
      return { primary: { name: "FENa", value: fmt(x, 2), unit: "%", raw: x }, extra: [], chips: chips };
    },
    equation: "FENa (%) = (UNa × PCr) / (PNa × UCr) × 100\nSodium and creatinine units cancel if paired samples share units.",
    citation: { text: "Espinel CH. The FENa test: use in the differential diagnosis of acute renal failure. JAMA. 1976;236:579-581.", doi: "10.1001/jama.1976.03270060029022", pmid: "947239" },
    caveats: [
      "Unreliable on diuretics, in CKD, after contrast, in rhabdomyolysis, sepsis, late ATN with low FENa, and in obstruction or glomerulonephritis (can be <1%).",
      "Best interpreted in oliguric AKI with the clinical picture. Use FEUrea when the patient is on diuretics.",
      "Cutoffs of 1% and 2% are traditional teaching, not absolute.",
    ],
  });

  C.push({
    id: "feurea",
    section: "electrolytes",
    title: "FEUrea",
    short: "Fractional excretion of urea; preferred when the patient is on diuretics.",
    keywords: "feurea fractional excretion urea diuretic",
    fields: [
      { key: "uurea", label: "Urine urea or BUN", dim: "bun", hint: "Same analyte as plasma (urea or BUN); the ratio cancels units" },
      { key: "purea", label: "Plasma urea or BUN", dim: "bun" },
      { key: "ucr", label: "Urine creatinine", dim: "creatinine" },
      { key: "pcr", label: "Plasma creatinine", dim: "creatinine" },
    ],
    compute(v) {
      if (v.uurea == null || v.purea == null || v.ucr == null || v.pcr == null) return null;
      const x = F.feUrea(v.uurea, v.purea, v.ucr, v.pcr);
      const chips = [];
      if (x < 35) chips.push(chip("FEUrea < 35%: favors prerenal azotemia (Carvounis 2002)", "info"));
      else if (x > 50) chips.push(chip("FEUrea > 50%: favors ATN (Carvounis 2002)", "info"));
      else chips.push(chip("FEUrea 35–50%: indeterminate", "info"));
      return { primary: { name: "FEUrea", value: fmt(x, 1), unit: "%", raw: x }, extra: [], chips: chips };
    },
    equation: "FEUrea (%) = (UUrea × PCr) / (PUrea × UCr) × 100\nBUN may be used for both urine and plasma (conversion cancels).",
    citation: { text: "Carvounis CP, Nisar S, Guro-Razuman S. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62:2223-2229.", doi: "10.1046/j.1523-1755.2002.00630.x", pmid: "12427149" },
    caveats: [
      "More useful than FENa in patients receiving diuretics. Still an adjunct to clinical assessment.",
      "Osmotic diuresis, CKD, and some forms of ATN can produce overlapping values. Cutoffs 35% and 50% are from Carvounis et al. 2002.",
    ],
  });

  C.push({
    id: "anion-gap",
    section: "electrolytes",
    title: "Anion gap",
    short: "Na − (Cl + HCO₃), with optional Figge albumin correction.",
    keywords: "anion gap albumin figge haga nagma",
    fields: [
      { key: "na", label: "Sodium", unit: "mEq/L" },
      { key: "cl", label: "Chloride", unit: "mEq/L" },
      { key: "hco3", label: "Bicarbonate", unit: "mEq/L" },
      { key: "albumin", label: "Albumin (optional)", dim: "albumin", optional: true },
      { key: "normalAg", label: "Laboratory normal AG (optional)", unit: "mEq/L", optional: true, hint: "Default 12; modern analyzers may run closer to 8–10" },
    ],
    compute(v) {
      if (v.na == null || v.cl == null || v.hco3 == null) return null;
      const r = F.anionGap(v.na, v.cl, v.hco3, v.albumin);
      const extra = [];
      if (r.agCorrected != null) extra.push({ name: "Albumin-corrected AG (Figge, normal alb 4.4 g/dL)", value: fmt(r.agCorrected, 1), unit: "mEq/L" });
      const ref = v.normalAg != null ? v.normalAg : 12;
      const used = r.agCorrected != null ? r.agCorrected : r.ag;
      const chips = [];
      if (used > ref + 2) chips.push(chip("Elevated relative to the stated normal (" + ref + ")", "warn"));
      else chips.push(chip("Within about 2 mEq/L of the stated normal (" + ref + ")", "info"));
      return { primary: { name: "Anion gap", value: fmt(r.ag, 1), unit: "mEq/L", raw: r.ag }, extra: extra, chips: chips };
    },
    equation: "AG = Na − (Cl + HCO₃)\nAlbumin-corrected AG = AG + 2.5 × (4.4 − albumin_g/dL)   (Figge et al. 1998)",
    citation: { text: "Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med. 1998;26:1807-1810.", doi: "10.1097/00003246-199811000-00019", pmid: "9824071" },
    caveats: [
      "Normal AG depends on the laboratory’s chloride electrode (often lower with ion-selective electrodes). Use your lab’s reference, not a universal 12.",
      "Judgment: some correct to a normal albumin of 4.0 g/dL, or use a factor of 3.0 mEq/L per 1 g/dL. We use Figge’s published 2.5 and 4.4.",
      "Lithium, hyperlipidemia and hypoalbuminemia lower the apparent AG; myeloma IgG can lower it, IgA can raise it.",
    ],
  });

  C.push({
    id: "osmolal-gap",
    section: "electrolytes",
    title: "Osmolal gap",
    short: "Measured minus calculated osmolarity (conventional 2×Na formula).",
    keywords: "osmolal osmolar gap methanol ethylene glycol toxic alcohol",
    fields: [
      { key: "na", label: "Sodium", unit: "mEq/L" },
      { key: "glu", label: "Glucose", dim: "glucose" },
      { key: "bun", label: "BUN (or urea)", dim: "bun" },
      { key: "measured", label: "Measured osmolality", unit: "mOsm/kg", optional: true },
      { key: "etoh", label: "Ethanol (optional)", unit: "mg/dL", optional: true, hint: "Added as ethanol/4.6" },
    ],
    compute(v) {
      if (v.na == null || v.glu == null || v.bun == null) return null;
      const r = F.osmolalGap(v.na, v.glu, v.bun, v.measured, v.etoh);
      const extra = [];
      const chips = [];
      if (r.gap != null) {
        extra.push({ name: "Osmolal gap", value: fmt(r.gap, 1), unit: "mOsm/kg" });
        if (r.gap > 20) chips.push(chip("Gap > 20: consider toxic alcohols (and other osmoles), after accounting for ethanol", "warn"));
        else if (r.gap > 10) chips.push(chip("Gap 10–20: mildly elevated (lab and formula variation)", "info"));
        else chips.push(chip("Gap usually considered unremarkable if ≲ 10", "ok"));
      }
      return { primary: { name: "Calculated osmolarity", value: fmt(r.calculated, 1), unit: "mOsm/L", raw: r.calculated }, extra: extra, chips: chips };
    },
    equation: "Calculated osmolarity = 2×Na + glucose/18 + BUN/2.8   (+ ethanol/4.6 if entered)\nNa in mEq/L, glucose and BUN in mg/dL. SI equivalent: 2×Na + glucose_mmol + urea_mmol.\nOsmolal gap = measured osmolality − calculated osmolarity.",
    citation: { text: "Worthley LI, Guerin M, Pain RW. For calculation of osmolality, the simplest formula is the best. Anaesth Intensive Care. 1987;15:199-202. Conventional 2×Na formula.", doi: "10.1177/0310057X8701500214", pmid: "3605570" },
    caveats: [
      "Judgment: the Dorwart–Chalmers formula (1.86×Na + glu/18 + BUN/2.8 + 9) is an alternative; we use the conventional 2×Na form used in most nephrology teaching.",
      "A normal gap does not exclude toxic-alcohol ingestion late in the course (acid metabolites raise the AG as the parent alcohol and the gap fall).",
      "Ethanol must be in mg/dL for the /4.6 term.",
    ],
  });

  C.push({
    id: "na-correction",
    section: "electrolytes",
    title: "Sodium correction for hyperglycemia",
    short: "Katz (1.6) and Hillier (2.4) corrections per 100 mg/dL glucose above 100.",
    keywords: "sodium glucose hyperglycemia katz hillier hyponatremia",
    fields: [
      { key: "na", label: "Measured sodium", unit: "mEq/L" },
      { key: "glu", label: "Glucose", dim: "glucose" },
    ],
    compute(v) {
      if (v.na == null || v.glu == null) return null;
      const r = F.sodiumCorrectionHyperglycemia(v.na, v.glu);
      return {
        primary: { name: "Hillier-corrected Na (2.4)", value: fmt(r.hillier, 1), unit: "mEq/L", raw: r.hillier },
        extra: [
          { name: "Katz-corrected Na (1.6)", value: fmt(r.katz, 1), unit: "mEq/L" },
          { name: "Glucose above 100 mg/dL", value: fmt(v.glu - 100, 0), unit: "mg/dL" },
        ],
        chips: [chip("Both results shown; Hillier 2.4 is the experimentally derived factor", "info")],
        notes: ["Reference glucose is 100 mg/dL (5.6 mmol/L), as in the classic statements of both rules."],
      };
    },
    equation: "Corrected Na = measured Na + factor × (glucose_mg/dL − 100) / 100\nKatz factor = 1.6 mEq/L per 100 mg/dL.  Hillier factor = 2.4 mEq/L per 100 mg/dL.",
    citation: { text: "Katz MA. Hyperglycemia-induced hyponatremia. N Engl J Med. 1973;289:843-844. Hillier TA, Abbott RD, Barrett EJ. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999;106:399-403.", doi: "10.1056/NEJM197310182891607", pmid: "10225241" },
    caveats: [
      "Hillier’s 2.4 was measured during experimental hyperglycemia and is often preferred at high glucose; Katz’s 1.6 is the traditional bedside factor. We report both.",
      "Hillier noted the relationship is not perfectly linear (closer to 1.6 at modest hyperglycemia and larger at very high glucose).",
      "This estimates the expected dilutional change; it does not replace a measured sodium after glucose is corrected.",
    ],
  });

  C.push({
    id: "free-water-deficit",
    section: "electrolytes",
    title: "Free water deficit",
    short: "TBW × (Na/target − 1), with sex- and age-specific TBW fractions.",
    keywords: "free water deficit hypernatremia adrogue",
    fields: [
      { key: "na", label: "Current sodium", unit: "mEq/L" },
      { key: "weight", label: "Weight", unit: "kg" },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "age", label: "Age", unit: "years", hint: "≥ 65 years uses the elderly TBW fractions" },
      { key: "target", label: "Target sodium (optional)", unit: "mEq/L", optional: true, hint: "Default 140" },
    ],
    compute(v) {
      if (v.na == null || v.weight == null || v.sex == null) return null;
      const r = F.freeWaterDeficit(v.na, v.weight, v.sex === "female", v.age, v.target);
      return {
        primary: { name: "Free water deficit", value: fmt(r.deficitL, 2), unit: "L", raw: r.deficitL },
        extra: [
          { name: "TBW fraction used", value: fmt(r.fraction, 2), unit: "" },
          { name: "Estimated TBW", value: fmt(r.tbw, 1), unit: "L" },
          { name: "Target Na", value: fmt(r.target, 0), unit: "mEq/L" },
        ],
        chips: r.deficitL < 0 ? [chip("Negative value: sodium is below the target (this is a surplus, not a deficit)", "info")] : [],
        notes: ["Replace free water slowly in chronic hypernatremia (typically a fall of about 8–12 mEq/L per day — follow Adrogué & Madias and local protocols). Add ongoing losses."],
      };
    },
    equation: "Deficit (L) = TBW × (Na / targetNa − 1)\nTBW = fraction × weight_kg\nFractions: adult men 0.60, adult women 0.50, elderly men 0.50, elderly women 0.45.\nElderly is taken as age ≥ 65 (a common convention; the NEJM review does not set a hard cutoff).",
    citation: { text: "Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342:1493-1499.", doi: "10.1056/NEJM200005183422006", pmid: "10816188" },
    caveats: [
      "TBW fractions are population averages and are less accurate in obesity, volume depletion, or anasarca.",
      "Does not include ongoing insensible or urinary free-water losses. Do not use as a one-shot infusion prescription.",
    ],
  });

  C.push({
    id: "winters",
    section: "acidbase",
    title: "Winter's formula",
    short: "Expected PCO₂ in metabolic acidosis: 1.5 × HCO₃ + 8 (±2).",
    keywords: "winter's winters metabolic acidosis compensation pco2",
    fields: [
      { key: "hco3", label: "Bicarbonate", unit: "mEq/L" },
      { key: "pco2", label: "Measured PCO₂ (optional)", unit: "mmHg", optional: true },
    ],
    compute(v) {
      if (v.hco3 == null) return null;
      const w = F.wintersFormula(v.hco3);
      const extra = [{ name: "Range (±2)", value: fmt(w.low, 1) + " – " + fmt(w.high, 1), unit: "mmHg" }];
      const chips = [];
      if (v.pco2 != null) {
        extra.push({ name: "Measured PCO₂", value: fmt(v.pco2, 1), unit: "mmHg" });
        if (v.pco2 > w.high) chips.push(chip("Measured PCO₂ above expected: additional respiratory acidosis", "warn"));
        else if (v.pco2 < w.low) chips.push(chip("Measured PCO₂ below expected: additional respiratory alkalosis", "warn"));
        else chips.push(chip("Measured PCO₂ is within Winter's ±2 range", "ok"));
      }
      return { primary: { name: "Expected PCO₂", value: fmt(w.expected, 1), unit: "mmHg", raw: w.expected }, extra: extra, chips: chips };
    },
    equation: "Expected PCO₂ = 1.5 × HCO₃ + 8   (±2 mmHg)",
    citation: { text: "Albert MS, Dell RB, Winters RW. Quantitative displacement of acid-base equilibrium in metabolic acidosis. Ann Intern Med. 1967;66:312-322.", doi: "10.7326/0003-4819-66-2-312", pmid: "6016545" },
    caveats: [
      "Applies to metabolic acidosis. Do not use for metabolic alkalosis (see Expected compensation).",
      "The ±2 mmHg band is the usual teaching interval. Compensation takes hours; early disorders may appear under-compensated.",
    ],
  });

  C.push({
    id: "delta-delta",
    section: "acidbase",
    title: "Delta gap / delta–delta ratio",
    short: "ΔAG / ΔHCO₃ to look for a coexisting NAGMA or metabolic alkalosis.",
    keywords: "delta delta gap ratio hagma nagma rastegar",
    fields: [
      { key: "na", label: "Sodium", unit: "mEq/L", optional: true, hint: "Or enter AG directly below" },
      { key: "cl", label: "Chloride", unit: "mEq/L", optional: true },
      { key: "hco3", label: "Bicarbonate", unit: "mEq/L" },
      { key: "ag", label: "Anion gap (if already known)", unit: "mEq/L", optional: true },
      { key: "albumin", label: "Albumin (optional, for Figge correction)", dim: "albumin", optional: true },
      { key: "normalAg", label: "Normal AG", unit: "mEq/L", optional: true, hint: "Default 12" },
      { key: "normalHco3", label: "Normal HCO₃", unit: "mEq/L", optional: true, hint: "Default 24" },
    ],
    compute(v) {
      if (v.hco3 == null) return null;
      let ag = v.ag;
      if (ag == null && v.na != null && v.cl != null) {
        const a = F.anionGap(v.na, v.cl, v.hco3, v.albumin);
        ag = a.agCorrected != null ? a.agCorrected : a.ag;
      }
      if (ag == null) return null;
      const r = F.deltaDelta(ag, v.hco3, v.normalAg, v.normalHco3);
      return {
        primary: { name: "ΔAG / ΔHCO₃", value: Number.isFinite(r.ratio) ? fmt(r.ratio, 2) : "∞", unit: "", raw: r.ratio },
        extra: [
          { name: "Anion gap used", value: fmt(ag, 1), unit: "mEq/L" },
          { name: "ΔAG", value: fmt(r.deltaAg, 1), unit: "mEq/L" },
          { name: "ΔHCO₃", value: fmt(r.deltaHco3, 1), unit: "mEq/L" },
          { name: "HCO₃ + ΔAG (starting HCO₃)", value: fmt(r.addedHco3, 1), unit: "mEq/L" },
        ],
        chips: [chip(r.interpretation, r.ratio > 2 || r.ratio < 0.8 ? "info" : "ok")],
        notes: [r.interpretation],
      };
    },
    equation: "ΔAG = AG − normal AG (default 12)\nΔHCO₃ = normal HCO₃ − measured HCO₃ (default 24)\nRatio = ΔAG / ΔHCO₃\nRastegar-style teaching cutoffs: <0.4 NAGMA-predominant; 0.4–0.8 mixed HAGMA+NAGMA; 0.8–2.0 pure HAGMA; >2 mixed HAGMA + metabolic alkalosis.",
    citation: { text: "Rastegar A. Use of the ΔAG/ΔHCO₃ ratio in the diagnosis of mixed acid-base disorders. J Am Soc Nephrol. 2007;18:2429-2431.", doi: "10.1681/ASN.2006121247", pmid: "17634435" },
    caveats: [
      "Judgment: cutoffs vary. Some authors treat 1–2 as the pure-HAGMA band (rather than 0.8–2). The ratio is a guide, not a diagnosis.",
      "If albumin is entered, AG is Figge-corrected before the ratio is formed. Using an uncorrected AG in hypoalbuminemia underestimates ΔAG.",
      "A high ratio can also reflect chronic respiratory acidosis (pre-existing high HCO₃) rather than a metabolic alkalosis.",
    ],
  });

  C.push({
    id: "compensation",
    section: "acidbase",
    title: "Expected compensation",
    short: "Expected PCO₂ or HCO₃ for the six simple acid–base disorders.",
    keywords: "compensation metabolic respiratory acidosis alkalosis acute chronic",
    fields: [
      { key: "disorder", label: "Primary disorder", type: "seg", options: [
        ["metabolic_acidosis", "Met. acidosis"],
        ["metabolic_alkalosis", "Met. alkalosis"],
        ["acute_respiratory_acidosis", "Acute resp. acid."],
        ["chronic_respiratory_acidosis", "Chronic resp. acid."],
        ["acute_respiratory_alkalosis", "Acute resp. alk."],
        ["chronic_respiratory_alkalosis", "Chronic resp. alk."],
      ]},
      { key: "hco3", label: "HCO₃", unit: "mEq/L", optional: true },
      { key: "pco2", label: "PCO₂", unit: "mmHg", optional: true },
    ],
    compute(v) {
      if (!v.disorder) return null;
      const needH = v.disorder.indexOf("metabolic") === 0;
      if (needH && v.hco3 == null) return null;
      if (!needH && v.pco2 == null) return null;
      const r = F.expectedCompensation(v.disorder, v.hco3, v.pco2);
      const extra = [{ name: "Expected range", value: fmt(r.low, 1) + " – " + fmt(r.high, 1), unit: r.unit }];
      const chips = [chip(r.rule, "info")];
      if (r.measured != null) {
        extra.push({ name: "Measured", value: fmt(r.measured, 1), unit: r.unit });
        if (r.measured > r.high || r.measured < r.low) chips.push(chip("Measured value is outside the expected band — consider a mixed disorder (or incomplete compensation)", "warn"));
        else chips.push(chip("Measured value is within the expected band for a simple disorder", "ok"));
      }
      return { primary: { name: "Expected", value: fmt(r.expected, 1), unit: r.unit, raw: r.expected }, extra: extra, chips: chips, notes: [r.rule] };
    },
    equation: "Metabolic acidosis (Winter's): PCO₂ = 1.5 × HCO₃ + 8 (±2)\nMetabolic alkalosis: PCO₂ = 40 + 0.7 × (HCO₃ − 24) (±5)\nAcute respiratory acidosis:  HCO₃ = 24 + 0.1 × (PCO₂ − 40)   (+1 per +10 mmHg)\nChronic respiratory acidosis: HCO₃ = 24 + 0.35 × (PCO₂ − 40)  (+3.5 per +10 mmHg)\nAcute respiratory alkalosis:  HCO₃ = 24 + 0.2 × (PCO₂ − 40)   (−2 per −10 mmHg)\nChronic respiratory alkalosis: HCO₃ = 24 + 0.5 × (PCO₂ − 40)  (−5 per −10 mmHg)",
    citation: { text: "Winter's: Albert, Dell, Winters. Ann Intern Med. 1967;66:312-322. Respiratory rules: Brackett NC, Cohen JJ, Schwartz WB. N Engl J Med. 1965;272:6-12 (acute hypercapnia); Schwartz WB, Brackett NC, Cohen JJ. J Clin Invest. 1965;44:291-301 (chronic). Reviews: Adrogué HJ, Madias NE. N Engl J Med. 1998;338:26-34 and 338:107-111. Metabolic alkalosis 0.7 rule: common teaching, reviewed in Galla JH. J Am Soc Nephrol. 2000;11:369-375.", doi: "10.7326/0003-4819-66-2-312" },
    caveats: [
      "Judgment: metabolic alkalosis compensation is sometimes written as 0.6 mmHg per 1 mEq, or as PCO₂ = 0.9×HCO₃+9. We use 0.7 (±5).",
      "Judgment: chronic respiratory acidosis is sometimes 0.4 (4 per 10) rather than 0.35; chronic respiratory alkalosis is sometimes 0.4 rather than 0.5. We use 0.35 and 0.5, the commonly taught Boston-group values, and state them.",
      "Chronic compensation takes days (renal). A chronic rule applied to a hours-old disorder will mislead.",
    ],
  });

  function proteinCompute(v, kind) {
    if (v.uanalyte == null || v.ucr == null) return null;
    const r = F.urineRatio(v.uanalyte, v.ucr, { kind: kind, age: v.age, weightKg: v.weight, female: v.sex === "female" });
    const extra = [
      { name: "Ratio", value: fmt(r.mgPerG, 0), unit: "mg/g" },
      { name: "Ratio", value: fmt(r.mgPerMmol, 1), unit: "mg/mmol" },
      { name: "Ginsberg 24-h estimate (ratio in g/g ≈ g/day)", value: fmt(r.ginsberg24hG, 2), unit: "g/day" },
    ];
    if (r.estimated24hG != null) {
      extra.push({ name: "Walser creatinine excretion", value: fmt(r.walserCerMg, 0), unit: "mg/day" });
      extra.push({ name: "24-h estimate from Walser CER", value: fmt(r.estimated24hG, 2), unit: "g/day" });
    }
    const chipKind = r.category === "A3" ? "warn" : r.category === "A2" ? "info" : "ok";
    return {
      primary: { name: kind === "albumin" ? "UACR" : "UPCR", value: fmt(r.mgPerG, 0), unit: "mg/g", raw: r.mgPerG },
      extra: extra,
      chips: [chip("KDIGO " + r.category + "  (" + r.categoryRule + ")", chipKind)],
    };
  }

  C.push({
    id: "upcr",
    section: "proteinuria",
    title: "UPCR and estimated 24-hour protein",
    short: "Spot protein/creatinine ratio, KDIGO PCR category, and 24-h estimates.",
    keywords: "upcr pcr proteinuria 24-hour ginsberg",
    fields: [
      { key: "uanalyte", label: "Urine protein", unit: "mg/dL", hint: "Same concentration units as urine creatinine" },
      { key: "ucr", label: "Urine creatinine", unit: "mg/dL" },
      { key: "age", label: "Age (optional, for Walser CER)", unit: "years", optional: true },
      { key: "sex", label: "Sex (optional)", type: "seg", options: [["male", "Male"], ["female", "Female"]], optional: true },
      { key: "weight", label: "Weight (optional)", unit: "kg", optional: true },
    ],
    compute(v) { return proteinCompute(v, "protein"); },
    equation: "UPCR (g/g) = Uprotein / Ucreatinine   (same units, e.g. both mg/dL)\nUPCR (mg/g) = (g/g) × 1000;    UPCR (mg/mmol) = (mg/g) / 8.84\nGinsberg: 24-h protein (g/day) ≈ UPCR (g/g)\nWalser CER (mg/day): male (28.2 − 0.172×age)×wt; female (21.9 − 0.115×age)×wt\nCER-based 24-h protein (g/day) = UPCR (g/g) × CER (g/day)\nKDIGO PCR categories (approximate): A1 <150, A2 150–500, A3 >500 mg/g.",
    citation: { text: "Ginsberg JM, Chang BS, Matarese RA, Garella S. Use of single voided urine samples to estimate quantitative proteinuria. N Engl J Med. 1983;309:1543-1546. CER: Walser M. JPEN J Parenter Enteral Nutr. 1987. KDIGO 2012 CKD guideline (Kidney Int Suppl 2013) and KDIGO 2024 CKD guideline.", doi: "10.1056/NEJM198312223092503", pmid: "6656884" },
    caveats: [
      "Ginsberg’s approximation assumes about 1 g/day creatinine excretion and is less accurate at extremes of muscle mass, in children, and with very dilute or concentrated urine.",
      "We do not use the Ix 2011 CKD-EPI creatinine-excretion equation because it includes a Black race term. Walser is race-free and approximate.",
      "A timed 24-hour collection remains the reference when a precise quantity is needed.",
    ],
  });

  C.push({
    id: "uacr",
    section: "proteinuria",
    title: "UACR and estimated 24-hour albumin",
    short: "Spot albumin/creatinine ratio, KDIGO A1–A3, and 24-h estimates.",
    keywords: "uacr acr albuminuria kdigo a1 a2 a3",
    fields: [
      { key: "uanalyte", label: "Urine albumin", unit: "mg/dL", hint: "If your lab reports mg/L, divide by 10 to enter mg/dL (or keep both in the same units)" },
      { key: "ucr", label: "Urine creatinine", unit: "mg/dL" },
      { key: "age", label: "Age (optional)", unit: "years", optional: true },
      { key: "sex", label: "Sex (optional)", type: "seg", options: [["male", "Male"], ["female", "Female"]], optional: true },
      { key: "weight", label: "Weight (optional)", unit: "kg", optional: true },
    ],
    compute(v) { return proteinCompute(v, "albumin"); },
    equation: "UACR (mg/g) = (Ualb / UCr) × 1000   when both are in mg/dL\nUACR (mg/mmol) = (mg/g) / 8.84\nKDIGO: A1 <30, A2 30–300, A3 >300 mg/g  (or <3, 3–30, >30 mg/mmol).",
    citation: { text: "KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of CKD. Kidney Int Suppl. 2013;3:1-150. KDIGO 2024 CKD guideline. Conversion 8.84 from creatinine molecular weight 113.12.", doi: "10.1038/kisup.2012.73" },
    caveats: [
      "Confirm units on the lab report: urine albumin is often mg/L and creatinine mg/dL, which would inflate the ratio ten-fold if entered naively.",
      "Exercise, fever, infection and menstruation can transiently raise ACR. KDIGO recommends confirmation of A2 or A3.",
      "Ginsberg-style and Walser 24-h estimates are approximate (see UPCR caveats).",
    ],
  });

  C.push({
    id: "hd-dose",
    section: "hd",
    title: "Hemodialysis dose (URR & Kt/V)",
    short: "URR, Daugirdas spKt/V, Tattersall and rate-equation eKt/V, Leypoldt and FHN stdKt/V.",
    keywords: "urr ktv daugirdas tattersall leypoldt fhn stdktv adequacy",
    fields: [
      { key: "pre", label: "Pre-dialysis BUN", dim: "bun" },
      { key: "post", label: "Post-dialysis BUN", dim: "bun" },
      { key: "thours", label: "Session length", unit: "hours", min: 1, max: 12 },
      { key: "uf", label: "Ultrafiltration", unit: "L", optional: true },
      { key: "weight", label: "Post-dialysis weight", unit: "kg", optional: true, hint: "Used as W in Daugirdas UF/W" },
      { key: "access", label: "Access", type: "seg", options: [["fistula", "Fistula / graft"], ["catheter", "Catheter"]], optional: true },
      { key: "sessions", label: "Sessions per week", unit: "", optional: true, hint: "Default 3, for stdKt/V" },
      { key: "v", label: "V (optional, for FHN stdKt/V)", unit: "L", optional: true, hint: "Urea volume; Watson V can be calculated separately" },
      { key: "kru", label: "Residual urea clearance Kru (optional)", unit: "mL/min", optional: true },
    ],
    compute(v) {
      if (v.pre == null || v.post == null) return null;
      const urr = F.urr(v.pre, v.post);
      const extra = [{ name: "URR", value: fmt(urr, 1), unit: "%" }];
      const chips = [];
      if (v.thours == null) {
        return { primary: { name: "URR", value: fmt(urr, 1), unit: "%", raw: urr }, extra: extra, chips: urr >= 65 ? [chip("URR ≥ 65% (KDOQI minimum for 3×/week, roughly spKt/V 1.2)", "ok")] : [chip("URR < 65%", "warn")], notes: ["Enter session length to compute Kt/V."] };
      }
      let sp;
      try { sp = F.daugirdasSpKtv(v.pre, v.post, v.thours, v.uf, v.weight); }
      catch (e) { return { primary: { name: "URR", value: fmt(urr, 1), unit: "%" }, extra: [], chips: [chip(e.message, "danger")] }; }
      const tmin = v.thours * 60;
      const access = v.access || "fistula";
      const eTat = F.tattersallEKtv(sp, tmin, access);
      const eRate = F.daugirdasRateEKtv(sp, v.thours, access === "catheter" ? "catheter" : "arterial");
      extra.push({ name: "spKt/V (Daugirdas 2nd gen.)", value: fmt(sp, 2), unit: "" });
      extra.push({ name: "eKt/V Tattersall (" + (access === "catheter" ? "+22 min, catheter" : "+35 min, fistula") + ")", value: fmt(eTat, 2), unit: "" });
      extra.push({ name: "eKt/V Daugirdas–Schneditz rate equation", value: fmt(eRate, 2), unit: "" });
      const nSess = v.sessions != null ? v.sessions : 3;
      const stdL = F.leypoldtStdKtv(eTat, tmin, nSess);
      extra.push({ name: "stdKt/V Leypoldt (from Tattersall eKt/V, " + nSess + "×/week)", value: fmt(stdL, 2), unit: "/week" });
      if (v.uf != null && v.v != null) {
        const fhn = F.fhnStdKtv(stdL, v.uf, v.v);
        extra.push({ name: "stdKt/V FHN / Daugirdas 2010 (UF-adjusted)", value: fmt(fhn, 2), unit: "/week" });
        if (fhn >= 2.1) chips.push(chip("FHN stdKt/V ≥ 2.1 (KDOQI 2015-style weekly minimum)", "ok"));
        else chips.push(chip("FHN stdKt/V < 2.1", "warn"));
      } else if (stdL >= 2.0) chips.push(chip("Leypoldt stdKt/V ≥ 2.0 (earlier KDOQI weekly target)", "ok"));
      if (v.kru != null && v.v != null) {
        extra.push({ name: "Residual add-on (Kru × 10.08 / V, simple)", value: fmt(F.residualStdKtv(v.kru, v.v), 2), unit: "/week" });
      }
      if (sp >= 1.2 && nSess === 3) chips.push(chip("spKt/V ≥ 1.2 (KDOQI 3×/week minimum)", "ok"));
      else if (nSess === 3) chips.push(chip("spKt/V < 1.2 (KDOQI 3×/week minimum is 1.2)", "warn"));
      return {
        primary: { name: "spKt/V", value: fmt(sp, 2), unit: "", raw: sp },
        extra: extra,
        chips: chips,
        notes: [
          "eKt/V is shown by both Tattersall (used for stdKt/V here) and the Daugirdas–Schneditz rate equation.",
          "stdKt/V uses the Leypoldt 2004 fixed-volume formula. The FHN (Daugirdas 2010) value, shown when UF and V are entered, is typically about 7% higher and is the basis of the KDOQI 2015 target of 2.1.",
        ],
      };
    },
    equation: "URR = (pre − post) / pre × 100\nspKt/V = −ln(R − 0.008t) + (4 − 3.5R)×(UF/W)     R = post/pre, t hours, UF L, W kg   (Daugirdas 1993)\nTattersall: eKt/V = spKt/V × t / (t + 35)   t minutes; use 22 for a catheter\nRate eq. (arterial): eKt/V = spKt/V − 0.60×(spKt/V)/T + 0.03    T hours\nRate eq. (venous/catheter): eKt/V = spKt/V − 0.47×(spKt/V)/T + 0.02\nLeypoldt stdKt/V = [10080(1−e^(−eKt/V))/t] / [(1−e^(−eKt/V))/eKt/V + 10080/(N t) − 1]    t minutes\nFHN: stdKt/V_FHN = stdKt/V_Leypoldt / (1 − 0.74 × UF_session / V)",
    citation: { text: "Daugirdas JT. Second generation logarithmic estimates of single-pool variable volume Kt/V. J Am Soc Nephrol. 1993;4:1205-1213. Tattersall JE et al. Kidney Int. 1996;50:2094-2102. Daugirdas JT, Schneditz D. ASAIO J. 1995;41:M719-M724. Leypoldt JK, Jaber BL, Zimmerman DL. Semin Dial. 2004;17:142-145. Daugirdas JT et al. Kidney Int. 2010;77:637-644 (FHN stdKt/V).", doi: "10.1681/ASN.V451205", pmid: "8305648" },
    caveats: [
      "Draw the post-BUN immediately at the end of dialysis with a slow-flow or stop-pump method to avoid access recirculation artifact (KDOQI).",
      "The 0.008t generation term is calibrated mainly for a midweek 3×/week session; it is less accurate for short-daily or first-of-week sessions.",
      "Residual Kru is added with a simple Kru×10.08/V term; Daugirdas 2010 has a more refined residual adjustment that we have not reproduced in full.",
    ],
  });

  C.push({
    id: "npcr",
    section: "hd",
    title: "nPCR / nPNA",
    short: "Normalized protein catabolic rate from the interdialytic BUN rise, plus the midweek Depner–Daugirdas equation.",
    keywords: "npcr npna pcr protein catabolic depner",
    fields: [
      { key: "post", label: "Post-dialysis BUN (end of prior session)", dim: "bun" },
      { key: "pre", label: "Pre-dialysis BUN (this session)", dim: "bun" },
      { key: "hours", label: "Interdialytic interval", unit: "hours" },
      { key: "ktv", label: "spKt/V (optional, for 1996 midweek equation)", unit: "", optional: true },
    ],
    compute(v) {
      if (v.post == null || v.pre == null || v.hours == null) return null;
      const nP = F.nPcrInterdialytic(v.post, v.pre, v.hours);
      const extra = [];
      const chips = [];
      if (v.ktv != null) {
        extra.push({ name: "Depner–Daugirdas 1996 midweek nPCR (uses this session’s pre-BUN and Kt/V)", value: fmt(F.nPcrDepnerDaugirdasMidweek(v.pre, v.ktv), 2), unit: "g/kg/day" });
      }
      if (nP < 0.8) chips.push(chip("nPCR < 0.8 g/kg/day: suggests low protein intake (or reduced catabolism)", "warn"));
      else if (nP <= 1.2) chips.push(chip("nPCR in the commonly cited 0.8–1.2+ g/kg/day nutrition range (KDOQI nutrition context)", "ok"));
      else chips.push(chip("nPCR > 1.2 g/kg/day", "info"));
      return { primary: { name: "nPCR (interdialytic rise)", value: fmt(nP, 2), unit: "g/kg/day", raw: nP }, extra: extra, chips: chips };
    },
    equation: "Interdialytic (two-point, anuric approximation):\n  nPCR (g/kg/day) = 0.22 + 0.864 × (BUNpre_next − BUNpost) / tid_hours\n                  = 0.22 + (0.036 × ΔBUN × 24) / tid_hours     (BUN in mg/dL)\nDepner–Daugirdas 1996 midweek (session 2 of 3):\n  nPCR = C₀ / (25.8 + 1.15×Kt/V + 56.4/(Kt/V)) + 0.168\n  C₀ = predialysis BUN, mg/dL. The 0.168 term is non-urea nitrogen.",
    citation: { text: "Depner TA, Daugirdas JT. Equations for normalized protein catabolic rate based on two-point modeling of hemodialysis urea kinetics. J Am Soc Nephrol. 1996;7:780-788.", doi: "10.1681/ASN.V75780", pmid: "8738814" },
    caveats: [
      "The interdialytic-rise formula is the form requested for this toolbox and is widely used at the chairside. The formal 1996 paper’s primary equations use predialysis BUN and Kt/V and are session-specific (Monday/Wednesday/Friday coefficients differ). We show the published midweek equation when Kt/V is entered.",
      "Assumes anuria (or negligible residual urea clearance) and a relatively stable volume.",
      "nPCR reflects protein catabolism, which equals dietary intake only in a metabolically stable patient.",
    ],
  });

  C.push({
    id: "ufr",
    section: "hd",
    title: "Ultrafiltration rate",
    short: "mL/kg/h, with the commonly cited 13 mL/kg/h threshold.",
    keywords: "ufr ultrafiltration flythe 13",
    fields: [
      { key: "uf", label: "Ultrafiltration volume", unit: "mL" },
      { key: "weight", label: "Post-dialysis (or target) weight", unit: "kg" },
      { key: "hours", label: "Session length", unit: "hours" },
    ],
    compute(v) {
      if (v.uf == null || v.weight == null || v.hours == null) return null;
      const u = F.ultrafiltrationRate(v.uf, v.weight, v.hours);
      const chips = [];
      if (u > 13) chips.push(chip("UFR > 13 mL/kg/h (Flythe 2011: associated with higher mortality vs ≤10)", "danger"));
      else if (u > 10) chips.push(chip("UFR 10–13 mL/kg/h (intermediate in Flythe 2011; 13 is the commonly cited threshold)", "warn"));
      else chips.push(chip("UFR ≤ 10 mL/kg/h", "ok"));
      return { primary: { name: "UFR", value: fmt(u, 1), unit: "mL/kg/h", raw: u }, extra: [], chips: chips };
    },
    equation: "UFR (mL/kg/h) = UF (mL) / weight (kg) / session time (h)",
    citation: { text: "Flythe JE, Kimmel SE, Brunelli SM. Rapid fluid removal during dialysis is associated with cardiovascular morbidity and mortality. Kidney Int. 2011;79:1110-1117.", doi: "10.1038/ki.2010.383", pmid: "20927040" },
    caveats: [
      "The 13 mL/kg/h figure is from observational data (Flythe et al. 2011) and has been used in quality measures; it is not a proven causal safety limit for every patient. Later work has also discussed 10 mL/kg/h and risk-based thresholds.",
      "Weight is typically post-dialysis or prescribed target weight.",
    ],
  });

  C.push({
    id: "watson",
    section: "hd",
    title: "Watson total body water (V)",
    short: "Anthropometric urea-distribution volume used for Kt/V and PD Kt/V.",
    keywords: "watson tbw volume v urea",
    fields: [
      { key: "age", label: "Age", unit: "years", hint: "Used for men; the female Watson formula has no age term" },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "height", label: "Height", unit: "cm" },
      { key: "weight", label: "Weight", unit: "kg", hint: "Use post-dialysis weight for hemodialysis V" },
    ],
    compute(v) {
      if (v.sex == null || v.height == null || v.weight == null) return null;
      if (v.sex === "male" && v.age == null) return null;
      const tbw = F.watsonTbw(v.age || 0, v.height, v.weight, v.sex === "female");
      return {
        primary: { name: "Watson TBW (V)", value: fmt(tbw, 1), unit: "L", raw: tbw },
        extra: [{ name: "Percent of body weight", value: fmt((tbw / v.weight) * 100, 1), unit: "%" }],
        chips: v.sex === "female" ? [chip("Female Watson formula does not include age (as published)", "info")] : [],
        notes: ["Watson can overestimate V in obesity and in some dialysis patients, which underestimates Kt/V."],
      };
    },
    equation: "Male:   V = 2.447 − 0.09516×age + 0.1074×height_cm + 0.3362×weight_kg\nFemale: V = −2.097 + 0.1069×height_cm + 0.2466×weight_kg",
    citation: { text: "Watson PE, Watson ID, Batt RD. Total body water volumes for adult males and females estimated from simple anthropometric measurements. Am J Clin Nutr. 1980;33:27-39.", doi: "10.1093/ajcn/33.1.27", pmid: "7387105" },
    caveats: [
      "Anthropometric estimate, not a measured volume. ISPD and KDOQI commonly use Watson for PD Kt/V.",
      "The female equation has no age term — that is as published, not an omission.",
    ],
  });

  C.push({
    id: "crrt-dose",
    section: "crrt",
    title: "CRRT effluent dose & filtration fraction",
    short: "Prescribed and predilution-corrected dose vs KDIGO 20–25 mL/kg/h, plus FF.",
    keywords: "crrt cvvh cvvhd cvvhdf effluent dose kdigo predilution filtration fraction",
    fields: [
      { key: "modality", label: "Modality", type: "seg", options: [["cvvh", "CVVH"], ["cvvhd", "CVVHD"], ["cvvhdf", "CVVHDF"]] },
      { key: "weight", label: "Weight", unit: "kg" },
      { key: "qb", label: "Blood flow (Qb)", unit: "mL/min" },
      { key: "hct", label: "Hematocrit", unit: "%", hint: "Percent, e.g. 30" },
      { key: "qd", label: "Dialysate flow (Qd)", unit: "mL/h", optional: true, hint: "CVVHD / CVVHDF" },
      { key: "qpre", label: "Pre-filter replacement (Qpre)", unit: "mL/h", optional: true },
      { key: "qpost", label: "Post-filter replacement (Qpost)", unit: "mL/h", optional: true },
      { key: "qnet", label: "Net ultrafiltration (patient fluid removal)", unit: "mL/h", optional: true },
    ],
    compute(v) {
      if (v.weight == null) return null;
      const modality = v.modality || "cvvhdf";
      let qd = v.qd || 0, qpre = v.qpre || 0, qpost = v.qpost || 0, qnet = v.qnet || 0;
      if (modality === "cvvh") qd = 0;
      if (modality === "cvvhd") { qpre = 0; qpost = 0; }
      if (qd + qpre + qpost + qnet === 0) return null;
      const opts = { weightKg: v.weight, qdMlH: qd, qpreMlH: qpre, qpostMlH: qpost, qnetMlH: qnet, qbMlMin: v.qb, hct: v.hct, modality: modality };
      let dose;
      try { dose = F.crrtEffluentDose(opts); }
      catch (e) {
        if (qpre > 0) return { primary: { name: "Need Qb and Hct", value: "—", unit: "" }, extra: [], chips: [chip("Predilution correction requires blood flow and hematocrit", "warn")] };
        throw e;
      }
      const extra = [
        { name: "Prescribed effluent (uncorrected)", value: fmt(dose.prescribedMlKgH, 1), unit: "mL/kg/h" },
        { name: "Predilution factor DF = Qp/(Qp+Qpre)", value: fmt(dose.df, 3), unit: "" },
        { name: "Effluent rate", value: fmt(dose.qeffMlH, 0), unit: "mL/h" },
      ];
      const chips = [];
      const delivered = dose.correctedMlKgH;
      if (delivered < 20) chips.push(chip("Corrected dose < 20 mL/kg/h (below the KDIGO delivered target of 20–25)", "warn"));
      else if (delivered <= 25) chips.push(chip("Corrected dose in the KDIGO 20–25 mL/kg/h delivered-target range", "ok"));
      else chips.push(chip("Corrected dose > 25 mL/kg/h (ATN and RENAL found no benefit of higher delivered dose vs ~20–25)", "info"));
      chips.push(chip("KDIGO: prescribe more than 20–25 to achieve 20–25 delivered after downtime", "info"));
      if (v.qb != null && v.hct != null) {
        const ff = F.filtrationFraction({ qbMlMin: v.qb, hct: v.hct, qpreMlH: qpre, qpostMlH: qpost, qnetMlH: qnet, modality: modality });
        extra.push({ name: "Plasma flow Qp", value: fmt(ff.qpMlH, 0), unit: "mL/h" });
        extra.push({ name: "Ultrafiltration Quf", value: fmt(ff.qufMlH, 0), unit: "mL/h" });
        extra.push({ name: "FF (Quf / Qp, post-filter style)", value: fmt(ff.ffPostPct, 1), unit: "%" });
        extra.push({ name: "FF (Quf / (Qp+Qpre), pre-dilution)", value: fmt(ff.ffPrePct, 1), unit: "%" });
        const ffUse = qpre > 0 ? ff.ffPrePct : ff.ffPostPct;
        if (ffUse > 25) chips.push(chip("Filtration fraction > 25%: high clotting risk — consider more predilution or higher Qb", "danger"));
        else if (ffUse > 20) chips.push(chip("Filtration fraction 20–25%: in the commonly cited caution zone", "warn"));
        else chips.push(chip("Filtration fraction ≤ 20%", "ok"));
      }
      return {
        primary: { name: "Corrected effluent dose", value: fmt(dose.correctedMlKgH, 1), unit: "mL/kg/h", raw: dose.correctedMlKgH },
        extra: extra,
        chips: chips,
      };
    },
    equation: "Qeff (mL/h) = Qd + Qpre + Qpost + Qnet\nQp = Qb (mL/min) × 60 × (1 − Hct)\nPredilution DF = Qp / (Qp + Qpre)    (DF = 1 if Qpre = 0)\nCorrected dose (mL/kg/h) = (Qeff × DF) / weight_kg     (urea sieving coefficient ≈ 1)\nCVVHD: Quf for FF = Qnet only.  CVVH / CVVHDF: Quf = Qpre + Qpost + Qnet\nFF_post = Quf / Qp;    FF_pre = Quf / (Qp + Qpre)\nKDIGO AKI 2012: deliver 20–25 mL/kg/h (usually requires a higher prescription).",
    citation: { text: "KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2:1-138 (recommendation 5.8.4). Evidence: Palevsky PM et al. (ATN). N Engl J Med. 2008;359:7-20. Bellomo R et al. (RENAL). N Engl J Med. 2009;361:1627-1638. Predilution and FF: Macedo E, Mehta RL. Continuous dialysis therapies: Core Curriculum 2016. Am J Kidney Dis. 2016.", doi: "10.1038/kisup.2011.32" },
    caveats: [
      "This is the prescribed (or instantaneous) dose. Delivered dose is lower because of downtime. KDIGO explicitly says a higher prescription is usually required to deliver 20–25 mL/kg/h.",
      "We do not apply a 0.93 plasma-water correction; some authors do. FF caution of 20–25% is practice-based (filter life), not a KDIGO numeric target.",
      "Hematocrit may be entered as a percent (30) or a fraction (0.30).",
    ],
  });

  C.push({
    id: "citrate-ca",
    section: "crrt",
    title: "Citrate / calcium ratio",
    short: "Total-to-ionized calcium ratio as a marker of citrate accumulation.",
    keywords: "citrate rca ionized calcium accumulation meier-kriesche",
    fields: [
      { key: "tca", label: "Total calcium", dim: "calcium" },
      { key: "ica", label: "Ionized calcium", dim: "ica", hint: "Usually mmol/L (e.g. 1.05–1.30). Set units carefully — a mg/dL iCa is unusual." },
    ],
    compute(v) {
      if (v.tca == null || v.ica == null) return null;
      const r = F.citrateCalciumRatio(v.tca, "mg/dL", v.ica, "mmol/L");
      const chips = [];
      if (r.ratio > 2.5) chips.push(chip("Ratio > 2.5: suggests citrate accumulation (Meier-Kriesche 2001)", "danger"));
      else if (r.ratio > 2.1) chips.push(chip("Ratio > 2.1: caution — used as a more sensitive early warning; 2.5 is the original cutoff", "warn"));
      else chips.push(chip("Ratio ≤ 2.1", "ok"));
      return {
        primary: { name: "Total / ionized Ca ratio", value: fmt(r.ratio, 2), unit: "", raw: r.ratio },
        extra: [
          { name: "Total calcium", value: fmt(r.totalMmol, 2), unit: "mmol/L" },
          { name: "Ionized calcium", value: fmt(r.icaMmol, 2), unit: "mmol/L" },
        ],
        chips: chips,
        notes: ["Both concentrations are converted to mmol/L before the ratio. Total Ca (mg/dL) ÷ 4 = mmol/L."],
      };
    },
    equation: "Ratio = total calcium (mmol/L) / ionized calcium (mmol/L)\nTotal Ca mg/dL ÷ 4 = mmol/L.\nMeier-Kriesche cutoff: ratio > 2.5 suggests citrate accumulation. A caution threshold of 2.1 is also used.",
    citation: { text: "Meier-Kriesche HU, Gitomer J, Finkel K, DuBose T. Increased total to ionized calcium ratio during continuous venovenous hemodialysis with regional citrate anticoagulation. Crit Care Med. 2001;29:748-752.", doi: "10.1097/00003246-200104000-00010", pmid: "11373461" },
    caveats: [
      "The 2.5 cutoff was derived with uncorrected total calcium. Do not apply it uncritically to albumin-corrected total calcium.",
      "A rising ratio, falling ionized calcium despite increased calcium infusion, and rising anion gap / falling HCO₃ also suggest accumulation, especially in liver failure.",
      "Confirm contemporaneous draws and that units are not mixed up (the usual lab mix is total in mg/dL and ionized in mmol/L — this calculator converts them).",
    ],
  });

  C.push({
    id: "pd-adequacy",
    section: "pd",
    title: "PD adequacy (weekly Kt/V & CrCl)",
    short: "Peritoneal plus residual weekly urea Kt/V (Watson V) and creatinine clearance (Mosteller BSA).",
    keywords: "peritoneal dialysis weekly ktv creatinine clearance ispd residual",
    fields: [
      { key: "age", label: "Age", unit: "years" },
      { key: "sex", label: "Sex", type: "seg", options: [["male", "Male"], ["female", "Female"]] },
      { key: "height", label: "Height", unit: "cm" },
      { key: "weight", label: "Weight", unit: "kg", hint: "Used for Watson V and BSA" },
      { key: "dpUrea", label: "24-h dialysate / plasma urea (D/P urea)", unit: "" },
      { key: "drain", label: "24-h drain volume", unit: "L" },
      { key: "dpCr", label: "24-h dialysate / plasma creatinine (D/P Cr)", unit: "", optional: true },
      { key: "upUrea", label: "24-h urine / plasma urea (U/P urea)", unit: "", optional: true },
      { key: "upCr", label: "24-h urine / plasma creatinine (U/P Cr)", unit: "", optional: true },
      { key: "urine", label: "24-h urine volume", unit: "L", optional: true },
      { key: "bsaMethod", label: "BSA formula for CrCl", type: "seg", options: [["mosteller", "Mosteller (default)"], ["dubois", "DuBois"]], optional: true },
    ],
    compute(v) {
      if (v.sex == null || v.height == null || v.weight == null || v.dpUrea == null || v.drain == null) return null;
      if (v.sex === "male" && v.age == null) return null;
      const V = F.watsonTbw(v.age || 0, v.height, v.weight, v.sex === "female");
      const ktv = F.pdWeeklyKtv(v.dpUrea, v.drain, V, v.upUrea, v.urine);
      const extra = [
        { name: "Watson V", value: fmt(V, 1), unit: "L" },
        { name: "Peritoneal weekly Kt/V", value: fmt(ktv.weeklyKtvPeritoneal, 2), unit: "" },
        { name: "Renal weekly Kt/V", value: fmt(ktv.weeklyKtvRenal, 2), unit: "" },
      ];
      const chips = [];
      if (ktv.weeklyKtvTotal >= 1.7) chips.push(chip("Total weekly Kt/V urea ≥ 1.7 (historical ISPD / KDOQI reference)", "ok"));
      else chips.push(chip("Total weekly Kt/V urea < 1.7 (historical reference; ISPD 2020 is less prescriptive)", "warn"));
      if (v.dpCr != null) {
        const cr = F.pdWeeklyCrCl({
          dOverPCr: v.dpCr, drainVolumeL: v.drain,
          uOverPCr: v.upCr, uOverPUrea: v.upUrea, urineVolumeL: v.urine,
          heightCm: v.height, weightKg: v.weight,
          bsaMethod: v.bsaMethod === "dubois" ? "dubois" : "mosteller",
        });
        extra.push({ name: "BSA (" + cr.bsaMethod + ")", value: fmt(cr.bsa, 2), unit: "m²" });
        extra.push({ name: "Peritoneal CrCl", value: fmt(cr.peritonealLWeek173, 1), unit: "L/week/1.73 m²" });
        extra.push({ name: "Residual (mean of urea & creatinine clearance)", value: fmt(cr.rkfMeanLWeek173, 1), unit: "L/week/1.73 m²" });
        extra.push({ name: "Total weekly CrCl", value: fmt(cr.totalLWeek173, 1), unit: "L/week/1.73 m²" });
        if (cr.bsaMethod === "Mosteller") {
          extra.push({ name: "DuBois BSA (for comparison)", value: fmt(F.bsaDuBois(v.height, v.weight), 2), unit: "m²" });
        }
      }
      return {
        primary: { name: "Total weekly Kt/V urea", value: fmt(ktv.weeklyKtvTotal, 2), unit: "", raw: ktv.weeklyKtvTotal },
        extra: extra,
        chips: chips,
        notes: ["Residual kidney function in the CrCl total is the mean of renal urea and creatinine clearance, per standard ISPD / KDOQI practice. BSA is Mosteller unless you choose DuBois."],
      };
    },
    equation: "Peritoneal daily Kt (L) = (D/P urea) × 24-h drain volume (L)\nRenal daily Kt (L)     = (U/P urea) × 24-h urine volume (L)\nWeekly Kt/V = 7 × (Ktp + Ktr) / V_Watson\nPeritoneal CrCl (L/week) = (D/P Cr) × drain (L) × 7\nRKF (L/week) = 0.5 × (renal Curea + renal Ccr) × 7\nReport CrCl as L/week/1.73 m² = (L/week) × 1.73 / BSA\nMosteller BSA (default) = √(height_cm × weight_kg / 3600)\nDuBois BSA = 0.007184 × weight^0.425 × height^0.725",
    citation: { text: "ISPD 2020: Brown EA, Blake PG, et al. International Society for Peritoneal Dialysis practice recommendations: Prescribing high-quality goal-directed peritoneal dialysis. Perit Dial Int. 2020;40:323-329. Earlier adequacy target (Kt/V 1.7): Lo WK et al. ISPD guidelines. Perit Dial Int. 2006. Watson: Am J Clin Nutr. 1980. Mosteller RD. N Engl J Med. 1987;317:1098. Du Bois D, Du Bois EF. Arch Intern Med. 1916;17:863-871.", doi: "10.1177/0896860819895364", pmid: "32063220" },
    caveats: [
      "ISPD 2020 emphasizes quality of life and volume status over a single Kt/V cutoff. The 1.7 weekly Kt/V urea figure is a historical reference from earlier ISPD / KDOQI guidance, still widely cited.",
      "Use 24-hour collections of dialysate and urine. Plasma urea and creatinine should be measured on the same day.",
      "Watson V and Mosteller BSA are estimates. We state Mosteller as the default and also report DuBois BSA for comparison.",
    ],
  });

  C.push({
    id: "pet",
    section: "pd",
    title: "PET (peritoneal equilibration test)",
    short: "4-hour D/P creatinine and D/D0 glucose with Twardowski transporter categories.",
    keywords: "pet twardowski transporter high average low d/p",
    fields: [
      { key: "dcr", label: "4-h dialysate creatinine", dim: "creatinine", optional: true, hint: "Or enter D/P directly" },
      { key: "pcr", label: "Plasma creatinine", dim: "creatinine", optional: true },
      { key: "dp", label: "4-h D/P creatinine (if already calculated)", unit: "", optional: true },
      { key: "dglu4", label: "4-h dialysate glucose", unit: "same as 0-h", optional: true },
      { key: "dglu0", label: "0-h (instilled) dialysate glucose", unit: "same as 4-h", optional: true },
      { key: "dd0", label: "4-h D/D0 glucose (if already calculated)", unit: "", optional: true },
    ],
    compute(v) {
      const ratios = F.petRatios(v.dcr, v.pcr, v.dglu4, v.dglu0);
      const dp = v.dp != null ? v.dp : ratios.dpCr;
      const dd0 = v.dd0 != null ? v.dd0 : ratios.dd0;
      if (dp == null && dd0 == null) return null;
      const cat = F.petCategory(dp, dd0);
      const extra = [];
      const chips = [];
      if (dp != null) {
        extra.push({ name: "4-h D/P creatinine", value: fmt(dp, 2), unit: "" });
        chips.push(chip("D/P Cr category: " + cat.crCategory, "info"));
        if (cat.crNote) extra.push({ name: "Note", value: cat.crNote, unit: "" });
      }
      if (dd0 != null) {
        extra.push({ name: "4-h D/D0 glucose", value: fmt(dd0, 2), unit: "" });
        chips.push(chip("D/D0 glucose category: " + cat.glucoseCategory, "info"));
        if (cat.gluNote) extra.push({ name: "Note", value: cat.gluNote, unit: "" });
      }
      chips.push(chip("Classification is primarily by 4-h D/P creatinine; D/D0 is supportive", "info"));
      return {
        primary: { name: dp != null ? "Transporter (D/P Cr)" : "Transporter (D/D0)", value: (dp != null ? cat.crCategory : cat.glucoseCategory) || "—", unit: "", raw: dp },
        extra: extra,
        chips: chips,
        notes: [
          "Twardowski 4-h D/P Cr: Low 0.34–0.49, Low-average 0.50–0.64, High-average 0.65–0.81, High 0.82–1.03.",
          "Twardowski 4-h D/D0 glucose: High 0.12–0.26, High-average 0.27–0.38, Low-average 0.39–0.49, Low 0.50–0.61.",
        ],
      };
    },
    equation: "D/P creatinine (4 h) = dialysate Cr / plasma Cr\nD/D0 glucose (4 h) = dialysate glucose at 4 h / instilled (0-h) glucose\nTwardowski 1987 4-h D/P Cr bands: Low 0.34–0.49; LA 0.50–0.64; HA 0.65–0.81; High 0.82–1.03.\n4-h D/D0 glucose bands: High 0.12–0.26; HA 0.27–0.38; LA 0.39–0.49; Low 0.50–0.61.",
    citation: { text: "Twardowski ZJ, Nolph KD, Khanna R, et al. Peritoneal equilibration test. Perit Dial Bull. 1987;7:138-147. ISPD 2021 membrane function: Morelle J et al. ISPD recommendations for the evaluation of peritoneal membrane dysfunction in adults. Perit Dial Int. 2021.", doi: "10.1177/0896860820982218", pmid: "33563110" },
    caveats: [
      "Use a standard 2.5% (or 2.27%) 4-hour PET as originally described. Correct dialysate creatinine for glucose interference if the lab requires it.",
      "ISPD 2021 advises interpreting 4-h D/P creatinine relative to the local laboratory and centre distribution; the Twardowski bands are historical and remain the most widely taught cutoffs.",
      "Judgment: some manuals list the high-average / low-average D/D0 boundary as 0.37 rather than 0.38. We use 0.38 as the top of high-average.",
    ],
  });

  C.push({
    id: "rkf",
    section: "pd",
    title: "Residual kidney function",
    short: "Mean of urea and creatinine clearance from a timed urine collection.",
    keywords: "residual renal function rkf urea creatinine clearance pd",
    fields: [
      { key: "urine", label: "Urine volume", unit: "mL" },
      { key: "hours", label: "Collection time", unit: "hours", hint: "Default 24 if left blank", optional: true },
      { key: "upUrea", label: "U/P urea (urine/plasma)", unit: "" },
      { key: "upCr", label: "U/P creatinine (urine/plasma)", unit: "" },
      { key: "height", label: "Height (for 1.73 m²)", unit: "cm", optional: true },
      { key: "weight", label: "Weight (for 1.73 m²)", unit: "kg", optional: true },
    ],
    compute(v) {
      if (v.urine == null || v.upUrea == null || v.upCr == null) return null;
      const minutes = (v.hours != null ? v.hours : 24) * 60;
      const r = F.residualKidneyFunction({
        urineMl: v.urine, minutes: minutes, uOverPUrea: v.upUrea, uOverPCr: v.upCr,
        heightCm: v.height, weightKg: v.weight,
      });
      const extra = [
        { name: "Urea clearance", value: fmt(r.cUreaMlMin, 2), unit: "mL/min" },
        { name: "Creatinine clearance", value: fmt(r.cCrMlMin, 2), unit: "mL/min" },
        { name: "Mean clearance (weekly)", value: fmt(r.lWeek, 1), unit: "L/week" },
      ];
      if (r.lWeek173 != null) extra.push({ name: "Mean clearance", value: fmt(r.lWeek173, 1), unit: "L/week/1.73 m² (Mosteller)" });
      return {
        primary: { name: "Residual GFR (mean of urea & creatinine clearance)", value: fmt(r.meanMlMin, 2), unit: "mL/min", raw: r.meanMlMin },
        extra: extra,
        chips: [chip("Mean of urea and creatinine clearance is the ISPD / KDOQI convention for residual function", "info")],
      };
    },
    equation: "Curea (mL/min) = (U/P urea) × Vurine (mL) / time (min)\nCcr (mL/min)   = (U/P Cr) × Vurine (mL) / time (min)\nRKF = ½ × (Curea + Ccr)\nL/week = RKF (mL/min) × 10.08;    L/week/1.73 m² = L/week × 1.73 / BSA_Mosteller",
    citation: { text: "Standard ISPD / KDOQI PD adequacy practice (mean of residual urea and creatinine clearance). ISPD 2020 prescribing recommendations: Brown EA et al. Perit Dial Int. 2020;40:323-329.", doi: "10.1177/0896860819895364" },
    caveats: [
      "Creatinine clearance alone overestimates residual GFR because of tubular creatinine secretion; urea clearance underestimates it. The mean is the usual compromise.",
      "A complete 24-hour urine collection is required. Inaccurate volume is the main error.",
    ],
  });

  const api = { SECTIONS: SECTIONS, CALCULATORS: C, fmt: fmt };
  global.NephCalculators = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
