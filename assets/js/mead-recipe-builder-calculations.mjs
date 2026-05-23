const ABV_TO_GRAVITY_POINTS = 131.25;
const SUGAR_POINTS_PER_KG_PER_LITRE = 384;
const DEFAULT_HONEY_SUGAR_PERCENT = 79.6;
const DEFAULT_HONEY_DENSITY_KG_PER_LITRE = 1.42;
const RESIDUAL_SUGAR_MULTIPLIER = 2.65;
const YEAST_G_PER_LITRE = 0.3;
const GO_FERM_RATIO = 1.25;
const REHYDRATION_WATER_ML_PER_GO_FERM_G = 20;
const FERMAID_AT_G_PER_LITRE = 0.35;

const roundTo = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
};

const addRangeError = (errors, field, message) => {
  errors.push({ field, message });
};

const splitRoundedAdditions = (total, parts, decimals) => {
  const roundedTotal = roundTo(total, decimals);
  const baseDose = roundTo(roundedTotal / parts, decimals);
  const doses = Array.from({ length: parts }, () => baseDose);
  const firstDosesTotal = doses
    .slice(0, -1)
    .reduce((sum, dose) => sum + dose, 0);
  doses[doses.length - 1] = roundTo(roundedTotal - firstDosesTotal, decimals);
  return doses;
};

export const SWEETNESS_PRESETS = Object.freeze({
  dry: 1.0,
  semiSweet: 1.02,
  sweet: 1.05,
});

export function calculateMeadRecipe(input) {
  const batchVolumeLitres = toNumber(input?.batchVolumeLitres);
  const targetAbvPercent = toNumber(input?.targetAbvPercent);
  const targetFinalGravity = toNumber(input?.targetFinalGravity);
  const honeySugarPercent = toNumber(
    input?.honeySugarPercent ?? DEFAULT_HONEY_SUGAR_PERCENT
  );
  const honeyDensityKgPerLitre = toNumber(
    input?.honeyDensityKgPerLitre ?? DEFAULT_HONEY_DENSITY_KG_PER_LITRE
  );

  const errors = [];

  if (!(batchVolumeLitres > 0) || batchVolumeLitres > 200) {
    addRangeError(
      errors,
      'batchVolumeLitres',
      'Enter a batch volume greater than 0 L and no more than 200 L.'
    );
  }

  if (!(targetAbvPercent > 0) || targetAbvPercent > 25) {
    addRangeError(
      errors,
      'targetAbvPercent',
      'Enter a target ABV greater than 0% and no more than 25%.'
    );
  }

  if (targetFinalGravity < 0.99 || targetFinalGravity > 1.08) {
    addRangeError(
      errors,
      'targetFinalGravity',
      'Enter a final gravity between 0.990 and 1.080 SG.'
    );
  }

  if (honeySugarPercent < 60 || honeySugarPercent > 90) {
    addRangeError(
      errors,
      'honeySugarPercent',
      'Enter a honey sugar percentage between 60% and 90%.'
    );
  }

  if (honeyDensityKgPerLitre < 1.2 || honeyDensityKgPerLitre > 1.6) {
    addRangeError(
      errors,
      'honeyDensityKgPerLitre',
      'Enter a honey density between 1.20 and 1.60 kg/L.'
    );
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      values: null,
    };
  }

  const targetOg =
    targetFinalGravity + targetAbvPercent / ABV_TO_GRAVITY_POINTS;
  const startingBrix =
    182.4601 * targetOg ** 3 -
    775.6821 * targetOg ** 2 +
    1262.7794 * targetOg -
    669.5622;
  const honeyGravityContribution =
    SUGAR_POINTS_PER_KG_PER_LITRE * (honeySugarPercent / 100);
  const gravityPoints = (targetOg - 1) * 1000;
  const honeyKg =
    (gravityPoints * batchVolumeLitres) / honeyGravityContribution;
  const honeyVolumeLitres = honeyKg / honeyDensityKgPerLitre;
  const residualSugarGL = Math.max(
    0,
    (targetFinalGravity - 1) * 1000 * RESIDUAL_SUGAR_MULTIPLIER
  );
  const yeastGrams = batchVolumeLitres * YEAST_G_PER_LITRE;
  const goFermGrams = yeastGrams * GO_FERM_RATIO;
  const rehydrationWaterMl = goFermGrams * REHYDRATION_WATER_ML_PER_GO_FERM_G;
  const rehydrationWaterLitres = rehydrationWaterMl / 1000;
  const topUpWaterLitres = Math.max(
    0,
    batchVolumeLitres - honeyVolumeLitres - rehydrationWaterLitres
  );
  const fermaidAtTotalGrams = batchVolumeLitres * FERMAID_AT_G_PER_LITRE;
  const fermaidAtAdditionsGrams = splitRoundedAdditions(
    fermaidAtTotalGrams,
    4,
    2
  );
  const oneThirdSugarBreakSg = 1 + ((targetOg - 1) * 2) / 3;

  return {
    ok: true,
    errors: [],
    values: {
      batchVolumeLitres,
      targetAbvPercent,
      targetFinalGravity,
      honeySugarPercent,
      honeyDensityKgPerLitre,
      targetOg,
      startingBrix,
      residualSugarGL,
      honeyKg,
      honeyVolumeLitres,
      topUpWaterLitres,
      yeastGrams,
      goFermGrams,
      rehydrationWaterMl,
      fermaidAtTotalGrams,
      fermaidAtAdditionsGrams,
      oneThirdSugarBreakSg,
    },
  };
}
