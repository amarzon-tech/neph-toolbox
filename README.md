# Nephrology Toolbox (Draft)

A clinician-facing, offline calculator collection for Dr Amar Damodar (Dr D).  
**Draft — not for clinical use until reviewed by Dr D.**

Publisher: Wellness Tech LLC. Support: [amardamodar@gmail.com](mailto:amardamodar@gmail.com).

## Preview

- App: https://amarzon-tech.github.io/neph-toolbox/
- Repository: https://github.com/amarzon-tech/neph-toolbox

This repository is public so the preview can be opened. It is a draft for review, not a finished clinical product.

## What it is

- Static PWA (service worker + manifest). After the first visit it works offline.
- No login, no ads, no analytics, no network calls for calculation, no data collection.
- Inputs stay in memory on the device and are not stored.
- Visible draft banner on every screen. `DRAFT=true` in `js/config.js`.
- US / SI unit toggle for creatinine, BUN/urea, glucose, albumin, calcium, phosphate, and ACR.
- Searchable list of calculators, grouped by section, with the equation, citation (author, journal, year, DOI or PubMed), and limitations on each page.

## Calculators

**Kidney function.** CKD-EPI 2021 creatinine (race-free); CKD-EPI 2021 creatinine–cystatin C; CKD-EPI 2012 cystatin C; Cockcroft–Gault CrCl (actual, ideal, and adjusted body weight); KFRE 4- and 8-variable, 2- and 5-year, North American coefficients.

**Electrolytes.** FENa; FEUrea; anion gap (optional Figge albumin correction); osmolal gap; sodium correction for hyperglycemia (Katz 1.6 and Hillier 2.4); free-water deficit (sex- and age-specific TBW fractions).

**Acid–base.** Winter’s formula; delta–delta ratio and delta gap; expected compensation for metabolic acidosis/alkalosis and acute/chronic respiratory acidosis/alkalosis.

**Proteinuria.** UPCR and UACR from a spot urine (mg/g and mg/mmol), estimated 24-hour excretion, KDIGO A1–A3 categories.

**Hemodialysis.** URR; single-pool Kt/V (Daugirdas second generation); equilibrated Kt/V (Tattersall and Daugirdas–Schneditz rate equations); standard weekly Kt/V (Leypoldt and FHN / Daugirdas 2010); nPCR/nPNA from the interdialytic BUN rise (and the Depner–Daugirdas midweek equation); ultrafiltration rate with the 13 mL/kg/h threshold; Watson total body water.

**CRRT.** Prescribed and predilution-corrected effluent dose for CVVH, CVVHD and CVVHDF versus the KDIGO 20–25 mL/kg/h delivered target; filtration fraction (post-filter and pre-dilution); citrate/calcium ratio.

**Peritoneal dialysis.** Weekly Kt/V urea (dialysate + residual renal, Watson V); weekly creatinine clearance normalized to 1.73 m² (Mosteller BSA, DuBois also shown); PET D/P creatinine and D/D0 glucose with Twardowski transporter categories; residual kidney function as the mean of urea and creatinine clearance. Cited to ISPD guidance.

Every formula is listed for sign-off in [CONTENT_REVIEW.md](CONTENT_REVIEW.md). Judgment calls and source disagreements are summarized there.

## Tests

Worked examples from the published equations, NIDDK/NKF implementation values, and unit-invariance checks:

```bash
node tests/formulas.test.js
```

All tests must pass before a release. The same `js/formulas.js` file is used in the browser and in Node.

## Privacy

The app is a set of static files. It does not collect, store, or transmit patient data. The only optional network use is loading the files themselves (and a citation link the clinician chooses to open). A service worker caches the app for offline use.

## License and medical use

Draft educational software. Not a medical device and not approved for clinical care until Dr D has signed off on the medical content. Do not set `DRAFT=false`, and do not use this in clinical care, without that sign-off in his own words.
