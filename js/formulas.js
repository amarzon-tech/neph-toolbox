/**
 * Nephrology Toolbox — pure formula implementations.
 * Every coefficient is taken from the cited primary source (see CONTENT_REVIEW.md).
 * No network, no storage. Inputs are not persisted.
 *
 * Works in the browser (global NephFormulas) and in Node (module.exports).
 */
(function (global) {
  "use strict";

  const CONV = {
    CR_UMOL_PER_MGDL: 88.4,
    BUN_MGDL_PER_UREA_MMOL: 2.8,
    UREA_MGDL_PER_BUN_MGDL: 60 / 28,
    GLU_MGDL_PER_MMOL: 18,
    CA_MGDL_PER_MMOL: 4,
    PO4_MGDL_PER_MMOL: 3.097,
    ALB_GL_PER_GDL: 10,
    ACR_MGG_PER_MGMMOL: 8.84,
  };

  function isNum(x) {
    return typeof x === "number" && Number.isFinite(x);
  }

  function req(name, x) {
    if (!isNum(x)) throw new Error(`Missing or invalid number: ${name}`);
    return x;
  }

  function convertCrToMgDl(value, unit) {
    req("creatinine", value);
    if (unit === "umol/L" || unit === "µmol/L" || unit === "umol") return value / CONV.CR_UMOL_PER_MGDL;
    return value;
  }

  function convertBunToMgDl(value, unit) {
    req("BUN/urea", value);
    if (unit === "mmol/L" || unit === "urea_mmol") return value * CONV.BUN_MGDL_PER_UREA_MMOL;
    return value;
  }

  function convertGluToMgDl(value, unit) {
    req("glucose", value);
    if (unit === "mmol/L" || unit === "mmol") return value * CONV.GLU_MGDL_PER_MMOL;
    return value;
  }

  function convertCaToMmol(value, unit) {
    req("calcium", value);
    if (unit === "mg/dL" || unit === "mgdl") return value / CONV.CA_MGDL_PER_MMOL;
    return value;
  }

  function convertPo4ToMgDl(value, unit) {
    req("phosphate", value);
    if (unit === "mmol/L" || unit === "mmol") return value * CONV.PO4_MGDL_PER_MMOL;
    return value;
  }

  function convertAlbToGdl(value, unit) {
    req("albumin", value);
    if (unit === "g/L" || unit === "gL") return value / CONV.ALB_GL_PER_GDL;
    return value;
  }

  function convertAcrToMgg(value, unit) {
    req("ACR", value);
    if (unit === "mg/mmol" || unit === "mgmmol") return value * CONV.ACR_MGG_PER_MGMMOL;
    return value;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 1. Kidney function
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * CKD-EPI 2021 race-free creatinine eGFR (mL/min/1.73 m²).
   * Inker et al., N Engl J Med. 2021;385:1737-1749. doi:10.1056/NEJMoa2102953
   * NIDDK / NKF published form:
   *   eGFR = 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^−1.200 × 0.9938^age × 1.012 [if female]
   *   κ = 0.7 (F) or 0.9 (M);  α = −0.241 (F) or −0.302 (M)
   *   Scr in mg/dL; age in years; adults ≥18.
   */
  function egfrCkdEpi2021Cr(scrMgDl, age, female) {
    req("Scr", scrMgDl);
    req("age", age);
    if (scrMgDl <= 0) throw new Error("Creatinine must be positive");
    const kappa = female ? 0.7 : 0.9;
    const alpha = female ? -0.241 : -0.302;
    const scrK = scrMgDl / kappa;
    const minTerm = Math.pow(Math.min(scrK, 1), alpha);
    const maxTerm = Math.pow(Math.max(scrK, 1), -1.2);
    const ageTerm = Math.pow(0.9938, age);
    const sexTerm = female ? 1.012 : 1;
    return 142 * minTerm * maxTerm * ageTerm * sexTerm;
  }

  /**
   * CKD-EPI 2021 race-free creatinine–cystatin C eGFR (mL/min/1.73 m²).
   * Inker et al., N Engl J Med. 2021;385:1737-1749. doi:10.1056/NEJMoa2102953
   * NKF / NIDDK:
   *   eGFR = 135 × min(Scr/κ,1)^α × max(Scr/κ,1)^−0.544
   *         × min(Scys/0.8,1)^−0.323 × max(Scys/0.8,1)^−0.778
   *         × 0.9961^age × 0.963 [if female]
   *   κ = 0.7 (F) or 0.9 (M);  α = −0.219 (F) or −0.144 (M)
   *   Scr mg/dL; Scys mg/L.
   */
  function egfrCkdEpi2021CrCys(scrMgDl, cysMgL, age, female) {
    req("Scr", scrMgDl);
    req("Scys", cysMgL);
    req("age", age);
    if (scrMgDl <= 0 || cysMgL <= 0) throw new Error("Creatinine and cystatin C must be positive");
    const kappa = female ? 0.7 : 0.9;
    const alpha = female ? -0.219 : -0.144;
    const scrK = scrMgDl / kappa;
    const cysK = cysMgL / 0.8;
    return (
      135 *
      Math.pow(Math.min(scrK, 1), alpha) *
      Math.pow(Math.max(scrK, 1), -0.544) *
      Math.pow(Math.min(cysK, 1), -0.323) *
      Math.pow(Math.max(cysK, 1), -0.778) *
      Math.pow(0.9961, age) *
      (female ? 0.963 : 1)
    );
  }

  /**
   * CKD-EPI 2012 cystatin C eGFR (mL/min/1.73 m²). Already race-free.
   * Inker et al., N Engl J Med. 2012;367:20-29. doi:10.1056/NEJMoa1114248
   * NKF published form (age base 0.996, as in the 2012 paper and NKF):
   *   eGFR = 133 × min(Scys/0.8,1)^−0.499 × max(Scys/0.8,1)^−1.328
   *         × 0.996^age × 0.932 [if female]
   * Note: Inker 2021 Table 2 lists the age coefficient as 0.9962 (95% CI 0.9957–0.9966).
   * We use the published 2012 / NKF equation (0.996). See CONTENT_REVIEW.md.
   */
  function egfrCkdEpi2012Cys(cysMgL, age, female) {
    req("Scys", cysMgL);
    req("age", age);
    if (cysMgL <= 0) throw new Error("Cystatin C must be positive");
    const cysK = cysMgL / 0.8;
    return (
      133 *
      Math.pow(Math.min(cysK, 1), -0.499) *
      Math.pow(Math.max(cysK, 1), -1.328) *
      Math.pow(0.996, age) *
      (female ? 0.932 : 1)
    );
  }

  /**
   * Cockcroft–Gault creatinine clearance (mL/min), not indexed to BSA.
   * Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41. doi:10.1159/000180580
   *   CrCl = [(140 − age) × weight_kg × (0.85 if female)] / (72 × Scr_mg/dL)
   * Weight choice (actual / ideal / adjusted) is the caller's responsibility.
   */
  function cockcroftGault(scrMgDl, age, weightKg, female) {
    req("Scr", scrMgDl);
    req("age", age);
    req("weight", weightKg);
    if (scrMgDl <= 0 || weightKg <= 0) throw new Error("Creatinine and weight must be positive");
    return ((140 - age) * weightKg * (female ? 0.85 : 1)) / (72 * scrMgDl);
  }

  /**
   * Devine ideal body weight (kg).
   * Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655.
   *   Male   50 + 2.3 × inches over 5 ft
   *   Female 45.5 + 2.3 × inches over 5 ft
   * Validated / intended for height ≥ 60 in; shorter heights are computed
   * with a negative increment and flagged by the caller.
   */
  function devineIbw(heightCm, female) {
    req("height", heightCm);
    const inches = heightCm / 2.54;
    const over = inches - 60;
    return (female ? 45.5 : 50) + 2.3 * over;
  }

  /**
   * Adjusted body weight = IBW + 0.4 × (actual − IBW).
   * Conventional 0.4 (40%) factor used in drug-dosing practice;
   * Winter et al., Pharmacotherapy. 2012;32:604-612 discusses weight selection.
   */
  function adjustedBodyWeight(actualKg, ibwKg, factor) {
    req("actual weight", actualKg);
    req("IBW", ibwKg);
    const f = isNum(factor) ? factor : 0.4;
    return ibwKg + f * (actualKg - ibwKg);
  }

  /**
   * KFRE — Kidney Failure Risk Equation, North American coefficients.
   *
   * Tangri N et al. JAMA. 2011;305(15):1553-1559. doi:10.1001/jama.2011.451
   *   (derivation, Canadian / North American cohorts — original coefficients)
   * Tangri N et al. JAMA. 2016;315(2):164-174. doi:10.1001/jama.2015.18202
   *   (multinational validation: North American calibration was adequate;
   *    a separate non-North-American recalibration was proposed for other regions.
   *    We use the original North American coefficients, as requested.)
   *
   * 4-variable linear predictor (ACR in mg/g; male=1, female=0):
   *   LP = −0.2201(age/10 − 7.036) + 0.2467(male − 0.5642)
   *        −0.5567(eGFR/5 − 7.222) + 0.4510(ln(ACR) − 5.137)
   *   Risk = 1 − S0^exp(LP)
   *   S0 NA 4-var: 2-year 0.9750, 5-year 0.9240
   *
   * 8-variable adds albumin (g/dL), phosphate (mg/dL), bicarbonate (mEq/L), calcium (mg/dL):
   *   LP = −0.1992(age/10 − 7.036) + 0.1602(male − 0.5642)
   *        −0.4919(eGFR/5 − 7.222) + 0.3364(ln(ACR) − 5.137)
   *        −0.3441(albumin − 3.997) + 0.2604(phosphate − 3.916)
   *        −0.07354(bicarbonate − 25.57) − 0.2228(calcium − 9.355)
   *   S0 NA 8-var: 2-year 0.9780, 5-year 0.9301
   *
   * Judgment: some online calculators list S0 = 0.9240 (2y) / 0.7762 (5y); those
   * do not match the official North American constants used by kidneyfailurerisk.com
   * and the kfre reference implementation of Tangri 2011/2016.
   */
  const KFRE_NA = {
    4: {
      2: 0.975,
      5: 0.924,
      age: -0.2201,
      sex: 0.2467,
      egfr: -0.5567,
      acr: 0.451,
    },
    8: {
      2: 0.978,
      5: 0.9301,
      age: -0.1992,
      sex: 0.1602,
      egfr: -0.4919,
      acr: 0.3364,
      albumin: -0.3441,
      phosphate: 0.2604,
      bicarbonate: -0.07354,
      calcium: -0.2228,
    },
  };

  function kfreNorthAmerican(opts) {
    const age = req("age", opts.age);
    const male = opts.female ? 0 : 1;
    const egfr = req("eGFR", opts.egfr);
    const acrMgg = req("UACR", opts.acrMgg);
    if (acrMgg <= 0) throw new Error("UACR must be positive");
    const years = opts.years === 5 ? 5 : 2;
    const vars = opts.variables === 8 ? 8 : 4;
    const c = KFRE_NA[vars];
    let lp =
      c.age * (age / 10 - 7.036) +
      c.sex * (male - 0.5642) +
      c.egfr * (egfr / 5 - 7.222) +
      c.acr * (Math.log(acrMgg) - 5.137);
    if (vars === 8) {
      lp +=
        c.albumin * (req("albumin", opts.albuminGdl) - 3.997) +
        c.phosphate * (req("phosphate", opts.phosphateMgDl) - 3.916) +
        c.bicarbonate * (req("bicarbonate", opts.bicarbonate) - 25.57) +
        c.calcium * (req("calcium", opts.calciumMgDl) - 9.355);
    }
    const s0 = c[years];
    const risk = 1 - Math.pow(s0, Math.exp(lp));
    return { risk, riskPct: risk * 100, lp, s0, years, variables: vars };
  }

  function kdigoGCategory(egfr) {
    if (!isNum(egfr)) return null;
    if (egfr >= 90) return "G1";
    if (egfr >= 60) return "G2";
    if (egfr >= 45) return "G3a";
    if (egfr >= 30) return "G3b";
    if (egfr >= 15) return "G4";
    return "G5";
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 2. Electrolytes
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Fractional excretion of sodium (%).
   * FENa = (UNa × PCr) / (PNa × UCr) × 100
   * Units cancel if UNa & PNa share units and UCr & PCr share units.
   * Espinel CH. JAMA. 1976;236(6):579-581. doi:10.1001/jama.1976.03270060029022
   */
  function fena(uNa, pNa, uCr, pCr) {
    req("UNa", uNa);
    req("PNa", pNa);
    req("UCr", uCr);
    req("PCr", pCr);
    if (pNa === 0 || uCr === 0) throw new Error("PNa and UCr must be nonzero");
    return ((uNa * pCr) / (pNa * uCr)) * 100;
  }

  /**
   * Fractional excretion of urea (%).
   * FEUrea = (UUrea × PCr) / (PUrea × UCr) × 100
   * BUN may be used for both urine and plasma (conversion cancels).
   * Carvounis CP, Nisar S, Guro-Razuman S. Kidney Int. 2002;62:2223-2229.
   *   doi:10.1046/j.1523-1755.2002.00630.x
   */
  function feUrea(uUrea, pUrea, uCr, pCr) {
    req("UUrea", uUrea);
    req("PUrea", pUrea);
    req("UCr", uCr);
    req("PCr", pCr);
    if (pUrea === 0 || uCr === 0) throw new Error("PUrea and UCr must be nonzero");
    return ((uUrea * pCr) / (pUrea * uCr)) * 100;
  }

  /**
   * Anion gap = Na − (Cl + HCO3), mEq/L.
   * Albumin-corrected AG (Figge et al., Crit Care Med. 1998;26:1807-1810):
   *   AGc = AG + 2.5 × (4.4 − albumin_g/dL)
   * Judgment: some use normal albumin 4.0 g/dL or a factor of 3.0; we use
   * Figge's 2.5 mEq/L per 1 g/dL and 4.4 g/dL as published.
   */
  function anionGap(na, cl, hco3, albuminGdl, normalAlbumin) {
    req("Na", na);
    req("Cl", cl);
    req("HCO3", hco3);
    const ag = na - (cl + hco3);
    let agCorrected = null;
    if (isNum(albuminGdl)) {
      const normal = isNum(normalAlbumin) ? normalAlbumin : 4.4;
      agCorrected = ag + 2.5 * (normal - albuminGdl);
    }
    return { ag, agCorrected };
  }

  /**
   * Calculated osmolarity and osmolal gap.
   * Conventional US formula (Worthley LI, Guerin M, Pain RW. Anaesth Intensive Care. 1987;15:199-202):
   *   CalcOsm = 2×Na + glucose/18 + BUN/2.8   (Na mEq/L, glu mg/dL, BUN mg/dL)
   *   equivalent SI: 2×Na + glucose_mmol + urea_mmol
   * Optional ethanol: + ethanol_mg/dL / 4.6
   * Gap = measured osmolality − calculated.
   * Judgment: Dorwart–Chalmers (1.86×Na + glu/18 + BUN/2.8 + 9) is an alternative;
   * we use the conventional 2×Na formula and state that.
   */
  function osmolalGap(na, glucoseMgDl, bunMgDl, measuredOsm, ethanolMgDl) {
    req("Na", na);
    req("glucose", glucoseMgDl);
    req("BUN", bunMgDl);
    const calculated = 2 * na + glucoseMgDl / 18 + bunMgDl / 2.8 + (isNum(ethanolMgDl) ? ethanolMgDl / 4.6 : 0);
    const gap = isNum(measuredOsm) ? measuredOsm - calculated : null;
    return { calculated, gap };
  }

  /**
   * Sodium correction for hyperglycemia.
   * Katz MA. N Engl J Med. 1973;289:843-844. doi:10.1056/NEJM197310182891607
   *   Corrected Na = measured Na + 1.6 × (glucose_mg/dL − 100) / 100
   * Hillier TA et al. Am J Med. 1999;106:399-403. doi:10.1016/S0002-9343(99)00055-8
   *   Same form with 2.4 instead of 1.6.
   * Reference glucose 100 mg/dL (5.6 mmol/L), as in the classic statements.
   */
  function sodiumCorrectionHyperglycemia(measuredNa, glucoseMgDl) {
    req("Na", measuredNa);
    req("glucose", glucoseMgDl);
    const delta = (glucoseMgDl - 100) / 100;
    return {
      katz: measuredNa + 1.6 * delta,
      hillier: measuredNa + 2.4 * delta,
    };
  }

  /**
   * Free-water deficit (L).
   * FWD = TBW × (Na / targetNa − 1)
   * TBW = fraction × weight_kg
   * Fractions (Adrogué HJ, Madias NE. N Engl J Med. 2000;342:1493-1499.
   *   doi:10.1056/NEJM200005183422006; standard teaching):
   *   adult men 0.60, adult women 0.50, elderly men 0.50, elderly women 0.45
   * Judgment: "elderly" cutoff is taken as age ≥ 65 years (not specified as a
   * hard cut in the NEJM review; commonly used). Target Na defaults to 140.
   */
  function freeWaterDeficit(na, weightKg, female, age, targetNa) {
    req("Na", na);
    req("weight", weightKg);
    const target = isNum(targetNa) ? targetNa : 140;
    if (target <= 0 || weightKg <= 0) throw new Error("Target Na and weight must be positive");
    const elderly = isNum(age) && age >= 65;
    let fraction;
    if (female) fraction = elderly ? 0.45 : 0.5;
    else fraction = elderly ? 0.5 : 0.6;
    const tbw = fraction * weightKg;
    const deficit = tbw * (na / target - 1);
    return { deficitL: deficit, tbw, fraction, target };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 3. Acid–base
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Winter's formula — expected PCO2 in metabolic acidosis.
   * Albert MS, Dell RB, Winters RW. Ann Intern Med. 1967;66:312-322.
   *   doi:10.7326/0003-4819-66-2-312
   *   expected PCO2 = 1.5 × HCO3 + 8   (±2 mmHg)
   */
  function wintersFormula(hco3) {
    req("HCO3", hco3);
    const expected = 1.5 * hco3 + 8;
    return { expected, low: expected - 2, high: expected + 2 };
  }

  /**
   * Delta gap and delta–delta ratio.
   * ΔAG = AG − normalAG (default 12)
   * ΔHCO3 = normalHCO3 − HCO3 (default 24)
   * Ratio = ΔAG / ΔHCO3
   * Interpretation cutoffs after Rastegar A. J Am Soc Nephrol. 2007;18:2429-2431.
   *   doi:10.1681/ASN.2006121247  (and common teaching; cutoffs vary — see notes)
   *   < 0.4  : hyperchloremic (NAGMA) predominates
   *   0.4–0.8: mixed HAGMA + NAGMA
   *   0.8–2.0: pure HAGMA (some authors use 1–2)
   *   > 2    : mixed HAGMA + metabolic alkalosis (or pre-existing low AG / chronic respiratory acidosis)
   */
  function deltaDelta(ag, hco3, normalAg, normalHco3) {
    req("AG", ag);
    req("HCO3", hco3);
    const nAg = isNum(normalAg) ? normalAg : 12;
    const nHco3 = isNum(normalHco3) ? normalHco3 : 24;
    const deltaAg = ag - nAg;
    const deltaHco3 = nHco3 - hco3;
    const ratio = deltaHco3 === 0 ? (deltaAg === 0 ? 0 : Infinity) : deltaAg / deltaHco3;
    const addedHco3 = hco3 + deltaAg; // "bicarbonate before the gap acidosis"
    let interpretation;
    if (ratio < 0.4) interpretation = "Ratio < 0.4: consistent with a predominant normal-anion-gap (hyperchloremic) metabolic acidosis.";
    else if (ratio < 0.8) interpretation = "Ratio 0.4–0.8: consistent with a mixed high-anion-gap and normal-anion-gap metabolic acidosis.";
    else if (ratio <= 2) interpretation = "Ratio 0.8–2.0: consistent with a pure high-anion-gap metabolic acidosis.";
    else interpretation = "Ratio > 2: consistent with a mixed high-anion-gap metabolic acidosis and metabolic alkalosis (or a pre-existing high HCO3, e.g. chronic respiratory acidosis).";
    return { deltaAg, deltaHco3, ratio, addedHco3, interpretation };
  }

  /**
   * Expected compensation for simple acid–base disorders.
   *
   * Metabolic acidosis: Winter's (Albert, Dell, Winters 1967) — PCO2 = 1.5×HCO3+8 ±2
   * Metabolic alkalosis: ΔPCO2 ≈ 0.7 × ΔHCO3  (±5)
   *   Javaheri S, et al. / commonly cited rule; Galla JH. JASN. 2000;11:369-375 reviews.
   *   expected PCO2 = 40 + 0.7×(HCO3−24). Judgment: 0.6 and 0.9×HCO3+9 are alternatives.
   *
   * Acute respiratory acidosis:  ΔHCO3 = +0.1 × ΔPCO2    (Brackett NC, Cohen JJ, Schwartz WB. N Engl J Med. 1965;272:6-12)
   * Chronic respiratory acidosis: ΔHCO3 = +0.35 × ΔPCO2  (Schwartz WB, Brackett NC, Cohen JJ. J Clin Invest. 1965;44:291-301)
   *   Judgment: some use 0.4 (4 per 10 mmHg).
   * Acute respiratory alkalosis:  ΔHCO3 = −0.2 × |ΔPCO2|
   * Chronic respiratory alkalosis: ΔHCO3 = −0.5 × |ΔPCO2|
   *   Judgment: some use 0.4 for chronic respiratory alkalosis.
   * Respiratory rules as commonly taught from the Boston group papers and
   * Adrogué HJ, Madias NE. N Engl J Med. 1998;338:26-34 and 338:107-111.
   */
  function expectedCompensation(disorder, hco3, pco2) {
    const d = disorder;
    if (d === "metabolic_acidosis") {
      const w = wintersFormula(hco3);
      return {
        expected: w.expected,
        low: w.low,
        high: w.high,
        unit: "PCO2 mmHg",
        measured: isNum(pco2) ? pco2 : null,
        rule: "Winter's: expected PCO₂ = 1.5 × HCO₃ + 8 (±2 mmHg)",
      };
    }
    if (d === "metabolic_alkalosis") {
      req("HCO3", hco3);
      const expected = 40 + 0.7 * (hco3 - 24);
      return {
        expected,
        low: expected - 5,
        high: expected + 5,
        unit: "PCO2 mmHg",
        measured: isNum(pco2) ? pco2 : null,
        rule: "Expected PCO₂ = 40 + 0.7 × (HCO₃ − 24) (±5 mmHg)",
      };
    }
    req("PCO2", pco2);
    const dPco2 = pco2 - 40;
    let factor, label, pm;
    if (d === "acute_respiratory_acidosis") {
      factor = 0.1;
      label = "Expected HCO₃ = 24 + 0.1 × (PCO₂ − 40)  (+1 mEq/L per +10 mmHg)";
      pm = 2;
    } else if (d === "chronic_respiratory_acidosis") {
      factor = 0.35;
      label = "Expected HCO₃ = 24 + 0.35 × (PCO₂ − 40)  (+3.5 mEq/L per +10 mmHg)";
      pm = 2;
    } else if (d === "acute_respiratory_alkalosis") {
      factor = 0.2;
      label = "Expected HCO₃ = 24 + 0.2 × (PCO₂ − 40)  (−2 mEq/L per −10 mmHg)";
      pm = 2;
    } else if (d === "chronic_respiratory_alkalosis") {
      factor = 0.5;
      label = "Expected HCO₃ = 24 + 0.5 × (PCO₂ − 40)  (−5 mEq/L per −10 mmHg)";
      pm = 2;
    } else {
      throw new Error("Unknown acid-base disorder");
    }
    const expected = 24 + factor * dPco2;
    return {
      expected,
      low: expected - pm,
      high: expected + pm,
      unit: "HCO3 mEq/L",
      measured: isNum(hco3) ? hco3 : null,
      rule: label,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 4. Proteinuria
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Spot urine protein- or albumin-to-creatinine ratio.
   * If both are in mg/dL (or both g/L, etc.), ratio is mg/mg = g/g.
   * mg/g = ratio × 1000 (when inputs are mg/dL / mg/dL, the ratio is already g/g = mg/mg;
   *   UPCR in mg/g = (Uprot_mg/dL / UCr_mg/dL) × 1000).
   * mg/mmol = mg/g ÷ 8.84  (creatinine MW 113.12; 1 mmol = 113.12 mg; 1000/113.12 ≈ 8.84)
   *
   * Ginsberg JM et al. N Engl J Med. 1983;309:1543-1546. doi:10.1056/NEJM198312223092503
   *   UPCR (g/g) approximates 24-h protein (g/day), assuming ~1 g/day creatinine excretion.
   *
   * Optional estimated creatinine excretion (Walser M. JPEN. 1987 — widely used, race-free):
   *   Male   (28.2 − 0.172 × age) × weight_kg   mg/day
   *   Female (21.9 − 0.115 × age) × weight_kg   mg/day
   * We do not use race-adjusted CER equations (Ix 2011 CKD-EPI CER includes a Black race term).
   *
   * KDIGO albuminuria categories (KDIGO 2012 CKD guideline, Kidney Int Suppl 2013;
   * retained in KDIGO 2024):
   *   A1 ACR <30 mg/g  (<3 mg/mmol)
   *   A2 ACR 30–300 mg/g (3–30 mg/mmol)
   *   A3 ACR >300 mg/g (>30 mg/mmol)
   * Proteinuria (PCR) approximate equivalents (KDIGO 2012):
   *   A1 PCR <150 mg/g, A2 150–500, A3 >500 mg/g
   *   (or <15, 15–50, >50 mg/mmol).
   */
  function urineRatio(urineConc, urineCr, opts) {
    req("urine analyte", urineConc);
    req("urine creatinine", urineCr);
    if (urineCr <= 0) throw new Error("Urine creatinine must be positive");
    const optsSafe = opts || {};
    // Assume both in mg/dL (or equivalent same units) → g/g
    const gPerG = urineConc / urineCr;
    const mgPerG = gPerG * 1000;
    const mgPerMmol = mgPerG / CONV.ACR_MGG_PER_MGMMOL;
    const kind = optsSafe.kind === "albumin" ? "albumin" : "protein";
    let category, categoryRule;
    if (kind === "albumin") {
      if (mgPerG < 30) category = "A1";
      else if (mgPerG <= 300) category = "A2";
      else category = "A3";
      categoryRule = "KDIGO ACR: A1 <30, A2 30–300, A3 >300 mg/g";
    } else {
      if (mgPerG < 150) category = "A1";
      else if (mgPerG <= 500) category = "A2";
      else category = "A3";
      categoryRule = "KDIGO PCR (approximate): A1 <150, A2 150–500, A3 >500 mg/g";
    }
    const ginsberg24hG = gPerG; // g/day approximation
    let walserCerMg = null;
    let estimated24hG = null;
    if (isNum(optsSafe.age) && isNum(optsSafe.weightKg)) {
      const age = optsSafe.age;
      const w = optsSafe.weightKg;
      const perKg = optsSafe.female ? 21.9 - 0.115 * age : 28.2 - 0.172 * age;
      walserCerMg = perKg * w;
      estimated24hG = (mgPerG * walserCerMg) / 1000000; // mg/g × g Cr/day / 1000 = g analyte/day; cer is mg → /1e6
      estimated24hG = (mgPerG / 1000) * (walserCerMg / 1000);
    }
    return {
      gPerG,
      mgPerG,
      mgPerMmol,
      category,
      categoryRule,
      ginsberg24hG,
      walserCerMg,
      estimated24hG,
    };
  }

  function kdigoACategoryFromAcr(acrMgg) {
    req("ACR", acrMgg);
    if (acrMgg < 30) return "A1";
    if (acrMgg <= 300) return "A2";
    return "A3";
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 5. Hemodialysis
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Urea reduction ratio (%).
   * URR = (preBUN − postBUN) / preBUN × 100
   * Lowrie EG, Lew NL. Am J Kidney Dis. 1990;15:458-482 (and subsequent URR literature).
   * Definitional; KDOQI HD adequacy guidelines use URR ≥ 65% as a minimum (thrice weekly)
   * corresponding roughly to spKt/V 1.2.
   */
  function urr(preBun, postBun) {
    req("preBUN", preBun);
    req("postBUN", postBun);
    if (preBun <= 0) throw new Error("Pre-dialysis BUN must be positive");
    return ((preBun - postBun) / preBun) * 100;
  }

  /**
   * Single-pool variable-volume Kt/V — Daugirdas second-generation equation.
   * Daugirdas JT. J Am Soc Nephrol. 1993;4:1205-1213. doi:10.1681/ASN.V451205
   *   spKt/V = −ln(R − 0.008×t) + (4 − 3.5×R) × (UF/W)
   *   R = post/pre BUN; t in hours; UF in L (or kg); W = postdialysis weight in kg.
   */
  function daugirdasSpKtv(preBun, postBun, tHours, ufL, weightKg) {
    req("preBUN", preBun);
    req("postBUN", postBun);
    req("time", tHours);
    const R = postBun / preBun;
    const ufOverW = isNum(ufL) && isNum(weightKg) && weightKg > 0 ? ufL / weightKg : 0;
    const inner = R - 0.008 * tHours;
    if (inner <= 0) throw new Error("R − 0.008t must be positive (check BUN values and time)");
    return -Math.log(inner) + (4 - 3.5 * R) * ufOverW;
  }

  /**
   * Equilibrated Kt/V — Tattersall equation.
   * Tattersall JE, DeTakats D, Chamney P, Greenwood RN, Farrington K.
   *   Kidney Int. 1996;50:2094-2102. doi:10.1038/ki.1996.534
   *   eKt/V = spKt/V × t / (t + 35)     t in minutes
   *   Use +22 instead of +35 for catheter (central venous) access, per later
   *   practice reflecting lower apparent rebound (UKKA and others).
   */
  function tattersallEKtv(spKtv, tMinutes, access) {
    req("spKt/V", spKtv);
    req("time", tMinutes);
    const add = access === "catheter" ? 22 : 35;
    return (spKtv * tMinutes) / (tMinutes + add);
  }

  /**
   * Equilibrated Kt/V — Daugirdas–Schneditz rate equations.
   * Daugirdas JT, Schneditz D. ASAIO J. 1995;41:M719-M724.
   *   Arterial (fistula/graft): eKt/V = spKt/V − 0.60 × (spKt/V)/T + 0.03
   *   Venous (catheter):        eKt/V = spKt/V − 0.47 × (spKt/V)/T + 0.02
   *   T in hours.
   */
  function daugirdasRateEKtv(spKtv, tHours, access) {
    req("spKt/V", spKtv);
    req("time", tHours);
    if (tHours <= 0) throw new Error("Session time must be positive");
    if (access === "catheter" || access === "venous") {
      return spKtv - 0.47 * (spKtv / tHours) + 0.02;
    }
    return spKtv - 0.6 * (spKtv / tHours) + 0.03;
  }

  /**
   * Standard weekly Kt/V — Leypoldt fixed-volume formula.
   * Leypoldt JK, Jaber BL, Zimmerman DL. Semin Dial. 2004;17:142-145.
   *   doi:10.1111/j.0894-0959.2004.17208.x
   *   stdKt/V = [10080 × (1 − exp(−eKt/V)) / t]
   *             / [(1 − exp(−eKt/V)) / eKt/V + 10080 / (N × t) − 1]
   *   t in minutes, N = sessions per week.
   * Equivalent form with t in hours uses 168 in place of 10080.
   *
   * FHN / Daugirdas 2010 variable-volume adjustment (accounts for UF;
   * values are typically ~7% higher than Leypoldt):
   * Daugirdas JT et al. Kidney Int. 2010;77:637-644. doi:10.1038/ki.2009.525
   *   stdKt/V_FHN = stdKt/V_Leypoldt / (1 − 0.74 × UF_session / V)
   *   UF and V in litres. We apply this when UF and V are provided.
   *
   * Optional residual urea clearance Kru (mL/min) is added with the simple
   * approximation Kru × 10080 / (V_mL) = Kru × 10.08 / V_L. The 2010 paper
   * has a refined residual term; we use the simple additive form and say so.
   *
   * KDOQI 2015 minimum stdKt/V is 2.1 (using a method that includes UF,
   * i.e. closer to the FHN estimate) for schedules other than 3×/week;
   * the earlier Leypoldt-based target was 2.0.
   */
  function leypoldtStdKtv(eKtv, tMinutes, sessionsPerWeek) {
    req("eKt/V", eKtv);
    req("time", tMinutes);
    req("sessions", sessionsPerWeek);
    if (eKtv <= 0 || tMinutes <= 0 || sessionsPerWeek <= 0) {
      throw new Error("eKt/V, time and sessions must be positive");
    }
    const oneMinus = 1 - Math.exp(-eKtv);
    const num = (10080 * oneMinus) / tMinutes;
    const den = oneMinus / eKtv + 10080 / (sessionsPerWeek * tMinutes) - 1;
    return num / den;
  }

  function fhnStdKtv(leypoldt, ufSessionL, vL) {
    req("Leypoldt stdKt/V", leypoldt);
    req("UF", ufSessionL);
    req("V", vL);
    const denom = 1 - 0.74 * (ufSessionL / vL);
    if (denom <= 0) throw new Error("UF/V too large for FHN adjustment");
    return leypoldt / denom;
  }

  function residualStdKtv(kruMlMin, vL) {
    req("Kru", kruMlMin);
    req("V", vL);
    return (kruMlMin * 10.08) / vL;
  }

  /**
   * nPCR / nPNA from interdialytic BUN rise (two-point anuric approximation).
   *
   * nPCR (g/kg/day) = 0.22 + 0.864 × (BUNpre_next − BUNpost) / tid_hours
   *                 = 0.22 + (0.036 × ΔBUN × 24) / tid_hours
   *
   * This is the commonly used interdialytic-rise form requested for the toolbox.
   * Depner TA, Daugirdas JT. J Am Soc Nephrol. 1996;7:780-788 (two-point nPCR
   * modelling; the formal published equations use predialysis BUN and Kt/V and
   * are session-specific — see nPcrDepnerDaugirdasMidweek). Worked example:
   * ΔBUN 46 mg/dL over 44 h → 0.22 + 0.864×46/44 = 1.12 g/kg/day.
   *
   * Formal midweek (session 2 of 3) Depner–Daugirdas 1996 equation:
   *   nPCR = C0 / (25.8 + 1.15×Kt/V + 56.4/(Kt/V)) + 0.168
   *   C0 = predialysis BUN, mg/dL. The 0.168 term is non-urea nitrogen.
   */
  function nPcrInterdialytic(postBun, nextPreBun, tidHours) {
    req("postBUN", postBun);
    req("next preBUN", nextPreBun);
    req("interval", tidHours);
    if (tidHours <= 0) throw new Error("Interdialytic interval must be positive");
    return 0.22 + (0.864 * (nextPreBun - postBun)) / tidHours;
  }

  function nPcrDepnerDaugirdasMidweek(preBun, ktv) {
    req("preBUN", preBun);
    req("Kt/V", ktv);
    if (ktv <= 0) throw new Error("Kt/V must be positive");
    return preBun / (25.8 + 1.15 * ktv + 56.4 / ktv) + 0.168;
  }

  /**
   * Ultrafiltration rate (mL/kg/h).
   * UFR = UF_mL / weight_kg / t_hours
   * Weight is typically postdialysis (or target) weight.
   * Threshold: Flythe JE, Kimmel SE, Brunelli SM. Kidney Int. 2011;79:1110-1117.
   *   doi:10.1038/ki.2010.383
   *   UFR > 13 mL/kg/h associated with higher all-cause and CV mortality vs ≤10.
   *   10–13 was intermediate; CMS quality measures have used 13 mL/kg/h.
   */
  function ultrafiltrationRate(ufMl, weightKg, tHours) {
    req("UF", ufMl);
    req("weight", weightKg);
    req("time", tHours);
    if (weightKg <= 0 || tHours <= 0) throw new Error("Weight and time must be positive");
    return ufMl / weightKg / tHours;
  }

  /**
   * Watson total body water (L) — used as urea distribution volume V.
   * Watson PE, Watson ID, Batt RD. Am J Clin Nutr. 1980;33:27-39.
   *   doi:10.1093/ajcn/33.1.27
   *   Male:   V = 2.447 − 0.09516×age + 0.1074×height_cm + 0.3362×weight_kg
   *   Female: V = −2.097 + 0.1069×height_cm + 0.2466×weight_kg
   *   (female formula has no age term, as published).
   * Use postdialysis weight for hemodialysis V.
   */
  function watsonTbw(age, heightCm, weightKg, female) {
    req("height", heightCm);
    req("weight", weightKg);
    if (female) return -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
    req("age", age);
    return 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 6. CRRT
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Plasma flow (mL/h) from blood flow and hematocrit (fraction 0–1).
   * Qp = Qb_mL/min × 60 × (1 − Hct)
   * Some authors further multiply by 0.93 (plasma water fraction); we do not,
   * and we state that (judgment).
   */
  function plasmaFlowMlH(qbMlMin, hct) {
    req("Qb", qbMlMin);
    req("Hct", hct);
    if (hct < 0 || hct >= 1) {
      // allow 0–100% entry
      if (hct >= 1 && hct < 100) hct = hct / 100;
      else throw new Error("Hematocrit must be a fraction (0–1) or a percent (1–99)");
    }
    return qbMlMin * 60 * (1 - hct);
  }

  /**
   * Predilution correction (dilution factor).
   * DF = Qp / (Qp + Qpre)
   * Effective effluent for urea (sieving coefficient ≈ 1) = Qeff × DF
   * Standard CRRT teaching; see Macedo E, Mehta RL. AJKD. 2016 (Core Curriculum)
   * and KDIGO AKI 2012 discussion of effluent dose.
   */
  function predilutionFactor(qpMlH, qpreMlH) {
    req("Qp", qpMlH);
    const qpre = isNum(qpreMlH) ? qpreMlH : 0;
    if (qpMlH + qpre <= 0) throw new Error("Plasma + predilution flow must be positive");
    return qpMlH / (qpMlH + qpre);
  }

  /**
   * Prescribed effluent dose (mL/kg/h).
   * Qeff = Qd + Qr_pre + Qr_post + Qnet   (all mL/h), depending on modality:
   *   CVVH post: Qr_post + Qnet
   *   CVVH pre:  Qr_pre + Qnet, then × DF
   *   CVVHD:     Qd + Qnet
   *   CVVHDF:    Qd + Qr_pre + Qr_post + Qnet, × DF if Qpre > 0
   * Dose = (Qeff × DF) / weight_kg
   *
   * KDIGO AKI 2012 (Kidney Int Suppl. 2012;2:1-138), recommendation 5.8.4:
   *   "We recommend delivering an effluent volume of 20–25 mL/kg/h for CRRT
   *    in AKI (1A). This will usually require a higher prescription of effluent
   *    volume." Based on the ATN (Palevsky et al., NEJM 2008) and RENAL
   *    (Bellomo et al., NEJM 2009) trials.
   */
  function crrtEffluentDose(opts) {
    const wt = req("weight", opts.weightKg);
    const qd = opts.qdMlH || 0;
    const qpre = opts.qpreMlH || 0;
    const qpost = opts.qpostMlH || 0;
    const qnet = opts.qnetMlH || 0;
    const qeff = qd + qpre + qpost + qnet;
    let df = 1;
    if (qpre > 0) {
      const qb = req("Qb (required for predilution correction)", opts.qbMlMin);
      const hct = req("Hct (required for predilution correction)", opts.hct);
      const qp = plasmaFlowMlH(qb, hct);
      df = predilutionFactor(qp, qpre);
    }
    const prescribed = qeff / wt;
    const corrected = (qeff * df) / wt;
    return { qeffMlH: qeff, df, prescribedMlKgH: prescribed, correctedMlKgH: corrected };
  }

  /**
   * Filtration fraction.
   * Quf (convective ultrafiltration) = Qpre + Qpost + Qnet  (replacement + net UF)
   *   For pure CVVHD, Quf = Qnet only (dialysate is not ultrafiltrate).
   * Post-filter (no predilution) FF = Quf / Qp
   * Pre-dilution FF = Quf / (Qp + Qpre)
   * Caution: commonly keep FF below 20–25% to limit hemoconcentration and
   * filter clotting (AJKD Core Curriculum 2016; standard CRRT practice).
   * The 20–25% figure is practice-based, not a KDIGO numeric target.
   */
  function filtrationFraction(opts) {
    const qb = req("Qb", opts.qbMlMin);
    const hct = req("Hct", opts.hct);
    const qp = plasmaFlowMlH(qb, hct);
    const qpre = opts.qpreMlH || 0;
    const qpost = opts.qpostMlH || 0;
    const qnet = opts.qnetMlH || 0;
    const modality = opts.modality || "cvvh";
    const quf = modality === "cvvhd" ? qnet : qpre + qpost + qnet;
    const ffPost = quf / qp; // "post-filter" style: UF over plasma flow
    const ffPre = quf / (qp + qpre);
    return { qpMlH: qp, qufMlH: quf, ffPost, ffPre, ffPostPct: ffPost * 100, ffPrePct: ffPre * 100 };
  }

  /**
   * Total / ionized calcium ratio for citrate accumulation on RCA.
   * Both concentrations converted to mmol/L.
   * Meier-Kriesche HU, Gitomer J, Finkel K, DuBose T.
   *   Crit Care Med. 2001;29:748-752. PMID:11373461
   *   Ratio > 2.5 suggests citrate accumulation.
   * A lower caution threshold of > 2.1 is also used (more sensitive, less specific);
   * we display both and cite 2.5 as the original Meier-Kriesche cutoff.
   */
  function citrateCalciumRatio(totalCa, totalUnit, ica, icaUnit) {
    const totalMmol = convertCaToMmol(totalCa, totalUnit || "mmol/L");
    const icaMmol = convertCaToMmol(ica, icaUnit || "mmol/L");
    if (icaMmol <= 0) throw new Error("Ionized calcium must be positive");
    const ratio = totalMmol / icaMmol;
    return { ratio, totalMmol, icaMmol };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 7. Peritoneal dialysis
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Weekly peritoneal + renal Kt/V urea.
   * Peritoneal daily Kt (L) = (Durea / Purea) × 24-h drain volume (L)
   * Renal daily Kt (L)     = (Uurea / Purea) × 24-h urine volume (L)
   * Weekly Kt/V = 7 × (Ktp + Ktr) / V
   * V typically Watson TBW (ISPD / KDOQI PD adequacy).
   * ISPD 2020 (Brown EA et al. Perit Dial Int. 2020;40:323-329.
   *   doi:10.1177/0896860819895364) emphasizes high-quality goal-directed PD;
   *   a weekly Kt/V urea of 1.7 remains a commonly cited reference from earlier
   *   ISPD / KDOQI adequacy guidance, not a rigid sole target.
   */
  function pdWeeklyKtv(dOverPUrea, drainVolumeL, vL, uOverPUrea, urineVolumeL) {
    req("D/P urea", dOverPUrea);
    req("drain volume", drainVolumeL);
    req("V", vL);
    if (vL <= 0) throw new Error("V must be positive");
    const ktpDay = dOverPUrea * drainVolumeL;
    const ktrDay = isNum(uOverPUrea) && isNum(urineVolumeL) ? uOverPUrea * urineVolumeL : 0;
    const weeklyKtvP = (7 * ktpDay) / vL;
    const weeklyKtvR = (7 * ktrDay) / vL;
    return {
      ktpDayL: ktpDay,
      ktrDayL: ktrDay,
      weeklyKtvPeritoneal: weeklyKtvP,
      weeklyKtvRenal: weeklyKtvR,
      weeklyKtvTotal: weeklyKtvP + weeklyKtvR,
    };
  }

  /**
   * Body surface area.
   * Mosteller RD. N Engl J Med. 1987;317:1098. doi:10.1056/NEJM198710223171717
   *   BSA (m²) = √(height_cm × weight_kg / 3600)
   * Du Bois D, Du Bois EF. Arch Intern Med. 1916;17:863-871.
   *   BSA = 0.007184 × weight_kg^0.425 × height_cm^0.725
   * We use Mosteller as the default for PD CrCl normalization (simpler, widely
   * used in dialysis units) and also report DuBois. Stated in the UI.
   */
  function bsaMosteller(heightCm, weightKg) {
    req("height", heightCm);
    req("weight", weightKg);
    return Math.sqrt((heightCm * weightKg) / 3600);
  }

  function bsaDuBois(heightCm, weightKg) {
    req("height", heightCm);
    req("weight", weightKg);
    return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
  }

  /**
   * Weekly creatinine clearance (L/week/1.73 m²).
   * Peritoneal CrCl (L/week) = (Dcr/Pcr) × 24-h drain volume (L) × 7
   * Renal CrCl (L/week)      = (Ucr/Pcr) × 24-h urine volume (L) × 7
   * Residual kidney function is often the MEAN of urea and creatinine clearance
   * (ISPD / KDOQI PD adequacy; avoids overestimating Ccr from tubular secretion):
   *   RKF (L/week) = 0.5 × (Curea + Ccr)_renal × 7
   * Normalize: × 1.73 / BSA.
   * Target historically ≥45–50 L/week/1.73 m² in low-transporter CAPD (KDOQI 2006);
   * ISPD 2020 is less prescriptive. We report the number and the historical reference.
   */
  function pdWeeklyCrCl(opts) {
    const dOverPCr = req("D/P Cr", opts.dOverPCr);
    const drainL = req("drain volume", opts.drainVolumeL);
    const peritonealLWeek = dOverPCr * drainL * 7;
    let renalCrLWeek = 0;
    let renalUreaLWeek = 0;
    if (isNum(opts.uOverPCr) && isNum(opts.urineVolumeL)) {
      renalCrLWeek = opts.uOverPCr * opts.urineVolumeL * 7;
    }
    if (isNum(opts.uOverPUrea) && isNum(opts.urineVolumeL)) {
      renalUreaLWeek = opts.uOverPUrea * opts.urineVolumeL * 7;
    }
    const rkfMeanLWeek = renalCrLWeek || renalUreaLWeek ? 0.5 * (renalCrLWeek + renalUreaLWeek) : 0;
    // Total CrCl commonly = peritoneal CrCl + residual (mean of urea+cr)
    const totalLWeek = peritonealLWeek + rkfMeanLWeek;
    let bsa = null;
    let method = null;
    if (isNum(opts.heightCm) && isNum(opts.weightKg)) {
      method = opts.bsaMethod === "dubois" ? "DuBois" : "Mosteller";
      bsa = method === "DuBois" ? bsaDuBois(opts.heightCm, opts.weightKg) : bsaMosteller(opts.heightCm, opts.weightKg);
    }
    const norm = (x) => (bsa ? (x * 1.73) / bsa : x);
    return {
      peritonealLWeek,
      renalCrLWeek,
      renalUreaLWeek,
      rkfMeanLWeek,
      totalLWeek,
      bsa,
      bsaMethod: method,
      peritonealLWeek173: norm(peritonealLWeek),
      rkfMeanLWeek173: norm(rkfMeanLWeek),
      totalLWeek173: norm(totalLWeek),
    };
  }

  /**
   * Residual kidney function as the mean of urea and creatinine clearance.
   * C (mL/min) = 0.5 × [(Uurea/Purea)×Vurine/t + (Ucr/Pcr)×Vurine/t]
   * For a 24-h collection, t = 1440 min, V in mL.
   * L/week/1.73 m² = C_mL/min × 10.08 × 1.73/BSA
   * ISPD practice recommendations and KDOQI PD adequacy.
   */
  function residualKidneyFunction(opts) {
    const urineMl = req("urine volume", opts.urineMl);
    const minutes = isNum(opts.minutes) ? opts.minutes : 1440;
    const uOverPUrea = req("U/P urea", opts.uOverPUrea);
    const uOverPCr = req("U/P Cr", opts.uOverPCr);
    const cUrea = (uOverPUrea * urineMl) / minutes; // mL/min
    const cCr = (uOverPCr * urineMl) / minutes;
    const mean = 0.5 * (cUrea + cCr);
    let bsa = null;
    if (isNum(opts.heightCm) && isNum(opts.weightKg)) {
      bsa = opts.bsaMethod === "dubois" ? bsaDuBois(opts.heightCm, opts.weightKg) : bsaMosteller(opts.heightCm, opts.weightKg);
    }
    const lWeek = mean * 10.08;
    const lWeek173 = bsa ? (lWeek * 1.73) / bsa : null;
    return { cUreaMlMin: cUrea, cCrMlMin: cCr, meanMlMin: mean, lWeek, lWeek173, bsa };
  }

  /**
   * PET — 4-hour D/P creatinine and D/D0 glucose, Twardowski categories.
   * Twardowski ZJ, Nolph KD, Khanna R, et al. Perit Dial Bull. 1987;7:138-147.
   *
   * 4-h D/P creatinine (classic Twardowski mean ± SD bands):
   *   Low          0.34–0.49
   *   Low-average  0.50–0.64
   *   High-average 0.65–0.81
   *   High         0.82–1.03
   * Values below 0.34 or above 1.03 are reported as low or high with a note.
   *
   * 4-h D/D0 glucose (inverse; high transporters have low D/D0):
   *   High         0.12–0.26
   *   High-average 0.27–0.38
   *   Low-average  0.39–0.49
   *   Low          0.50–0.61
   * (Widely reproduced Twardowski bands; a 0.38 vs 0.37 HA/LA boundary varies
   *  by 0.01 in some lab manuals — we use 0.38 as the top of HA.)
   *
   * Classification is primarily by 4-h D/P creatinine; D/D0 is supportive.
   * ISPD 2021 membrane-function recommendations (Morelle et al., Perit Dial Int.)
   * advise interpreting 4-h D/P Cr relative to the local laboratory / centre
   * distribution rather than treating these historical bands as universal.
   */
  function petCategory(dpCr4h, dd0Glucose) {
    let crCat = null;
    let crNote = null;
    if (isNum(dpCr4h)) {
      if (dpCr4h < 0.34) {
        crCat = "Low";
        crNote = "Below the classic Twardowski low band (0.34–0.49); reported as low.";
      } else if (dpCr4h < 0.5) crCat = "Low";
      else if (dpCr4h < 0.65) crCat = "Low-average";
      else if (dpCr4h < 0.82) crCat = "High-average";
      else {
        crCat = "High";
        if (dpCr4h > 1.03) crNote = "Above the classic Twardowski high band (0.82–1.03); reported as high.";
      }
    }
    let gluCat = null;
    let gluNote = null;
    if (isNum(dd0Glucose)) {
      if (dd0Glucose < 0.12) {
        gluCat = "High";
        gluNote = "Below the classic high-transporter D/D0 band (0.12–0.26).";
      } else if (dd0Glucose <= 0.26) gluCat = "High";
      else if (dd0Glucose <= 0.38) gluCat = "High-average";
      else if (dd0Glucose <= 0.49) gluCat = "Low-average";
      else {
        gluCat = "Low";
        if (dd0Glucose > 0.61) gluNote = "Above the classic low-transporter D/D0 band (0.50–0.61).";
      }
    }
    return { dpCr4h, dd0Glucose, crCategory: crCat, crNote, glucoseCategory: gluCat, gluNote };
  }

  function petRatios(dialysateCr, plasmaCr, dialysateGlu4h, dialysateGlu0) {
    const out = {};
    if (isNum(dialysateCr) && isNum(plasmaCr) && plasmaCr > 0) out.dpCr = dialysateCr / plasmaCr;
    if (isNum(dialysateGlu4h) && isNum(dialysateGlu0) && dialysateGlu0 > 0) out.dd0 = dialysateGlu4h / dialysateGlu0;
    return out;
  }

  /* ── bundle ────────────────────────────────────────────────────────────── */

  const api = {
    CONV,
    isNum,
    convertCrToMgDl,
    convertBunToMgDl,
    convertGluToMgDl,
    convertCaToMmol,
    convertPo4ToMgDl,
    convertAlbToGdl,
    convertAcrToMgg,
    egfrCkdEpi2021Cr,
    egfrCkdEpi2021CrCys,
    egfrCkdEpi2012Cys,
    cockcroftGault,
    devineIbw,
    adjustedBodyWeight,
    kfreNorthAmerican,
    KFRE_NA,
    kdigoGCategory,
    fena,
    feUrea,
    anionGap,
    osmolalGap,
    sodiumCorrectionHyperglycemia,
    freeWaterDeficit,
    wintersFormula,
    deltaDelta,
    expectedCompensation,
    urineRatio,
    kdigoACategoryFromAcr,
    urr,
    daugirdasSpKtv,
    tattersallEKtv,
    daugirdasRateEKtv,
    leypoldtStdKtv,
    fhnStdKtv,
    residualStdKtv,
    nPcrInterdialytic,
    nPcrDepnerDaugirdasMidweek,
    ultrafiltrationRate,
    watsonTbw,
    plasmaFlowMlH,
    predilutionFactor,
    crrtEffluentDose,
    filtrationFraction,
    citrateCalciumRatio,
    pdWeeklyKtv,
    bsaMosteller,
    bsaDuBois,
    pdWeeklyCrCl,
    residualKidneyFunction,
    petCategory,
    petRatios,
  };

  global.NephFormulas = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
