import { select } from 'd3-selection';

import state from '../app/state';
import buildControl from './densityControl';

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
    .each(buildControl);
}

export default buildModelControls;

// 1. We want at least 2 controls sided by side.
//    Hence the minimum would be 0.5% of the width.
//    However, we give it a little leeway here with 0.475
