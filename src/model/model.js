import isequal from 'lodash.isequal';
import { select } from 'd3-selection';

import state from '../app/state';

/**
 * Calculates the Logistic Regression probability for the
 * given values based on the given model parameters.
 * @param { map } values map of the values
 * @param { map } weights map of the weights
 * @param { number } intercept the model intercept
 */
function getProbability(values, weights, intercept) {
  const check = isequal(values.keys(), weights.keys());
  if (!check) throw Error('values and weights are not equal.');

  let logOdds = intercept;
  values.keys().forEach(variable => {
    logOdds += values.get(variable) * weights.get(variable);
  });

  const odds = Math.exp(logOdds);
  const prob = odds / (1 + odds);
  return prob;
}

// TODO add to init module.
function initModelControls() {
  select('#text-wrap')
    .insert('div', '.section-0')
    .attr('id', 'model-app')
    .append('div')
    .attr('id', 'model-app-wrap');
}

function buildControl(sel) {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const { key: variable, value } = sel.datum();

  // Build the density
}

function buildModelControls() {
  initModelControls();

  // TODO Change this: We want as many divs as there are
  // variables. Each div gets a little svg with the density chart
  // controls. The div's will be arranged with flex box.
  // The svg sizes will be dependent on the div's dimensions.

  // Minimial case: 2 columns and 6 columns.

  select('#model-app').style('height', `${state.height}px`);

  select('#model-app-wrap')
    .selectAll('.model-value-control')
    .data(state.model.values.entries())
    .join('div')
    .attr('class', 'model-value-control')
    .style('width', `${Math.min(200, state.width / 2)}px`)
    .style('height', `${100}px`)
    .call(buildControl);

  // console.log(Math.min(200, state.width / 2));
  // console.log(state.width / 2);
}

export { getProbability, buildModelControls };
