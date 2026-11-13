/**
 * Units-correct tests for Nephrology Toolbox formulas.
 * Expected values are computed from the published equations (and, where noted,
 * from worked examples in the source papers or standard references).
 * Run: node tests/formulas.test.js
 */
"use strict";

const assert = require("assert");
const F = require("../js/formulas.js");

let passed = 0;
let failed = 0;
const failures = [];

function approx(actual, expected, tol, msg) {
  const t = tol == null ? 1e-9 : tol;
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= t;
  if (!ok) {
    failed++;
    const line = `${msg}: expected ${expected}, got ${actual}`;
    failures.push(line);
    console.error("  FAIL", line);
  } else {
    passed++;
  }
}

function eq(actual, expected, msg) {
  try {
    assert.strictEqual(actual, expected);
    passed++;
  } catch (e) {
    failed++;
    const line = `${msg}: expected ${expected}, got ${actual}`;
    failures.push(line);
    console.error("  FAIL", line);
  }
}

function throws(fn, msg) {
  try {
    fn();
    failed++;
    failures.push(`${msg}: expected throw`);
    console.error("  FAIL", msg, "expected throw");
  } catch (e) {
    passed++;
  }
}

function section(name) {
  console.log("\n" + name);
}

/* ── unit conversions ───────────────────────────────────────────────────── */
section("Unit conversions");
approx(F.convertCrToMgDl(88.4, "umol/L"), 1.0, 1e-12, "88.4 µmol/L = 1.0 mg/dL");
approx(F.convertCrToMgDl(1.2, "mg/dL"), 1.2, 1e-12, "creatinine mg/dL passthrough");
approx(F.convertBunToMgDl(10, "mmol/L"), 28, 1e-12, "urea 10 mmol/L = BUN 28 mg/dL (×2.8)");
approx(F.convertGluToMgDl(10, "mmol/L"), 180, 1e-12, "glucose 10 mmol/L = 180 mg/dL");
approx(F.convertCaToMmol(10, "mg/dL"), 2.5, 1e-12, "Ca 10 mg/dL = 2.5 mmol/L");
approx(F.convertPo4ToMgDl(1.29, "mmol/L"), 1.29 * 3.097, 1e-12, "phosphate mmol to mg/dL");
approx(F.convertAlbToGdl(40, "g/L"), 4.0, 1e-12, "albumin 40 g/L = 4.0 g/dL");
approx(F.convertAcrToMgg(3, "mg/mmol"), 26.52, 1e-12, "ACR 3 mg/mmol = 26.52 mg/g (×8.84)");

/* ── CKD-EPI 2021 creatinine ────────────────────────────────────────────── */
section("CKD-EPI 2021 creatinine (Inker NEJM 2021; NIDDK form)");
// 50-year-old man, Scr 1.0 mg/dL — above the 0.9 knot
// eGFR = 142 × (1/0.9)^−1.200 × 0.9938^50
approx(F.egfrCkdEpi2021Cr(1.0, 50, false), 91.6914786098333, 1e-9, "M50 Scr 1.0");
// Female at the 0.7 knot: min=max=1, eGFR = 142 × 0.9938^60 × 1.012
approx(F.egfrCkdEpi2021Cr(0.7, 60, true), 98.94831465668567, 1e-9, "F60 Scr 0.7 (knot)");
approx(F.egfrCkdEpi2021Cr(1.2, 60, true), 51.821329905767215, 1e-9, "F60 Scr 1.2");
approx(F.egfrCkdEpi2021Cr(2.0, 80, false), 33.11789719547246, 1e-9, "M80 Scr 2.0");
approx(F.egfrCkdEpi2021Cr(0.9, 50, false), 104.0490129932253, 1e-9, "M50 Scr 0.9 (knot)");
// SI: 88.4 µmol/L = 1.0 mg/dL, same result
approx(F.egfrCkdEpi2021Cr(F.convertCrToMgDl(88.4, "umol/L"), 50, false), 91.6914786098333, 1e-9, "M50 Scr 88.4 µmol/L");
// Below-knot male (Scr 0.7 < 0.9): uses α = −0.302
{
  const expected = 142 * Math.pow(0.7 / 0.9, -0.302) * Math.pow(0.9938, 40);
  approx(F.egfrCkdEpi2021Cr(0.7, 40, false), expected, 1e-9, "M40 Scr 0.7 (below knot)");
}
eq(F.kdigoGCategory(91.7), "G1", "G1");
eq(F.kdigoGCategory(75), "G2", "G2");
eq(F.kdigoGCategory(50), "G3a", "G3a");
eq(F.kdigoGCategory(35), "G3b", "G3b");
eq(F.kdigoGCategory(20), "G4", "G4");
eq(F.kdigoGCategory(10), "G5", "G5");
throws(() => F.egfrCkdEpi2021Cr(0, 50, false), "zero creatinine rejected");

/* ── CKD-EPI 2021 cr-cys ────────────────────────────────────────────────── */
section("CKD-EPI 2021 creatinine–cystatin C (Inker NEJM 2021; NKF form)");
approx(F.egfrCkdEpi2021CrCys(1.0, 1.0, 50, false), 88.14399054363913, 1e-9, "M50 Scr 1.0 cys 1.0");
approx(F.egfrCkdEpi2021CrCys(0.6, 0.7, 70, true), 106.79689059071461, 1e-9, "F70 Scr 0.6 cys 0.7");
// Both at knots: male Scr 0.9, cys 0.8 — all min/max terms = 1
{
  const expected = 135 * Math.pow(0.9961, 50);
  approx(F.egfrCkdEpi2021CrCys(0.9, 0.8, 50, false), expected, 1e-9, "M50 at both knots");
}

/* ── CKD-EPI 2012 cystatin C ────────────────────────────────────────────── */
section("CKD-EPI 2012 cystatin C (Inker NEJM 2012; NKF 0.996 age base)");
approx(F.egfrCkdEpi2012Cys(1.0, 50, false), 80.93233394899187, 1e-9, "M50 cys 1.0");
approx(F.egfrCkdEpi2012Cys(0.8, 40, true), 105.59444946683607, 1e-9, "F40 cys 0.8 (knot)");
{
  const expected = 133 * Math.pow(0.996, 40) * 0.932;
  approx(F.egfrCkdEpi2012Cys(0.8, 40, true), expected, 1e-12, "F40 knot closed form");
}

/* ── Cockcroft–Gault and weights ────────────────────────────────────────── */
section("Cockcroft–Gault (Nephron 1976) and Devine IBW");
// Classic: 50-year-old man, 70 kg, Scr 1.0 → (90×70)/72 = 87.5
approx(F.cockcroftGault(1.0, 50, 70, false), 87.5, 1e-12, "M50 70 kg Scr 1.0 = 87.5");
approx(F.cockcroftGault(1.0, 50, 70, true), 74.375, 1e-12, "female 0.85 factor");
// SI creatinine: 88.4 µmol/L = 1 mg/dL
approx(F.cockcroftGault(F.convertCrToMgDl(88.4, "umol/L"), 50, 70, false), 87.5, 1e-12, "CG with SI creatinine");
approx(F.devineIbw(178, false), 73.18110236220471, 1e-9, "Devine IBW male 178 cm");
approx(F.devineIbw(152.4, true), 45.5, 1e-9, "Devine IBW female exactly 5 ft = 45.5");
approx(F.adjustedBodyWeight(100, 70), 82, 1e-12, "AdjBW = IBW + 0.4×(ABW−IBW)");
// Using IBW in CG
{
  const ibw = F.devineIbw(178, false);
  const cg = F.cockcroftGault(1.0, 50, ibw, false);
  approx(cg, ((140 - 50) * ibw) / 72, 1e-12, "CG with Devine IBW");
}

/* ── KFRE North American ────────────────────────────────────────────────── */
section("KFRE North American coefficients (Tangri JAMA 2011 / 2016)");
{
  const r2 = F.kfreNorthAmerican({ age: 65, female: false, egfr: 45, acrMgg: 300, years: 2, variables: 4 });
  const r5 = F.kfreNorthAmerican({ age: 65, female: false, egfr: 45, acrMgg: 300, years: 5, variables: 4 });
  approx(r2.lp, -0.508708243930053, 1e-12, "4-var LP 65M eGFR45 ACR300");
  approx(r2.s0, 0.975, 0, "NA 4-var 2-year S0 = 0.9750");
  approx(r5.s0, 0.924, 0, "NA 4-var 5-year S0 = 0.9240");
  approx(r2.riskPct, 1.5107600946257294, 1e-10, "4-var 2-year risk %");
  approx(r5.riskPct, 4.641474904223919, 1e-10, "4-var 5-year risk %");
}
{
  const r = F.kfreNorthAmerican({ age: 70, female: true, egfr: 20, acrMgg: 1000, years: 2, variables: 4 });
  approx(r.riskPct, 25.66933451850949, 1e-10, "4-var 70F eGFR20 ACR1000 2y");
}
{
  // 8-var with labs at centering means: extras contribute 0
  const r = F.kfreNorthAmerican({
    age: 65, female: false, egfr: 45, acrMgg: 300, years: 2, variables: 8,
    albuminGdl: 3.997, phosphateMgDl: 3.916, bicarbonate: 25.57, calciumMgDl: 9.355,
  });
  approx(r.s0, 0.978, 0, "NA 8-var 2-year S0 = 0.9780");
  approx(r.riskPct, 1.3304588213099322, 1e-10, "8-var at mean labs");
  const r5 = F.kfreNorthAmerican({
    age: 65, female: false, egfr: 45, acrMgg: 300, years: 5, variables: 8,
    albuminGdl: 3.997, phosphateMgDl: 3.916, bicarbonate: 25.57, calciumMgDl: 9.355,
  });
  approx(r5.s0, 0.9301, 0, "NA 8-var 5-year S0 = 0.9301");
}
{
  const r = F.kfreNorthAmerican({
    age: 65, female: false, egfr: 45, acrMgg: 300, years: 2, variables: 8,
    albuminGdl: 3.0, phosphateMgDl: 5.0, bicarbonate: 18, calciumMgDl: 8.0,
  });
  approx(r.riskPct, 5.735968248471435, 1e-10, "8-var abnormal labs");
}
// ACR unit: 300 mg/g = 300/8.84 mg/mmol; converting the other way should match
{
  const acrMgg = F.convertAcrToMgg(300 / 8.84, "mg/mmol");
  approx(acrMgg, 300, 1e-12, "ACR unit round-trip");
}
throws(() => F.kfreNorthAmerican({ age: 65, female: false, egfr: 45, acrMgg: 0, years: 2 }), "zero ACR rejected");

/* ── Electrolytes ───────────────────────────────────────────────────────── */
section("FENa (Espinel JAMA 1976) and FEUrea (Carvounis KI 2002)");
approx(F.fena(20, 140, 100, 2), 0.2857142857142857, 1e-12, "FENa worked example");
approx(F.feUrea(200, 20, 100, 2), 20, 1e-12, "FEUrea 20%");
// Units cancel: same result if both creatinines in µmol/L (×88.4)
approx(F.fena(20, 140, 100 * 88.4, 2 * 88.4), 0.2857142857142857, 1e-12, "FENa SI creatinine cancels");

section("Anion gap and Figge albumin correction (Crit Care Med 1998)");
{
  const r = F.anionGap(140, 104, 12);
  approx(r.ag, 24, 1e-12, "AG = 24");
  eq(r.agCorrected, null, "no albumin → no correction");
  const c = F.anionGap(140, 104, 12, 2.0);
  // 24 + 2.5×(4.4−2.0) = 30  (Figge worked pattern)
  approx(c.agCorrected, 30, 1e-12, "Figge AGc = 30 at albumin 2.0");
}

section("Osmolal gap (Worthley conventional 2×Na + glu/18 + BUN/2.8)");
{
  const r = F.osmolalGap(140, 90, 28, 305);
  approx(r.calculated, 295, 1e-12, "calc osm = 295");
  approx(r.gap, 10, 1e-12, "gap = 10");
  // SI equivalent: glu 90 mg/dL = 5 mmol, BUN 28 = urea 10 mmol → 280+5+10=295
  const si = 2 * 140 + 90 / 18 + 28 / 2.8;
  approx(r.calculated, si, 1e-12, "SI identity");
  const etoh = F.osmolalGap(140, 90, 28, 325, 92);
  // + 92/4.6 = 20
  approx(etoh.calculated, 315, 1e-12, "includes ethanol/4.6");
}

section("Sodium correction for hyperglycemia (Katz 1.6, Hillier 2.4)");
{
  // Katz NEJM 1973; Hillier Am J Med 1999. Na 130, glucose 400:
  // +1.6×(400−100)/100 = +4.8 → 134.8;  +2.4×3 = +7.2 → 137.2
  const r = F.sodiumCorrectionHyperglycemia(130, 400);
  approx(r.katz, 134.8, 1e-12, "Katz 1.6");
  approx(r.hillier, 137.2, 1e-12, "Hillier 2.4");
  const at100 = F.sodiumCorrectionHyperglycemia(140, 100);
  approx(at100.katz, 140, 1e-12, "no correction at glucose 100");
  // SI: 22.2 mmol/L = 400 mg/dL
  const si = F.sodiumCorrectionHyperglycemia(130, F.convertGluToMgDl(22.22222222222222, "mmol/L"));
  approx(si.katz, 134.8, 1e-6, "Katz with SI glucose");
}

section("Free water deficit (Adrogué & Madias NEJM 2000 fractions)");
{
  // Classic: 70 kg adult man, Na 160, target 140 → 0.6×70×(160/140−1) = 6.0 L
  const r = F.freeWaterDeficit(160, 70, false, 40, 140);
  approx(r.fraction, 0.6, 0, "adult male 0.60");
  approx(r.deficitL, 6.0, 1e-12, "6.0 L worked example");
  const ef = F.freeWaterDeficit(155, 60, true, 75, 140);
  approx(ef.fraction, 0.45, 0, "elderly female 0.45");
  approx(ef.deficitL, 2.8928571428571446, 1e-12, "elderly female deficit");
  const em = F.freeWaterDeficit(150, 80, false, 65);
  approx(em.fraction, 0.5, 0, "elderly male ≥65 uses 0.50");
  const yw = F.freeWaterDeficit(150, 80, true, 40);
  approx(yw.fraction, 0.5, 0, "adult female 0.50");
}

/* ── Acid–base ──────────────────────────────────────────────────────────── */
section("Winter's formula (Albert, Dell, Winters 1967)");
{
  const w = F.wintersFormula(12);
  approx(w.expected, 26, 1e-12, "HCO3 12 → PCO2 26");
  approx(w.low, 24, 1e-12, "±2 low");
  approx(w.high, 28, 1e-12, "±2 high");
}

section("Delta–delta (Rastegar JASN 2007 cutoffs)");
{
  const pure = F.deltaDelta(24, 12);
  approx(pure.deltaAg, 12, 1e-12, "ΔAG 12");
  approx(pure.deltaHco3, 12, 1e-12, "ΔHCO3 12");
  approx(pure.ratio, 1, 1e-12, "ratio 1 = pure HAGMA");
  assert.ok(pure.interpretation.indexOf("pure high-anion-gap") !== -1);
  passed++;
  const mixedNagma = F.deltaDelta(16, 10); // ΔAG 4, ΔHCO3 14, ratio ≈ 0.286
  approx(mixedNagma.ratio, 4 / 14, 1e-12, "low ratio");
  assert.ok(mixedNagma.interpretation.indexOf("normal-anion-gap") !== -1);
  passed++;
  const mixedAlk = F.deltaDelta(30, 20); // ΔAG 18, ΔHCO3 4, ratio 4.5
  approx(mixedAlk.ratio, 4.5, 1e-12, "high ratio");
  assert.ok(mixedAlk.interpretation.indexOf("metabolic alkalosis") !== -1);
  passed++;
}

section("Expected compensation");
{
  const ma = F.expectedCompensation("metabolic_acidosis", 12, 26);
  approx(ma.expected, 26, 1e-12, "Winter's via compensation helper");
  const mal = F.expectedCompensation("metabolic_alkalosis", 34, 47);
  approx(mal.expected, 47, 1e-12, "met alk 0.7 rule: 40+7=47");
  const ara = F.expectedCompensation("acute_respiratory_acidosis", null, 70);
  approx(ara.expected, 27, 1e-12, "acute resp acid +0.1×30=27");
  const cra = F.expectedCompensation("chronic_respiratory_acidosis", null, 70);
  approx(cra.expected, 34.5, 1e-12, "chronic resp acid +0.35×30=34.5");
  const aralk = F.expectedCompensation("acute_respiratory_alkalosis", null, 20);
  approx(aralk.expected, 20, 1e-12, "acute resp alk −0.2×20=−4 → 20");
  const cralk = F.expectedCompensation("chronic_respiratory_alkalosis", null, 20);
  approx(cralk.expected, 14, 1e-12, "chronic resp alk −0.5×20=−10 → 14");
}

/* ── Proteinuria ────────────────────────────────────────────────────────── */
section("UPCR / UACR and KDIGO A1–A3");
{
  const p = F.urineRatio(150, 100, { kind: "protein" });
  approx(p.gPerG, 1.5, 1e-12, "UPCR 1.5 g/g");
  approx(p.mgPerG, 1500, 1e-12, "1500 mg/g");
  approx(p.mgPerMmol, 1500 / 8.84, 1e-12, "mg/mmol via 8.84");
  eq(p.category, "A3", "PCR 1500 = A3");
  approx(p.ginsberg24hG, 1.5, 1e-12, "Ginsberg ≈ 1.5 g/day");
  const a = F.urineRatio(3, 100, { kind: "albumin" }); // 30 mg/g exactly → A2
  approx(a.mgPerG, 30, 1e-12, "ACR 30 mg/g");
  eq(a.category, "A2", "ACR 30 = A2 lower bound inclusive");
  eq(F.kdigoACategoryFromAcr(29.9), "A1", "A1");
  eq(F.kdigoACategoryFromAcr(30), "A2", "A2");
  eq(F.kdigoACategoryFromAcr(300), "A2", "A2 upper inclusive");
  eq(F.kdigoACategoryFromAcr(301), "A3", "A3");
  // Walser CER: 50 yo 70 kg man: (28.2 − 0.172×50)×70 = 19.6×70 = 1372 mg
  const w = F.urineRatio(150, 100, { kind: "protein", age: 50, weightKg: 70, female: false });
  approx(w.walserCerMg, (28.2 - 0.172 * 50) * 70, 1e-9, "Walser CER");
  approx(w.estimated24hG, (1500 / 1000) * (w.walserCerMg / 1000), 1e-12, "24h from CER");
}

/* ── Hemodialysis ───────────────────────────────────────────────────────── */
section("URR");
approx(F.urr(80, 24), 70, 1e-12, "URR 70% (80→24)");

section("Daugirdas 2nd-generation spKt/V (JASN 1993)");
// Worked: R=0.3, t=4 h, UF/W=0.04 (e.g. 2.8 L / 70 kg)
// −ln(0.3−0.032) + (4−3.5×0.3)×0.04 = −ln(0.268)+2.95×0.04
approx(F.daugirdasSpKtv(100, 30, 4, 2.8, 70), 1.4347682984712804, 1e-12, "spKt/V worked example");
// No UF term
{
  const R = 0.3;
  const expected = -Math.log(R - 0.008 * 3);
  approx(F.daugirdasSpKtv(100, 30, 3), expected, 1e-12, "spKt/V without UF");
}
throws(() => F.daugirdasSpKtv(100, 10, 15), "R−0.008t ≤ 0 rejected");

section("eKt/V Tattersall (KI 1996) and Daugirdas–Schneditz rate (ASAIO 1995)");
approx(F.tattersallEKtv(1.4, 240), 1.221818181818182, 1e-12, "Tattersall fistula +35");
approx(F.tattersallEKtv(1.4, 240, "catheter"), 1.282442748091603, 1e-12, "Tattersall catheter +22");
approx(F.daugirdasRateEKtv(1.4, 4, "arterial"), 1.22, 1e-12, "rate arterial 1.22");
approx(F.daugirdasRateEKtv(1.4, 4, "catheter"), 1.2555, 1e-12, "rate venous 1.2555");

section("stdKt/V Leypoldt 2004 and FHN / Daugirdas 2010");
// Sophie Well / Leypoldt worked: spKt/V 1.4, 240 min, 3×/week → eKt/V 1.22, stdKt/V 2.18
{
  const e = F.tattersallEKtv(1.4, 240);
  const std = F.leypoldtStdKtv(e, 240, 3);
  approx(std, 2.1817994566894483, 1e-12, "Leypoldt stdKt/V 2.18");
  const fhn = F.fhnStdKtv(std, 3, 35);
  approx(fhn, 2.329560127642791, 1e-12, "FHN UF adjustment");
  // Residual 2 mL/min, V 35 L: 2×10.08/35
  approx(F.residualStdKtv(2, 35), 20.16 / 35, 1e-12, "simple Kru add-on");
}

section("nPCR / nPNA (interdialytic rise; Depner & Daugirdas midweek)");
// Post 24, next pre 70, 44 h → 0.22 + 0.864×46/44 = 1.123...
approx(F.nPcrInterdialytic(24, 70, 44), 1.1232727272727272, 1e-12, "interdialytic nPCR 1.12");
approx(F.nPcrDepnerDaugirdasMidweek(70, 1.4), 1.2020388714204318, 1e-12, "1996 midweek formula");

section("Ultrafiltration rate and 13 mL/kg/h threshold inputs");
approx(F.ultrafiltrationRate(3000, 70, 4), 10.714285714285714, 1e-12, "UFR 10.71");
approx(F.ultrafiltrationRate(3640, 70, 4), 13, 1e-12, "exactly 13 mL/kg/h");

section("Watson TBW (Am J Clin Nutr 1980)");
approx(F.watsonTbw(50, 178, 80, false), 43.7022, 1e-9, "male Watson");
approx(F.watsonTbw(50, 165, 70, true), 32.8035, 1e-9, "female Watson (no age term)");
// Female ignores age — same at two ages
approx(F.watsonTbw(20, 165, 70, true), F.watsonTbw(80, 165, 70, true), 1e-12, "female age-independent");

/* ── CRRT ───────────────────────────────────────────────────────────────── */
section("CRRT dose, predilution factor, filtration fraction (KDIGO AKI 2012)");
approx(F.plasmaFlowMlH(150, 0.3), 6300, 1e-12, "Qp 150 mL/min Hct 30% = 6300 mL/h");
approx(F.plasmaFlowMlH(150, 30), 6300, 1e-12, "Hct as percent 30");
approx(F.predilutionFactor(6300, 1000), 6300 / 7300, 1e-12, "DF = 0.863");
{
  const d = F.crrtEffluentDose({
    weightKg: 80, qdMlH: 1000, qpreMlH: 1000, qpostMlH: 500, qnetMlH: 100,
    qbMlMin: 150, hct: 0.3,
  });
  approx(d.qeffMlH, 2600, 1e-12, "Qeff 2600");
  approx(d.prescribedMlKgH, 32.5, 1e-12, "prescribed 32.5 mL/kg/h");
  approx(d.correctedMlKgH, 28.047945205479454, 1e-12, "predilution-corrected dose");
  // Post-dilution only: DF = 1
  const post = F.crrtEffluentDose({ weightKg: 80, qpostMlH: 2000, qnetMlH: 100 });
  approx(post.df, 1, 0, "post-dilution DF=1");
  approx(post.correctedMlKgH, 2100 / 80, 1e-12, "post-dilution dose 26.25");
}
{
  const ff = F.filtrationFraction({
    qbMlMin: 150, hct: 0.3, qpreMlH: 1000, qpostMlH: 500, qnetMlH: 100, modality: "cvvhdf",
  });
  approx(ff.qufMlH, 1600, 1e-12, "Quf 1600");
  approx(ff.ffPostPct, 25.396825396825395, 1e-12, "post-style FF ~25.4%");
  approx(ff.ffPrePct, 21.91780821917808, 1e-12, "pre-dilution FF ~21.9%");
  const hd = F.filtrationFraction({ qbMlMin: 150, hct: 0.3, qnetMlH: 100, modality: "cvvhd" });
  approx(hd.qufMlH, 100, 1e-12, "CVVHD Quf is net UF only");
}

section("Citrate / calcium ratio (Meier-Kriesche CCM 2001)");
{
  const r = F.citrateCalciumRatio(10, "mg/dL", 1.0, "mmol/L");
  approx(r.ratio, 2.5, 1e-12, "total 10 mg/dL / iCa 1.0 mmol = 2.5 (cutoff)");
  const same = F.citrateCalciumRatio(2.5, "mmol/L", 1.15, "mmol/L");
  approx(same.ratio, 2.5 / 1.15, 1e-12, "both mmol/L");
}

/* ── PD ─────────────────────────────────────────────────────────────────── */
section("PD weekly Kt/V (ISPD; Watson V)");
{
  // D/P urea 0.9, drain 10 L, V 35 L → weekly peritoneal Kt/V = 63/35 = 1.8
  // Urine 1 L, U/P urea 4 → renal 28/35 = 0.8; total 2.6
  const r = F.pdWeeklyKtv(0.9, 10, 35, 4, 1);
  approx(r.weeklyKtvPeritoneal, 1.8, 1e-12, "peritoneal Kt/V 1.8");
  approx(r.weeklyKtvRenal, 0.8, 1e-12, "renal Kt/V 0.8");
  approx(r.weeklyKtvTotal, 2.6, 1e-12, "total 2.6");
}

section("BSA Mosteller (default) and DuBois");
approx(F.bsaMosteller(170, 70), 1.818118685772619, 1e-12, "Mosteller 170 cm 70 kg");
approx(F.bsaDuBois(170, 70), 1.809707801753247, 1e-12, "DuBois 170 cm 70 kg");

section("PD weekly CrCl and residual kidney function");
{
  const r = F.pdWeeklyCrCl({
    dOverPCr: 0.7, drainVolumeL: 10,
    uOverPCr: 8, uOverPUrea: 4, urineVolumeL: 1,
    heightCm: 170, weightKg: 70, bsaMethod: "mosteller",
  });
  approx(r.peritonealLWeek, 49, 1e-12, "peritoneal CrCl 49 L/week");
  approx(r.renalCrLWeek, 56, 1e-12, "renal Ccr 56 L/week");
  approx(r.renalUreaLWeek, 28, 1e-12, "renal Curea 28 L/week");
  approx(r.rkfMeanLWeek, 42, 1e-12, "RKF mean 42 L/week");
  approx(r.totalLWeek, 91, 1e-12, "total 91 L/week");
  const expectedNorm = (91 * 1.73) / F.bsaMosteller(170, 70);
  approx(r.totalLWeek173, expectedNorm, 1e-12, "normalized to 1.73 with Mosteller");
  eq(r.bsaMethod, "Mosteller", "Mosteller is default and stated");
}
{
  // 24-h urine 1000 mL, U/P urea 4, U/P Cr 8
  // Curea = 4×1000/1440, Ccr = 8×1000/1440, mean = 6×1000/1440
  const r = F.residualKidneyFunction({ urineMl: 1000, uOverPUrea: 4, uOverPCr: 8, heightCm: 170, weightKg: 70 });
  approx(r.cUreaMlMin, 4000 / 1440, 1e-12, "Curea mL/min");
  approx(r.cCrMlMin, 8000 / 1440, 1e-12, "Ccr mL/min");
  approx(r.meanMlMin, 6000 / 1440, 1e-12, "mean RKF mL/min");
  approx(r.lWeek, (6000 / 1440) * 10.08, 1e-12, "L/week");
}

section("PET Twardowski 1987 categories");
{
  const ratios = F.petRatios(7, 10, 400, 1000);
  approx(ratios.dpCr, 0.7, 1e-12, "D/P Cr 0.70");
  approx(ratios.dd0, 0.4, 1e-12, "D/D0 0.40");
  const cat = F.petCategory(0.7, 0.4);
  eq(cat.crCategory, "High-average", "0.70 = high-average D/P Cr");
  eq(cat.glucoseCategory, "Low-average", "0.40 = low-average D/D0");
  eq(F.petCategory(0.49).crCategory, "Low", "0.49 low");
  eq(F.petCategory(0.5).crCategory, "Low-average", "0.50 LA lower bound");
  eq(F.petCategory(0.64).crCategory, "Low-average", "0.64 LA");
  eq(F.petCategory(0.65).crCategory, "High-average", "0.65 HA");
  eq(F.petCategory(0.81).crCategory, "High-average", "0.81 HA");
  eq(F.petCategory(0.82).crCategory, "High", "0.82 high");
  eq(F.petCategory(null, 0.26).glucoseCategory, "High", "D/D0 0.26 high");
  eq(F.petCategory(null, 0.27).glucoseCategory, "High-average", "D/D0 0.27 HA");
  eq(F.petCategory(null, 0.38).glucoseCategory, "High-average", "D/D0 0.38 HA");
  eq(F.petCategory(null, 0.39).glucoseCategory, "Low-average", "D/D0 0.39 LA");
  eq(F.petCategory(null, 0.5).glucoseCategory, "Low", "D/D0 0.50 low");
}

/* ── summary ────────────────────────────────────────────────────────────── */
console.log("\n────────────────────────────────────────");
console.log(`Passed: ${passed}   Failed: ${failed}`);
if (failed) {
  console.error("\nFailures:");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("All tests passed.");
