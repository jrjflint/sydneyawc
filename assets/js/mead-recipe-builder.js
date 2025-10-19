'use strict';

/**
 * Prototype scaffolding for the metric mead recipe builder.
 * The calculation engine will be implemented in a future update.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('meadBuilderForm');
  if (!form) {
    return;
  }

  const pendingOutputs = document.querySelectorAll('[data-output]');

  form.addEventListener('input', () => {
    pendingOutputs.forEach((output) => {
      if (output.dataset.output === 'fermaid-schedule') {
        output.textContent = 'Fermaid AT scheduling coming soon';
        return;
      }
      output.textContent = 'Calculations coming soon';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
});
