'use strict';

/**
 * Metric mead recipe builder calculations.
 * Currently supports gravity targets and honey planning.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('meadBuilderForm');
  if (!form) {
    return;
  }

  const outputs = Array.from(document.querySelectorAll('[data-output]')).reduce(
    (accumulator, element) => {
      accumulator[element.dataset.output] = {
        element,
        defaultText: element.textContent.trim(),
      };
      return accumulator;
    },
    {}
  );

  const formatters = {
    sg: new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    mass: new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };

  const ABV_TO_GRAVITY_POINTS = 131.25;
  const SUGAR_POINTS_PER_KG_PER_LITRE = 384;
  const HONEY_SUGAR_FRACTION = 0.796;
  const DEFAULT_HONEY_CONTRIBUTION =
    HONEY_SUGAR_FRACTION * SUGAR_POINTS_PER_KG_PER_LITRE;

  const getNumericInput = (name) => {
    const input = form.elements.namedItem(name);
    if (!input) {
      return Number.NaN;
    }
    const value = Number.parseFloat(input.value);
    return Number.isFinite(value) ? value : Number.NaN;
  };

  const setOutput = (key, value) => {
    const target = outputs[key];
    if (!target) {
      return;
    }
    if (value === null) {
      target.element.textContent = target.defaultText;
      return;
    }
    target.element.textContent = value;
  };

  const updateOutputs = () => {
    const volumeLitres = getNumericInput('batchVolume');
    const targetAbv = getNumericInput('targetAbv');
    const targetFg = getNumericInput('targetFg');
    const honeyContributionInput = getNumericInput('honeyContribution');

    let targetOg = Number.NaN;
    if (Number.isFinite(targetAbv) && Number.isFinite(targetFg)) {
      targetOg = targetFg + targetAbv / ABV_TO_GRAVITY_POINTS;
      if (targetOg < 1) {
        targetOg = 1;
      }
      setOutput('target-og', formatters.sg.format(targetOg));
    } else {
      setOutput('target-og', null);
    }

    const honeyContribution = Number.isFinite(honeyContributionInput)
      ? honeyContributionInput
      : DEFAULT_HONEY_CONTRIBUTION;

    if (
      Number.isFinite(volumeLitres) &&
      volumeLitres > 0 &&
      Number.isFinite(targetOg) &&
      targetOg > 1 &&
      Number.isFinite(honeyContribution) &&
      honeyContribution > 0
    ) {
      const gravityPoints = (targetOg - 1) * 1000;
      const honeyMassKg = (gravityPoints * volumeLitres) / honeyContribution;
      setOutput('honey-mass', formatters.mass.format(honeyMassKg));
    } else {
      setOutput('honey-mass', null);
    }

    setOutput('residual-sugar', null);
    setOutput('yeast-mass', null);
    setOutput('go-ferm', null);
    setOutput('fermaid-at', null);
  };

  form.addEventListener('input', updateOutputs);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  updateOutputs();
});
