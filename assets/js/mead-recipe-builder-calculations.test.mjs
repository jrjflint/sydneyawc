import assert from 'node:assert/strict';
import {
  calculateMeadRecipe,
} from './mead-recipe-builder-calculations.mjs';

const nearly = (actual, expected, tolerance = 0.005) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
};

const benchmark = calculateMeadRecipe({
  batchVolumeLitres: 20,
  targetAbvPercent: 12,
  targetFinalGravity: 1.01,
  honeySugarPercent: 79.6,
});

assert.equal(benchmark.ok, true);
nearly(benchmark.values.targetOg, 1.101, 0.001);
nearly(benchmark.values.startingBrix, 24.1, 0.05);
nearly(benchmark.values.honeyKg, 6.64, 0.01);
nearly(benchmark.values.residualSugarGL, 26.5, 0.01);
nearly(benchmark.values.yeastGrams, 6, 0.001);
nearly(benchmark.values.goFermGrams, 7.5, 0.001);
nearly(benchmark.values.rehydrationWaterMl, 150, 0.001);
nearly(benchmark.values.fermaidAtTotalGrams, 7, 0.001);
nearly(benchmark.values.oneThirdSugarBreakSg, 1.068, 0.001);

for (const targetFinalGravity of [1.0, 1.02, 1.05]) {
  const result = calculateMeadRecipe({
    batchVolumeLitres: 10,
    targetAbvPercent: 10,
    targetFinalGravity,
  });
  assert.equal(result.ok, true);
  assert.equal(result.values.targetFinalGravity, targetFinalGravity);
}

const customFinalGravity = calculateMeadRecipe({
  batchVolumeLitres: 10,
  targetAbvPercent: 10,
  targetFinalGravity: 1.012,
});
assert.equal(customFinalGravity.ok, true);
assert.equal(customFinalGravity.values.targetFinalGravity, 1.012);

const lowerSugarHoney = calculateMeadRecipe({
  batchVolumeLitres: 20,
  targetAbvPercent: 12,
  targetFinalGravity: 1.01,
  honeySugarPercent: 70,
});
assert.equal(lowerSugarHoney.ok, true);
assert.ok(lowerSugarHoney.values.honeyKg > benchmark.values.honeyKg);

const shareableLargeBatch = calculateMeadRecipe({
  batchVolumeLitres: 225,
  targetAbvPercent: 13,
  targetFinalGravity: 1.0,
  honeySugarPercent: 79.6,
});
assert.equal(shareableLargeBatch.ok, true);
nearly(shareableLargeBatch.values.targetOg, 1.099, 0.001);
nearly(shareableLargeBatch.values.startingBrix, 23.6, 0.05);
nearly(shareableLargeBatch.values.honeyKg, 72.91, 0.01);
nearly(shareableLargeBatch.values.fermaidAtTotalGrams, 78.75, 0.001);

const invalid = calculateMeadRecipe({
  batchVolumeLitres: 0,
  targetAbvPercent: 26,
  targetFinalGravity: 1.2,
  honeySugarPercent: 50,
});
assert.equal(invalid.ok, false);
assert.equal(invalid.values, null);
assert.deepEqual(
  invalid.errors.map((error) => error.field).sort(),
  [
    'batchVolumeLitres',
    'honeySugarPercent',
    'targetAbvPercent',
    'targetFinalGravity',
  ].sort()
);

const oddVolume = calculateMeadRecipe({
  batchVolumeLitres: 19.3,
  targetAbvPercent: 11,
  targetFinalGravity: 1.02,
});
assert.equal(oddVolume.ok, true);
const additionTotal = oddVolume.values.fermaidAtAdditionsGrams.reduce(
  (sum, dose) => sum + dose,
  0
);
const roundedTotal =
  Math.round((oddVolume.values.fermaidAtTotalGrams + Number.EPSILON) * 100) /
  100;
nearly(additionTotal, roundedTotal);

console.log('mead recipe builder calculations passed');
