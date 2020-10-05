// External libs.
import { forceManyBody, forceX, forceY } from 'd3-force';

// Internal modules.
import state from '../app/state';
import { sim } from './stats';

// Individual simulations:

// Move to Alcohol scatter.
const chargeScatter = forceManyBody().strength(-0.5);
const xPosQualAlc = forceX(d => d.layout.alcohol__quality.x).strength(0.3);
const yPosQualAlc = forceY(d => d.layout.alcohol__quality.y).strength(0.3);

function simulateQualAlc() {
  state.stats.current = [
    { name: 'alcohol', axis: 'x', straight: true, header: false, label: true },
    { name: 'quality', axis: 'y', straight: true, header: false, label: true },
  ];

  sim
    .nodes(state.stats.data)
    .force('chargeFrequencies', null)
    .force('chargeScatter', chargeScatter)
    .force('xAlcohol', null)
    .force('yAlcohol', null)
    .force('xPosQualAlc', xPosQualAlc)
    .force('yPosQualAlc', yPosQualAlc)
    .force('xPosQualVol', null)
    .force('yPosQualVol', null)
    .alpha(0.8)
    .restart();
}

// Move to Volatile Acidity scatter.
const xPosQualVol = forceX(d => d.layout.vol_acid__quality.x).strength(0.3);
const yPosQualVol = forceY(d => d.layout.vol_acid__quality.y).strength(0.3);

function simulateQualVol() {
  state.stats.current = [
    {
      name: 'volatile_acidity',
      axis: 'x',
      straight: true,
      header: false,
      label: true,
    },
    { name: 'quality', axis: 'y', straight: true, header: false, label: true },
  ];

  sim
    .nodes(state.stats.data)
    .force('chargeFrequencies', null)
    .force('chargeScatter', chargeScatter)
    .force('xPosQualAlc', null)
    .force('yPosQualAlc', null)
    .force('xPosQualVol', xPosQualVol)
    .force('yPosQualVol', yPosQualVol)
    .alpha(0.8)
    .restart();
}

export { simulateQualAlc, simulateQualVol };
