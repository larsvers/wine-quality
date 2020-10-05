// External libs.
import { forceManyBody, forceX, forceY } from 'd3-force';

// Internal modules.
import state from '../app/state';
import { sim } from './stats';

// Individual simulations:

// Move to Alcohol frequency.
const chargeScatter = forceManyBody().strength(0);
const xPosQualAlc = forceX(d => d.layout.qualAlc.x).strength(1);
const yPosQualAlc = forceY(d => d.layout.qualAlc.y).strength(1);

function simulateQualAlc() {
  state.stats.current = [
    { name: 'quality', axis: 'x', straight: true },
    { name: 'alcohol', axis: 'y', straight: true },
  ];

  sim
    .nodes(state.stats.data)
    .force('chargeFrequencies', null)
    .force('chargeScatter', chargeScatter)
    .force('xAlcohol', null)
    .force('yAlcohol', null)
    .force('xPosQualAlc', xPosQualAlc)
    .force('yPosQualAlc', yPosQualAlc)
    .alpha(0.8)
    .restart();
}

export { simulateQualAlc };
