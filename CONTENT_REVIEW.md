# Content review — Nephrology Toolbox (Draft)

**Draft – not for clinical use until reviewed by Dr D.**

This checklist is for Dr Amar Damodar (Dr D) to sign off on every formula before `DRAFT` can be set to false and before any clinical use.

- App (draft preview): https://amarzon-tech.github.io/neph-toolbox/
- `DRAFT=true` in `js/config.js`
- Support: amardamodar@gmail.com
- Publisher: Wellness Tech LLC

How to use: check the box only after you have verified the equation, the coefficients, the units, the citation, and the listed limitations. Add comments under any item that needs a change.

Judgment calls (where sources disagreed or a convention was chosen) are marked **Judgment** in the limitations and are also summarized at the end of this file.


## Kidney function

eGFR, creatinine clearance, and kidney-failure risk

### eGFR CKD-EPI 2021 (creatinine)

Race-free creatinine equation recommended by NKF and ASN.

**Equation**

```
eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 [if female]
κ = 0.7 (female) or 0.9 (male);  α = −0.241 (female) or −0.302 (male)
Scr in mg/dL (µmol/L ÷ 88.4). Adults ≥ 18 years.
```

**Citation**

Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. N Engl J Med. 2021;385:1737-1749.
- DOI: https://doi.org/10.1056/NEJMoa2102953
- PubMed: https://pubmed.ncbi.nlm.nih.gov/34554658/

**Limitations**

- Validated in adults. Not for AKI (creatinine not in steady state), pregnancy, extremes of muscle mass, or amputation — consider cystatin C or measured GFR.
- Less accurate than the 2021 combined creatinine–cystatin C equation. P30 is about 87% in the 2021 validation data.

- [ ] Sign-off: eGFR CKD-EPI 2021 (creatinine)

---

### eGFR CKD-EPI 2021 (creatinine–cystatin C)

Race-free combined equation; more accurate than creatinine alone.

**Equation**

```
eGFR = 135 × min(Scr/κ,1)^α × max(Scr/κ,1)^−0.544 × min(Scys/0.8,1)^−0.323 × max(Scys/0.8,1)^−0.778 × 0.9961^age × 0.963 [if female]
κ = 0.7 (F) or 0.9 (M);  α = −0.219 (F) or −0.144 (M)
Scr mg/dL; Scys mg/L.
```

**Citation**

Inker LA, Eneanya ND, Coresh J, et al. N Engl J Med. 2021;385:1737-1749.
- DOI: https://doi.org/10.1056/NEJMoa2102953
- PubMed: https://pubmed.ncbi.nlm.nih.gov/34554658/

**Limitations**

- Cystatin C should be measured with a standardized (IFCC-traceable) assay.
- Cystatin C can be influenced by inflammation, smoking, obesity, corticosteroids and thyroid status, independently of GFR.
- Adults ≥ 18 years; not for AKI.

- [ ] Sign-off: eGFR CKD-EPI 2021 (creatinine–cystatin C)

---

### eGFR CKD-EPI 2012 (cystatin C)

Cystatin C–only equation; already race-free in 2012.

**Equation**

```
eGFR = 133 × min(Scys/0.8, 1)^−0.499 × max(Scys/0.8, 1)^−1.328 × 0.996^age × 0.932 [if female]
Scys in mg/L. Age coefficient 0.996 as published in 2012 and on the NKF page.
(Inker 2021 Table 2 lists 0.9962 as a more precise fit; we use the published 2012 equation.)
```

**Citation**

Inker LA, Schmid CH, Tighiouart H, et al. Estimating glomerular filtration rate from serum creatinine and cystatin C. N Engl J Med. 2012;367:20-29.
- DOI: https://doi.org/10.1056/NEJMoa1114248
- PubMed: https://pubmed.ncbi.nlm.nih.gov/22762315/

**Limitations**

- Already race-free. Useful when creatinine is unreliable (low muscle mass, amputation).
- See cystatin C non-GFR determinants under the 2021 combined equation.

- [ ] Sign-off: eGFR CKD-EPI 2012 (cystatin C)

---

### Cockcroft–Gault CrCl

Creatinine clearance with actual, ideal, or adjusted body weight.

**Equation**

```
CrCl (mL/min) = [(140 − age) × weight_kg × (0.85 if female)] / (72 × Scr_mg/dL)
Devine IBW: male 50 + 2.3 × (height_in − 60); female 45.5 + 2.3 × (height_in − 60)
Adjusted BW = IBW + 0.4 × (actual − IBW)
```

**Citation**

Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41. IBW: Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655. Weight selection: Winter MA et al. Pharmacotherapy. 2012;32:604-612.
- DOI: https://doi.org/10.1159/000180580
- PubMed: https://pubmed.ncbi.nlm.nih.gov/1244564/

**Limitations**

- Overestimates GFR at low muscle mass and in the elderly if actual weight is used uncritically. Underestimates in obesity if IBW is used.
- Original study used non-standardized creatinine; modern IDMS-traceable creatinine slightly raises calculated CrCl.
- The 0.4 adjustment factor is conventional, not from Cockcroft and Gault’s paper.

- [ ] Sign-off: Cockcroft–Gault CrCl

---

### KFRE 4-variable (North American)

2- and 5-year kidney-failure risk from age, sex, eGFR and UACR.

**Equation**

```
Risk = 1 − S₀^exp(LP)
LP = −0.2201(age/10 − 7.036) + 0.2467(male − 0.5642) − 0.5567(eGFR/5 − 7.222) + 0.4510(ln(ACR_mg/g) − 5.137)
Male = 1, female = 0.  North American S₀: 2-year 0.9750, 5-year 0.9240.
ACR in mg/g (mg/mmol × 8.84).
```

**Citation**

Tangri N et al. A predictive model for progression of chronic kidney disease to kidney failure. JAMA. 2011;305:1553-1559. Validation: Tangri N et al. JAMA. 2016;315:164-174.
- DOI: https://doi.org/10.1001/jama.2011.451
- PubMed: https://pubmed.ncbi.nlm.nih.gov/21482743/

**Limitations**

- North American coefficients are the original Tangri 2011 (Canadian) coefficients. Tangri 2016 found calibration adequate in North American cohorts; a separate downward recalibration applies to many non-North-American cohorts (not used here).
- Intended for CKD G3–G5 (eGFR < 60) in adults. Do not use after kidney transplant or in AKI.
- UACR uses albumin/creatinine. The ln(ACR) centering constant 5.137 corresponds to ACR in mg/g (≈170 mg/g).
- Risk is of treated kidney failure (dialysis or transplant) and does not account for the competing risk of death.
- Common thresholds (kidneyfailurerisk.com / KDIGO discussion): 3–5% at 5 years for nephrology referral; 10% at 2 years for multidisciplinary care; 20–40% at 2 years for access or transplant planning.

- [ ] Sign-off: KFRE 4-variable (North American)

---

### KFRE 8-variable (North American)

Adds albumin, phosphate, bicarbonate and calcium to the 4-variable model.

**Equation**

```
LP = −0.1992(age/10 − 7.036) + 0.1602(male − 0.5642) − 0.4919(eGFR/5 − 7.222) + 0.3364(ln(ACR) − 5.137)
     −0.3441(albumin − 3.997) + 0.2604(phosphate − 3.916) − 0.07354(bicarbonate − 25.57) − 0.2228(calcium − 9.355)
Albumin g/dL, phosphate mg/dL, bicarbonate mEq/L, calcium mg/dL, ACR mg/g.
North American S₀: 2-year 0.9780, 5-year 0.9301.
```

**Citation**

Tangri N et al. JAMA. 2011;305:1553-1559. doi:10.1001/jama.2011.451. Validation: Tangri N et al. JAMA. 2016;315:164-174. doi:10.1001/jama.2015.18202.
- DOI: https://doi.org/10.1001/jama.2011.451
- PubMed: https://pubmed.ncbi.nlm.nih.gov/21482743/

**Limitations**

- North American coefficients are the original Tangri 2011 (Canadian) coefficients. Tangri 2016 found calibration adequate in North American cohorts; a separate downward recalibration applies to many non-North-American cohorts (not used here).
- Intended for CKD G3–G5 (eGFR < 60) in adults. Do not use after kidney transplant or in AKI.
- UACR uses albumin/creatinine. The ln(ACR) centering constant 5.137 corresponds to ACR in mg/g (≈170 mg/g).
- Risk is of treated kidney failure (dialysis or transplant) and does not account for the competing risk of death.
- Common thresholds (kidneyfailurerisk.com / KDIGO discussion): 3–5% at 5 years for nephrology referral; 10% at 2 years for multidisciplinary care; 20–40% at 2 years for access or transplant planning.
- The 8-variable model was less often usable in routine data because calcium, phosphate, bicarbonate and albumin are frequently missing.

- [ ] Sign-off: KFRE 8-variable (North American)

---

## Electrolytes

FENa, anion and osmolal gaps, sodium, free water

### FENa

Fractional excretion of sodium for oliguric AKI (when not on diuretics).

**Equation**

```
FENa (%) = (UNa × PCr) / (PNa × UCr) × 100
Sodium and creatinine units cancel if paired samples share units.
```

**Citation**

Espinel CH. The FENa test: use in the differential diagnosis of acute renal failure. JAMA. 1976;236:579-581.
- DOI: https://doi.org/10.1001/jama.1976.03270060029022
- PubMed: https://pubmed.ncbi.nlm.nih.gov/947239/

**Limitations**

- Unreliable on diuretics, in CKD, after contrast, in rhabdomyolysis, sepsis, late ATN with low FENa, and in obstruction or glomerulonephritis (can be <1%).
- Best interpreted in oliguric AKI with the clinical picture. Use FEUrea when the patient is on diuretics.
- Cutoffs of 1% and 2% are traditional teaching, not absolute.

- [ ] Sign-off: FENa

---

### FEUrea

Fractional excretion of urea; preferred when the patient is on diuretics.

**Equation**

```
FEUrea (%) = (UUrea × PCr) / (PUrea × UCr) × 100
BUN may be used for both urine and plasma (conversion cancels).
```

**Citation**

Carvounis CP, Nisar S, Guro-Razuman S. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62:2223-2229.
- DOI: https://doi.org/10.1046/j.1523-1755.2002.00630.x
- PubMed: https://pubmed.ncbi.nlm.nih.gov/12427149/

**Limitations**

- More useful than FENa in patients receiving diuretics. Still an adjunct to clinical assessment.
- Osmotic diuresis, CKD, and some forms of ATN can produce overlapping values. Cutoffs 35% and 50% are from Carvounis et al. 2002.

- [ ] Sign-off: FEUrea

---

### Anion gap

Na − (Cl + HCO₃), with optional Figge albumin correction.

**Equation**

```
AG = Na − (Cl + HCO₃)
Albumin-corrected AG = AG + 2.5 × (4.4 − albumin_g/dL)   (Figge et al. 1998)
```

**Citation**

Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med. 1998;26:1807-1810.
- DOI: https://doi.org/10.1097/00003246-199811000-00019
- PubMed: https://pubmed.ncbi.nlm.nih.gov/9824071/

**Limitations**

- Normal AG depends on the laboratory’s chloride electrode (often lower with ion-selective electrodes). Use your lab’s reference, not a universal 12.
- Judgment: some correct to a normal albumin of 4.0 g/dL, or use a factor of 3.0 mEq/L per 1 g/dL. We use Figge’s published 2.5 and 4.4.
- Lithium, hyperlipidemia and hypoalbuminemia lower the apparent AG; myeloma IgG can lower it, IgA can raise it.

- [ ] Sign-off: Anion gap

---

### Osmolal gap

Measured minus calculated osmolarity (conventional 2×Na formula).

**Equation**

```
Calculated osmolarity = 2×Na + glucose/18 + BUN/2.8   (+ ethanol/4.6 if entered)
Na in mEq/L, glucose and BUN in mg/dL. SI equivalent: 2×Na + glucose_mmol + urea_mmol.
Osmolal gap = measured osmolality − calculated osmolarity.
```

**Citation**

Worthley LI, Guerin M, Pain RW. For calculation of osmolality, the simplest formula is the best. Anaesth Intensive Care. 1987;15:199-202. Conventional 2×Na formula.
- DOI: https://doi.org/10.1177/0310057X8701500214
- PubMed: https://pubmed.ncbi.nlm.nih.gov/3605570/

**Limitations**

- Judgment: the Dorwart–Chalmers formula (1.86×Na + glu/18 + BUN/2.8 + 9) is an alternative; we use the conventional 2×Na form used in most nephrology teaching.
- A normal gap does not exclude toxic-alcohol ingestion late in the course (acid metabolites raise the AG as the parent alcohol and the gap fall).
- Ethanol must be in mg/dL for the /4.6 term.

- [ ] Sign-off: Osmolal gap

---

### Sodium correction for hyperglycemia

Katz (1.6) and Hillier (2.4) corrections per 100 mg/dL glucose above 100.

**Equation**

```
Corrected Na = measured Na + factor × (glucose_mg/dL − 100) / 100
Katz factor = 1.6 mEq/L per 100 mg/dL.  Hillier factor = 2.4 mEq/L per 100 mg/dL.
```

**Citation**

Katz MA. Hyperglycemia-induced hyponatremia. N Engl J Med. 1973;289:843-844. Hillier TA, Abbott RD, Barrett EJ. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999;106:399-403.
- DOI: https://doi.org/10.1056/NEJM197310182891607
- PubMed: https://pubmed.ncbi.nlm.nih.gov/10225241/

**Limitations**

- Hillier’s 2.4 was measured during experimental hyperglycemia and is often preferred at high glucose; Katz’s 1.6 is the traditional bedside factor. We report both.
- Hillier noted the relationship is not perfectly linear (closer to 1.6 at modest hyperglycemia and larger at very high glucose).
- This estimates the expected dilutional change; it does not replace a measured sodium after glucose is corrected.

- [ ] Sign-off: Sodium correction for hyperglycemia

---

### Free water deficit

TBW × (Na/target − 1), with sex- and age-specific TBW fractions.

**Equation**

```
Deficit (L) = TBW × (Na / targetNa − 1)
TBW = fraction × weight_kg
Fractions: adult men 0.60, adult women 0.50, elderly men 0.50, elderly women 0.45.
Elderly is taken as age ≥ 65 (a common convention; the NEJM review does not set a hard cutoff).
```

**Citation**

Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342:1493-1499.
- DOI: https://doi.org/10.1056/NEJM200005183422006
- PubMed: https://pubmed.ncbi.nlm.nih.gov/10816188/

**Limitations**

- TBW fractions are population averages and are less accurate in obesity, volume depletion, or anasarca.
- Does not include ongoing insensible or urinary free-water losses. Do not use as a one-shot infusion prescription.

- [ ] Sign-off: Free water deficit

---

## Acid–base

Winter's, delta–delta, and expected compensation

### Winter's formula

Expected PCO₂ in metabolic acidosis: 1.5 × HCO₃ + 8 (±2).

**Equation**

```
Expected PCO₂ = 1.5 × HCO₃ + 8   (±2 mmHg)
```

**Citation**

Albert MS, Dell RB, Winters RW. Quantitative displacement of acid-base equilibrium in metabolic acidosis. Ann Intern Med. 1967;66:312-322.
- DOI: https://doi.org/10.7326/0003-4819-66-2-312
- PubMed: https://pubmed.ncbi.nlm.nih.gov/6016545/

**Limitations**

- Applies to metabolic acidosis. Do not use for metabolic alkalosis (see Expected compensation).
- The ±2 mmHg band is the usual teaching interval. Compensation takes hours; early disorders may appear under-compensated.

- [ ] Sign-off: Winter's formula

---

### Delta gap / delta–delta ratio

ΔAG / ΔHCO₃ to look for a coexisting NAGMA or metabolic alkalosis.

**Equation**

```
ΔAG = AG − normal AG (default 12)
ΔHCO₃ = normal HCO₃ − measured HCO₃ (default 24)
Ratio = ΔAG / ΔHCO₃
Rastegar-style teaching cutoffs: <0.4 NAGMA-predominant; 0.4–0.8 mixed HAGMA+NAGMA; 0.8–2.0 pure HAGMA; >2 mixed HAGMA + metabolic alkalosis.
```

**Citation**

Rastegar A. Use of the ΔAG/ΔHCO₃ ratio in the diagnosis of mixed acid-base disorders. J Am Soc Nephrol. 2007;18:2429-2431.
- DOI: https://doi.org/10.1681/ASN.2006121247
- PubMed: https://pubmed.ncbi.nlm.nih.gov/17634435/

**Limitations**

- Judgment: cutoffs vary. Some authors treat 1–2 as the pure-HAGMA band (rather than 0.8–2). The ratio is a guide, not a diagnosis.
- If albumin is entered, AG is Figge-corrected before the ratio is formed. Using an uncorrected AG in hypoalbuminemia underestimates ΔAG.
- A high ratio can also reflect chronic respiratory acidosis (pre-existing high HCO₃) rather than a metabolic alkalosis.

- [ ] Sign-off: Delta gap / delta–delta ratio

---

### Expected compensation

Expected PCO₂ or HCO₃ for the six simple acid–base disorders.

**Equation**

```
Metabolic acidosis (Winter's): PCO₂ = 1.5 × HCO₃ + 8 (±2)
Metabolic alkalosis: PCO₂ = 40 + 0.7 × (HCO₃ − 24) (±5)
Acute respiratory acidosis:  HCO₃ = 24 + 0.1 × (PCO₂ − 40)   (+1 per +10 mmHg)
Chronic respiratory acidosis: HCO₃ = 24 + 0.35 × (PCO₂ − 40)  (+3.5 per +10 mmHg)
Acute respiratory alkalosis:  HCO₃ = 24 + 0.2 × (PCO₂ − 40)   (−2 per −10 mmHg)
Chronic respiratory alkalosis: HCO₃ = 24 + 0.5 × (PCO₂ − 40)  (−5 per −10 mmHg)
```

**Citation**

Winter's: Albert, Dell, Winters. Ann Intern Med. 1967;66:312-322. Respiratory rules: Brackett NC, Cohen JJ, Schwartz WB. N Engl J Med. 1965;272:6-12 (acute hypercapnia); Schwartz WB, Brackett NC, Cohen JJ. J Clin Invest. 1965;44:291-301 (chronic). Reviews: Adrogué HJ, Madias NE. N Engl J Med. 1998;338:26-34 and 338:107-111. Metabolic alkalosis 0.7 rule: common teaching, reviewed in Galla JH. J Am Soc Nephrol. 2000;11:369-375.
- DOI: https://doi.org/10.7326/0003-4819-66-2-312

**Limitations**

- Judgment: metabolic alkalosis compensation is sometimes written as 0.6 mmHg per 1 mEq, or as PCO₂ = 0.9×HCO₃+9. We use 0.7 (±5).
- Judgment: chronic respiratory acidosis is sometimes 0.4 (4 per 10) rather than 0.35; chronic respiratory alkalosis is sometimes 0.4 rather than 0.5. We use 0.35 and 0.5, the commonly taught Boston-group values, and state them.
- Chronic compensation takes days (renal). A chronic rule applied to a hours-old disorder will mislead.

- [ ] Sign-off: Expected compensation

---

## Proteinuria

Spot ratios, 24-hour estimates, KDIGO A categories

### UPCR and estimated 24-hour protein

Spot protein/creatinine ratio, KDIGO PCR category, and 24-h estimates.

**Equation**

```
UPCR (g/g) = Uprotein / Ucreatinine   (same units, e.g. both mg/dL)
UPCR (mg/g) = (g/g) × 1000;    UPCR (mg/mmol) = (mg/g) / 8.84
Ginsberg: 24-h protein (g/day) ≈ UPCR (g/g)
Walser CER (mg/day): male (28.2 − 0.172×age)×wt; female (21.9 − 0.115×age)×wt
CER-based 24-h protein (g/day) = UPCR (g/g) × CER (g/day)
KDIGO PCR categories (approximate): A1 <150, A2 150–500, A3 >500 mg/g.
```

**Citation**

Ginsberg JM, Chang BS, Matarese RA, Garella S. Use of single voided urine samples to estimate quantitative proteinuria. N Engl J Med. 1983;309:1543-1546. CER: Walser M. JPEN J Parenter Enteral Nutr. 1987. KDIGO 2012 CKD guideline (Kidney Int Suppl 2013) and KDIGO 2024 CKD guideline.
- DOI: https://doi.org/10.1056/NEJM198312223092503
- PubMed: https://pubmed.ncbi.nlm.nih.gov/6656884/

**Limitations**

- Ginsberg’s approximation assumes about 1 g/day creatinine excretion and is less accurate at extremes of muscle mass, in children, and with very dilute or concentrated urine.
- We do not use the Ix 2011 CKD-EPI creatinine-excretion equation because it includes a Black race term. Walser is race-free and approximate.
- A timed 24-hour collection remains the reference when a precise quantity is needed.

- [ ] Sign-off: UPCR and estimated 24-hour protein

---

### UACR and estimated 24-hour albumin

Spot albumin/creatinine ratio, KDIGO A1–A3, and 24-h estimates.

**Equation**

```
UACR (mg/g) = (Ualb / UCr) × 1000   when both are in mg/dL
UACR (mg/mmol) = (mg/g) / 8.84
KDIGO: A1 <30, A2 30–300, A3 >300 mg/g  (or <3, 3–30, >30 mg/mmol).
```

**Citation**

KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of CKD. Kidney Int Suppl. 2013;3:1-150. KDIGO 2024 CKD guideline. Conversion 8.84 from creatinine molecular weight 113.12.
- DOI: https://doi.org/10.1038/kisup.2012.73

**Limitations**

- Confirm units on the lab report: urine albumin is often mg/L and creatinine mg/dL, which would inflate the ratio ten-fold if entered naively.
- Exercise, fever, infection and menstruation can transiently raise ACR. KDIGO recommends confirmation of A2 or A3.
- Ginsberg-style and Walser 24-h estimates are approximate (see UPCR caveats).

- [ ] Sign-off: UACR and estimated 24-hour albumin

---

## Hemodialysis

URR, Kt/V, standard weekly dose, nPCR, UFR, Watson V

### Hemodialysis dose (URR & Kt/V)

URR, Daugirdas spKt/V, Tattersall and rate-equation eKt/V, Leypoldt and FHN stdKt/V.

**Equation**

```
URR = (pre − post) / pre × 100
spKt/V = −ln(R − 0.008t) + (4 − 3.5R)×(UF/W)     R = post/pre, t hours, UF L, W kg   (Daugirdas 1993)
Tattersall: eKt/V = spKt/V × t / (t + 35)   t minutes; use 22 for a catheter
Rate eq. (arterial): eKt/V = spKt/V − 0.60×(spKt/V)/T + 0.03    T hours
Rate eq. (venous/catheter): eKt/V = spKt/V − 0.47×(spKt/V)/T + 0.02
Leypoldt stdKt/V = [10080(1−e^(−eKt/V))/t] / [(1−e^(−eKt/V))/eKt/V + 10080/(N t) − 1]    t minutes
FHN: stdKt/V_FHN = stdKt/V_Leypoldt / (1 − 0.74 × UF_session / V)
```

**Citation**

Daugirdas JT. Second generation logarithmic estimates of single-pool variable volume Kt/V. J Am Soc Nephrol. 1993;4:1205-1213. Tattersall JE et al. Kidney Int. 1996;50:2094-2102. Daugirdas JT, Schneditz D. ASAIO J. 1995;41:M719-M724. Leypoldt JK, Jaber BL, Zimmerman DL. Semin Dial. 2004;17:142-145. Daugirdas JT et al. Kidney Int. 2010;77:637-644 (FHN stdKt/V).
- DOI: https://doi.org/10.1681/ASN.V451205
- PubMed: https://pubmed.ncbi.nlm.nih.gov/8305648/

**Limitations**

- Draw the post-BUN immediately at the end of dialysis with a slow-flow or stop-pump method to avoid access recirculation artifact (KDOQI).
- The 0.008t generation term is calibrated mainly for a midweek 3×/week session; it is less accurate for short-daily or first-of-week sessions.
- Residual Kru is added with a simple Kru×10.08/V term; Daugirdas 2010 has a more refined residual adjustment that we have not reproduced in full.

- [ ] Sign-off: Hemodialysis dose (URR & Kt/V)

---

### nPCR / nPNA

Normalized protein catabolic rate from the interdialytic BUN rise, plus the midweek Depner–Daugirdas equation.

**Equation**

```
Interdialytic (two-point, anuric approximation):
  nPCR (g/kg/day) = 0.22 + 0.864 × (BUNpre_next − BUNpost) / tid_hours
                  = 0.22 + (0.036 × ΔBUN × 24) / tid_hours     (BUN in mg/dL)
Depner–Daugirdas 1996 midweek (session 2 of 3):
  nPCR = C₀ / (25.8 + 1.15×Kt/V + 56.4/(Kt/V)) + 0.168
  C₀ = predialysis BUN, mg/dL. The 0.168 term is non-urea nitrogen.
```

**Citation**

Depner TA, Daugirdas JT. Equations for normalized protein catabolic rate based on two-point modeling of hemodialysis urea kinetics. J Am Soc Nephrol. 1996;7:780-788.
- DOI: https://doi.org/10.1681/ASN.V75780
- PubMed: https://pubmed.ncbi.nlm.nih.gov/8738814/

**Limitations**

- The interdialytic-rise formula is the form requested for this toolbox and is widely used at the chairside. The formal 1996 paper’s primary equations use predialysis BUN and Kt/V and are session-specific (Monday/Wednesday/Friday coefficients differ). We show the published midweek equation when Kt/V is entered.
- Assumes anuria (or negligible residual urea clearance) and a relatively stable volume.
- nPCR reflects protein catabolism, which equals dietary intake only in a metabolically stable patient.

- [ ] Sign-off: nPCR / nPNA

---

### Ultrafiltration rate

mL/kg/h, with the commonly cited 13 mL/kg/h threshold.

**Equation**

```
UFR (mL/kg/h) = UF (mL) / weight (kg) / session time (h)
```

**Citation**

Flythe JE, Kimmel SE, Brunelli SM. Rapid fluid removal during dialysis is associated with cardiovascular morbidity and mortality. Kidney Int. 2011;79:1110-1117.
- DOI: https://doi.org/10.1038/ki.2010.383
- PubMed: https://pubmed.ncbi.nlm.nih.gov/20927040/

**Limitations**

- The 13 mL/kg/h figure is from observational data (Flythe et al. 2011) and has been used in quality measures; it is not a proven causal safety limit for every patient. Later work has also discussed 10 mL/kg/h and risk-based thresholds.
- Weight is typically post-dialysis or prescribed target weight.

- [ ] Sign-off: Ultrafiltration rate

---

### Watson total body water (V)

Anthropometric urea-distribution volume used for Kt/V and PD Kt/V.

**Equation**

```
Male:   V = 2.447 − 0.09516×age + 0.1074×height_cm + 0.3362×weight_kg
Female: V = −2.097 + 0.1069×height_cm + 0.2466×weight_kg
```

**Citation**

Watson PE, Watson ID, Batt RD. Total body water volumes for adult males and females estimated from simple anthropometric measurements. Am J Clin Nutr. 1980;33:27-39.
- DOI: https://doi.org/10.1093/ajcn/33.1.27
- PubMed: https://pubmed.ncbi.nlm.nih.gov/7387105/

**Limitations**

- Anthropometric estimate, not a measured volume. ISPD and KDOQI commonly use Watson for PD Kt/V.
- The female equation has no age term — that is as published, not an omission.

- [ ] Sign-off: Watson total body water (V)

---

## CRRT

Effluent dose, filtration fraction, citrate ratio

### CRRT effluent dose & filtration fraction

Prescribed and predilution-corrected dose vs KDIGO 20–25 mL/kg/h, plus FF.

**Equation**

```
Qeff (mL/h) = Qd + Qpre + Qpost + Qnet
Qp = Qb (mL/min) × 60 × (1 − Hct)
Predilution DF = Qp / (Qp + Qpre)    (DF = 1 if Qpre = 0)
Corrected dose (mL/kg/h) = (Qeff × DF) / weight_kg     (urea sieving coefficient ≈ 1)
CVVHD: Quf for FF = Qnet only.  CVVH / CVVHDF: Quf = Qpre + Qpost + Qnet
FF_post = Quf / Qp;    FF_pre = Quf / (Qp + Qpre)
KDIGO AKI 2012: deliver 20–25 mL/kg/h (usually requires a higher prescription).
```

**Citation**

KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2:1-138 (recommendation 5.8.3). Evidence: Palevsky PM et al. (ATN). N Engl J Med. 2008;359:7-20. Bellomo R et al. (RENAL). N Engl J Med. 2009;361:1627-1638. Predilution and FF: Macedo E, Mehta RL. Continuous dialysis therapies: Core Curriculum 2016. Am J Kidney Dis. 2016.
- DOI: https://doi.org/10.1038/kisup.2011.32

**Limitations**

- This is the prescribed (or instantaneous) dose. Delivered dose is lower because of downtime. KDIGO explicitly says a higher prescription is usually required to deliver 20–25 mL/kg/h.
- We do not apply a 0.93 plasma-water correction; some authors do. FF caution of 20–25% is practice-based (filter life), not a KDIGO numeric target.
- Hematocrit may be entered as a percent (30) or a fraction (0.30).

- [ ] Sign-off: CRRT effluent dose & filtration fraction

---

### Citrate / calcium ratio

Total-to-ionized calcium ratio as a marker of citrate accumulation.

**Equation**

```
Ratio = total calcium (mmol/L) / ionized calcium (mmol/L)
Total Ca mg/dL ÷ 4 = mmol/L.
Meier-Kriesche cutoff: ratio > 2.5 suggests citrate accumulation. A caution threshold of 2.1 is also used.
```

**Citation**

Meier-Kriesche HU, Gitomer J, Finkel K, DuBose T. Increased total to ionized calcium ratio during continuous venovenous hemodialysis with regional citrate anticoagulation. Crit Care Med. 2001;29:748-752.
- DOI: https://doi.org/10.1097/00003246-200104000-00010
- PubMed: https://pubmed.ncbi.nlm.nih.gov/11373461/

**Limitations**

- The 2.5 cutoff was derived with uncorrected total calcium. Do not apply it uncritically to albumin-corrected total calcium.
- A rising ratio, falling ionized calcium despite increased calcium infusion, and rising anion gap / falling HCO₃ also suggest accumulation, especially in liver failure.
- Confirm contemporaneous draws and that units are not mixed up (the usual lab mix is total in mg/dL and ionized in mmol/L — this calculator converts them).

- [ ] Sign-off: Citrate / calcium ratio

---

## Peritoneal dialysis

Weekly Kt/V, CrCl, PET, residual kidney function

### PD adequacy (weekly Kt/V & CrCl)

Peritoneal plus residual weekly urea Kt/V (Watson V) and creatinine clearance (Mosteller BSA).

**Equation**

```
Peritoneal daily Kt (L) = (D/P urea) × 24-h drain volume (L)
Renal daily Kt (L)     = (U/P urea) × 24-h urine volume (L)
Weekly Kt/V = 7 × (Ktp + Ktr) / V_Watson
Peritoneal CrCl (L/week) = (D/P Cr) × drain (L) × 7
RKF (L/week) = 0.5 × (renal Curea + renal Ccr) × 7
Report CrCl as L/week/1.73 m² = (L/week) × 1.73 / BSA
Mosteller BSA (default) = √(height_cm × weight_kg / 3600)
DuBois BSA = 0.007184 × weight^0.425 × height^0.725
```

**Citation**

ISPD 2020: Brown EA, Blake PG, et al. International Society for Peritoneal Dialysis practice recommendations: Prescribing high-quality goal-directed peritoneal dialysis. Perit Dial Int. 2020;40:323-329. Earlier adequacy target (Kt/V 1.7): Lo WK et al. ISPD guidelines. Perit Dial Int. 2006. Watson: Am J Clin Nutr. 1980. Mosteller RD. N Engl J Med. 1987;317:1098. Du Bois D, Du Bois EF. Arch Intern Med. 1916;17:863-871.
- DOI: https://doi.org/10.1177/0896860819895364
- PubMed: https://pubmed.ncbi.nlm.nih.gov/32063220/

**Limitations**

- ISPD 2020 emphasizes quality of life and volume status over a single Kt/V cutoff. The 1.7 weekly Kt/V urea figure is a historical reference from earlier ISPD / KDOQI guidance, still widely cited.
- Use 24-hour collections of dialysate and urine. Plasma urea and creatinine should be measured on the same day.
- Watson V and Mosteller BSA are estimates. We state Mosteller as the default and also report DuBois BSA for comparison.

- [ ] Sign-off: PD adequacy (weekly Kt/V & CrCl)

---

### PET (peritoneal equilibration test)

4-hour D/P creatinine and D/D0 glucose with Twardowski transporter categories.

**Equation**

```
D/P creatinine (4 h) = dialysate Cr / plasma Cr
D/D0 glucose (4 h) = dialysate glucose at 4 h / instilled (0-h) glucose
Twardowski 1987 4-h D/P Cr bands: Low 0.34–0.49; LA 0.50–0.64; HA 0.65–0.81; High 0.82–1.03.
4-h D/D0 glucose bands: High 0.12–0.26; HA 0.27–0.38; LA 0.39–0.49; Low 0.50–0.61.
```

**Citation**

Twardowski ZJ, Nolph KD, Khanna R, et al. Peritoneal equilibration test. Perit Dial Bull. 1987;7:138-147. ISPD 2021 membrane function: Morelle J et al. ISPD recommendations for the evaluation of peritoneal membrane dysfunction in adults. Perit Dial Int. 2021.
- DOI: https://doi.org/10.1177/0896860820982218
- PubMed: https://pubmed.ncbi.nlm.nih.gov/33563110/

**Limitations**

- Use a standard 2.5% (or 2.27%) 4-hour PET as originally described. Correct dialysate creatinine for glucose interference if the lab requires it.
- ISPD 2021 advises interpreting 4-h D/P creatinine relative to the local laboratory and centre distribution; the Twardowski bands are historical and remain the most widely taught cutoffs.
- Judgment: some manuals list the high-average / low-average D/D0 boundary as 0.37 rather than 0.38. We use 0.38 as the top of high-average.

- [ ] Sign-off: PET (peritoneal equilibration test)

---

### Residual kidney function

Mean of urea and creatinine clearance from a timed urine collection.

**Equation**

```
Curea (mL/min) = (U/P urea) × Vurine (mL) / time (min)
Ccr (mL/min)   = (U/P Cr) × Vurine (mL) / time (min)
RKF = ½ × (Curea + Ccr)
L/week = RKF (mL/min) × 10.08;    L/week/1.73 m² = L/week × 1.73 / BSA_Mosteller
```

**Citation**

Standard ISPD / KDOQI PD adequacy practice (mean of residual urea and creatinine clearance). ISPD 2020 prescribing recommendations: Brown EA et al. Perit Dial Int. 2020;40:323-329.
- DOI: https://doi.org/10.1177/0896860819895364

**Limitations**

- Creatinine clearance alone overestimates residual GFR because of tubular creatinine secretion; urea clearance underestimates it. The mean is the usual compromise.
- A complete 24-hour urine collection is required. Inaccurate volume is the main error.

- [ ] Sign-off: Residual kidney function

---

## Judgment calls and source disagreements

These are documented in the app and in the formula comments. Please pay particular attention when reviewing.

1. **KFRE “North American recalibrated” coefficients.** The 2016 JAMA multinational paper found that the *original* Tangri 2011 (Canadian) coefficients were adequately calibrated in North American cohorts. A downward recalibration of baseline risk was proposed for many *non*-North-American cohorts. This app uses the original North American coefficients and baseline survival:
   - 4-variable S₀: 2-year **0.9750**, 5-year **0.9240**
   - 8-variable S₀: 2-year **0.9780**, 5-year **0.9301**
   - ACR is in **mg/g** (centering constant 5.137 ≈ ln(170 mg/g)).
   Some websites list S₀ = 0.9240 (2-year) / 0.7762 (5-year); those values do not match kidneyfailurerisk.com or the standard kfre implementations of Tangri 2011/2016, and we did not use them.

2. **CKD-EPI 2012 cystatin C age base.** The published 2012 equation and the NKF page use **0.996^age**. Inker 2021 Table 2 lists 0.9962 (95% CI 0.9957–0.9966) as a more precise fit of the same model. We use **0.996**.

3. **Equilibrated Kt/V.** We compute **both** Tattersall (`t/(t+35)` minutes, or +22 for a catheter) and the Daugirdas–Schneditz **rate equations**, and we say which is which. Standard weekly Kt/V is calculated from the **Tattersall** eKt/V.

4. **Standard weekly Kt/V.** The primary value is the **Leypoldt 2004** fixed-volume formula. When session UF and V are entered, we also show the **FHN / Daugirdas 2010** variable-volume adjustment, `Leypoldt / (1 − 0.74 × UF_session / V)`, which is typically about 7% higher and is the basis of the KDOQI 2015 target of 2.1. Residual Kru is added with a simple `Kru × 10.08 / V` term, not the full refined residual term from Daugirdas 2010.

5. **nPCR.** The chairside **interdialytic BUN-rise** formula (`0.22 + 0.864 × ΔBUN / hours`) is the primary result, as requested. The formal Depner–Daugirdas 1996 paper’s midweek equation (`C₀ / (25.8 + 1.15 Kt/V + 56.4/(Kt/V)) + 0.168`) is shown when Kt/V is entered. Monday and Friday session-specific 1996 coefficients are not implemented (only the well-documented midweek set).

6. **Albumin-corrected anion gap.** We use Figge 1998: **2.5 mEq/L per 1 g/dL** below a normal albumin of **4.4 g/dL**. Some authors use 4.0 g/dL or a factor of 3.0.

7. **Osmolal gap.** We use the conventional **2×Na + glucose/18 + BUN/2.8** (Worthley). The Dorwart–Chalmers formula is an alternative and is not used.

8. **Free-water deficit TBW fractions.** Adult men 0.60, adult women 0.50, elderly men 0.50, elderly women 0.45 (Adrogué & Madias teaching). **Elderly is taken as age ≥ 65**, a common convention; the NEJM review does not set a hard cutoff.

9. **Delta–delta cutoffs.** Rastegar-style teaching: <0.4 NAGMA-predominant; 0.4–0.8 mixed; 0.8–2.0 pure HAGMA; >2 mixed with metabolic alkalosis. Some authors use 1–2 as the pure-HAGMA band.

10. **Metabolic alkalosis compensation.** We use **0.7 mmHg per 1 mEq** HCO₃ above 24 (±5). Alternatives (0.6, or 0.9×HCO₃+9) exist.

11. **Chronic respiratory compensation.** Chronic respiratory acidosis: **0.35** (3.5 per 10 mmHg); some use 0.4. Chronic respiratory alkalosis: **0.5** (5 per 10); some use 0.4.

12. **PET D/D0 boundary.** We use **0.38** as the top of the high-average D/D0 glucose band. Some lab manuals list 0.37. ISPD 2021 prefers local reference ranges over these historical Twardowski bands.

13. **24-hour protein/albumin estimate.** Primary: Ginsberg (ratio in g/g ≈ g/day). Optional: Walser race-free creatinine-excretion equation. We do **not** use the Ix 2011 CKD-EPI CER equation because it includes a Black race term.

14. **PD CrCl BSA.** **Mosteller** is the default (stated); DuBois is also computed for comparison.

15. **CRRT plasma flow.** We use `Qp = Qb × 60 × (1 − Hct)` **without** a further 0.93 plasma-water factor. Filtration-fraction caution of 20–25% is practice-based, not a KDIGO numeric target. Citrate ratio cutoff **2.5** is Meier-Kriesche 2001; **2.1** is shown as a more sensitive caution threshold.

16. **Cockcroft–Gault weight.** The **0.4** adjusted-body-weight factor is conventional (Winter et al. discuss weight selection) and is not in the 1976 paper. Devine IBW is flagged when height is under 5 feet.

17. **Winter’s formula citation.** Albert, Dell, Winters, *Ann Intern Med* 1967 (the paper usually cited as Winter’s formula). PMID 6016545 as commonly indexed.

Please also confirm that you are comfortable with KDIGO G and A category labels being shown as interpretive chips (staging aids, not diagnoses).

## Overall sign-off

- [ ] I have reviewed every formula in this document and in the draft app.
- [ ] I approve setting `DRAFT=false` and removing the draft banner. *(Do not check this until you are ready for clinical use.)*

Signed: ______________________  Date: __________
