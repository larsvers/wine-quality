import isequal from 'lodash.isequal';
import { select } from 'd3-selection';

import state from '../app/state';
import buildControl from './densityControl';

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
  const modelApp = select('#text-wrap')
    .selectAll('#model-app') // Won't need this when
    .data([1]) // we move this to init.
    .enter() // ------------------------------------
    .insert('div', '.section-0')
    .attr('id', 'model-app');

  modelApp.append('div').attr('id', 'model-app-header');
  modelApp.append('div').attr('id', 'model-app-wrap');
}

function buildModelControls() {
  initModelControls();

  select('#model-app').style('height', `${state.height}px`);

  // Sort the controls by their variable importance.
  const order = state.varImp.data.map(d => d.variable);
  const controlData = state.model.values.entries();
  controlData.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  // Mount the app.
  select('#model-app-wrap')
    .selectAll('.model-value-control')
    .data(controlData)
    .join('div')
    .attr('class', 'model-value-control')
    .style('width', `${Math.min(200, state.width * 0.475)}px`) // 1
    .style('height', `${100}px`)
    .each(buildControl);
}

export { getProbability, buildModelControls };

// 1. We want at least 2 controls sided by side.
//    Hence the minimum would be 0.5% of the width.
//    However, we give it a little leeway here with 0.475
