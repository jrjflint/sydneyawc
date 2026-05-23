import {
  calculateMeadRecipe,
} from './mead-recipe-builder-calculations.mjs';

const formatters = {
  sg: new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
  oneDecimal: new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  twoDecimal: new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  whole: new Intl.NumberFormat('en-AU', {
    maximumFractionDigits: 0,
  }),
};

const outputFormatters = {
  'target-og': (value) => formatters.sg.format(value.targetOg),
  'starting-brix': (value) => formatters.oneDecimal.format(value.startingBrix),
  'sugar-break': (value) => formatters.sg.format(value.oneThirdSugarBreakSg),
  'residual-sugar': (value) =>
    `${formatters.twoDecimal.format(value.residualSugarGL)} g/L`,
  'honey-mass': (value) => `${formatters.twoDecimal.format(value.honeyKg)} kg`,
  'honey-volume': (value) =>
    `${formatters.twoDecimal.format(value.honeyVolumeLitres)} L`,
  'top-up-water': (value) =>
    `${formatters.twoDecimal.format(value.topUpWaterLitres)} L`,
  'yeast-mass': (value) =>
    `${formatters.twoDecimal.format(value.yeastGrams)} g`,
  'go-ferm': (value) => `${formatters.twoDecimal.format(value.goFermGrams)} g`,
  'rehydration-water': (value) =>
    `${formatters.whole.format(value.rehydrationWaterMl)} mL`,
  'fermaid-at': (value) =>
    `${formatters.twoDecimal.format(value.fermaidAtTotalGrams)} g`,
};

const pendingText = 'Pending calculation';
const shareParamNames = ['volume', 'abv', 'fg', 'honeySugar'];

const getNumber = (form, name) => {
  const field = form.elements.namedItem(name);
  if (!field) {
    return Number.NaN;
  }
  return Number.parseFloat(field.value);
};

const setError = (form, fieldName, message) => {
  const field = form.elements.namedItem(fieldName);
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (!field || !error) {
    return;
  }

  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  error.textContent = message || '';
};

const clearErrors = (form) => {
  Array.from(form.querySelectorAll('[aria-invalid]')).forEach((field) => {
    field.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('[data-error-for]').forEach((error) => {
    error.textContent = '';
  });
};

const setOutput = (outputs, key, text) => {
  const output = outputs[key];
  if (output) {
    output.textContent = text;
  }
};

const resetOutputs = (outputs) => {
  Object.keys(outputs).forEach((key) => setOutput(outputs, key, pendingText));
  document.querySelectorAll('[data-fermaid-dose]').forEach((element) => {
    element.textContent = pendingText;
  });
  const goFermInstruction = document.querySelector('[data-go-ferm-instruction]');
  if (goFermInstruction) {
    goFermInstruction.textContent =
      'Dissolve the calculated Go-Ferm Protect dose in the calculated hot water volume, then cool before adding yeast.';
  }
  const fermaidInstruction = document.querySelector(
    '[data-fermaid-instruction]'
  );
  if (fermaidInstruction) {
    fermaidInstruction.textContent =
      'Total Fermaid AT will appear once the batch inputs are valid.';
  }
};

const renderFermaidSchedule = (values) => {
  const labels = ['24 hours', '48 hours', '72 hours', 'One-third sugar break'];
  document.querySelectorAll('[data-fermaid-dose]').forEach((element, index) => {
    const dose = values.fermaidAtAdditionsGrams[index];
    element.textContent = `${labels[index]}: ${formatters.twoDecimal.format(
      dose
    )} g Fermaid AT`;
  });
};

const renderResult = (outputs, result) => {
  const values = result.values;
  Object.entries(outputFormatters).forEach(([key, formatter]) => {
    setOutput(outputs, key, formatter(values));
  });
  renderFermaidSchedule(values);

  const goFermInstruction = document.querySelector('[data-go-ferm-instruction]');
  if (goFermInstruction) {
    goFermInstruction.textContent = `Dissolve ${formatters.twoDecimal.format(
      values.goFermGrams
    )} g Go-Ferm Protect in ${formatters.whole.format(
      values.rehydrationWaterMl
    )} mL hot water, then cool before adding yeast.`;
  }

  const fermaidInstruction = document.querySelector(
    '[data-fermaid-instruction]'
  );
  if (fermaidInstruction) {
    fermaidInstruction.textContent = `Total Fermaid AT for this schedule is ${formatters.twoDecimal.format(
      values.fermaidAtTotalGrams
    )} g, split across four staggered additions.`;
  }
};

const setIfPresent = (form, fieldName, value) => {
  const field = form.elements.namedItem(fieldName);
  if (field && value !== null) {
    field.value = value;
  }
};

const applyUrlParams = (form) => {
  const params = new URLSearchParams(window.location.search);
  setIfPresent(form, 'batchVolumeLitres', params.get('volume'));
  setIfPresent(form, 'targetAbvPercent', params.get('abv'));
  setIfPresent(form, 'honeySugarPercent', params.get('honeySugar'));
  setIfPresent(form, 'targetFinalGravity', params.get('fg'));
};

const formatUrlNumber = (value) => {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) {
    return '';
  }
  return String(number);
};

const updateShareUrl = (form) => {
  const url = new URL(window.location.href);
  shareParamNames.forEach((name) => url.searchParams.delete(name));

  const volume = formatUrlNumber(form.elements.namedItem('batchVolumeLitres')?.value);
  const abv = formatUrlNumber(form.elements.namedItem('targetAbvPercent')?.value);
  const fg = formatUrlNumber(form.elements.namedItem('targetFinalGravity')?.value);
  const honeySugar = formatUrlNumber(form.elements.namedItem('honeySugarPercent')?.value);

  if (volume) url.searchParams.set('volume', volume);
  if (abv) url.searchParams.set('abv', abv);
  if (fg) url.searchParams.set('fg', fg);
  if (honeySugar) url.searchParams.set('honeySugar', honeySugar);

  window.history.replaceState({}, '', url);
  return url.toString();
};

const setupShareButton = (form) => {
  const button = document.querySelector('[data-copy-share-link]');
  const status = document.querySelector('[data-share-status]');
  if (!button) {
    return;
  }

  button.addEventListener('click', async () => {
    const shareUrl = updateShareUrl(form);
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (status) {
        status.textContent = 'Share link copied.';
      }
    } catch (error) {
      if (status) {
        status.textContent = 'Copy the URL from your browser address bar to share this recipe.';
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('meadBuilderForm');
  if (!form) {
    return;
  }

  const outputs = Array.from(document.querySelectorAll('[data-output]')).reduce(
    (accumulator, element) => {
      accumulator[element.dataset.output] = element;
      return accumulator;
    },
    {}
  );

  applyUrlParams(form);
  setupShareButton(form);

  const update = () => {
    clearErrors(form);

    const result = calculateMeadRecipe({
      batchVolumeLitres: getNumber(form, 'batchVolumeLitres'),
      targetAbvPercent: getNumber(form, 'targetAbvPercent'),
      targetFinalGravity: getNumber(form, 'targetFinalGravity'),
      honeySugarPercent: getNumber(form, 'honeySugarPercent'),
    });

    if (!result.ok) {
      resetOutputs(outputs);
      result.errors.forEach((error) => {
        setError(form, error.field, error.message);
      });
      updateShareUrl(form);
      return;
    }

    renderResult(outputs, result);
    updateShareUrl(form);
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  update();
});
