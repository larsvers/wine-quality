// External libs.
import gsap from 'gsap/gsap-core';
import { forceLink, forceManyBody, forceX, forceY } from 'd3-force';

// Internal moduls.
import state from '../app/state';
import { sim } from './stats';

// Individual simulations:

// Move to the globe's exit position.
const xPosGlobe = forceX(d => d.layout.globeExit.x).strength(0.1);
const yPosGlobe = forceY(d => d.layout.globeExit.y).strength(0.1);

function simulateGlobePosition() {
  // Configure and start simulation.
  sim
    .nodes(state.stats.data)
    .force('chargeLattice', null)
    .force('boxForce', null)
    .force('link', null)
    .force('xCentre', null)
    .force('xCentre', null)
    .force('xGlobe', xPosGlobe)
    .force('yGlobe', yPosGlobe)
    .alpha(0.8)
    .restart();

  // Switch the global alpha off.
  gsap.to(alpha, { value: 0, duration: 0.5 });
}

// Move to lattice.
const chargeLattice = forceManyBody().strength(-6);
const xPosCentre = forceX(() => state.width / 2).strength(0.05); // 1
const yPosCentre = forceY(() => state.height / 2).strength(0.05);

function simulateLattice() {
  // Set the current variable value to null.
  // This is not a frequency distribution.
  state.stats.current = null;

  // Can't be with its force friends in module scope,
  // as it needs to be run after the links are produced.
  const linkForce = forceLink(state.stats.links)
    .id(d => d.index)
    .strength(1)
    .distance(1)
    .iterations(15);

  // Configure and start simulation.
  sim
    .nodes(state.stats.data)
    .force('link', linkForce)
    .force('chargeLattice', chargeLattice)
    .force('chargeFrequencies', null)
    .force('xGlobe', null)
    .force('yGlobe', null)
    .force('xAlcohol', null)
    .force('yAlcohol', null)
    .force('xCentre', xPosCentre)
    .force('xCentre', yPosCentre)
    .alpha(0.8)
    .restart();

  // Switch the global alpha on.
  state.stats.alpha.value = 1;
}

// Move to Alcohol frequency.
const chargeFrequencies = forceManyBody().strength(-2);
const xPosAlcohol = forceX(d => d.layout.alcohol.x).strength(0.5);
const yPosAlcohol = forceY(d => d.layout.alcohol.y).strength(0.5);

function simulateAlcohol() {
  state.stats.current = 'alcohol';

  sim
    .nodes(state.stats.data)
    .force('link', null)
    .force('chargeLattice', null)
    .force('chargeFrequencies', chargeFrequencies)
    .force('xCentre', null)
    .force('xCentre', null)
    .force('xDensity', null)
    .force('yDensity', null)
    .force('xAlcohol', xPosAlcohol)
    .force('yAlcohol', yPosAlcohol)
    .alpha(0.8)
    .restart();
}

// Move to Density frequency.
const xPosDensity = forceX(d => d.layout.density.x).strength(0.5);
const yPosDensity = forceY(d => d.layout.density.y).strength(0.5);

function simulateDensity() {
  state.stats.current = 'density';

  sim
    .nodes(state.stats.data)
    .force('xAlcohol', null)
    .force('yAlcohol', null)
    .force('xCitric', null)
    .force('yCitric', null)
    .force('xDensity', xPosDensity)
    .force('yDensity', yPosDensity)
    .alpha(0.8)
    .restart();
}

// Move to Citric Acid frequency.
const xPosCitric = forceX(d => d.layout.citric_acid.x).strength(0.5);
const yPosCitric = forceY(d => d.layout.citric_acid.y).strength(0.5);

function simulateCitric() {
  state.stats.current = 'citric_acid';

  sim
    .nodes(state.stats.data)
    .force('xDensity', null)
    .force('yDensity', null)
    .force('xPh', null)
    .force('yPh', null)
    .force('xCitric', xPosCitric)
    .force('yCitric', yPosCitric)
    .alpha(0.8)
    .restart();
}

// Move to pH frequency.
const xPosPh = forceX(d => d.layout.ph.x).strength(0.5);
const yPosPh = forceY(d => d.layout.ph.y).strength(0.5);

function simulatePh() {
  state.stats.current = 'ph';

  sim
    .nodes(state.stats.data)
    .force('xCitric', null)
    .force('yCitric', null)
    .force('xVolatile', null)
    .force('yVolatile', null)
    .force('xPh', xPosPh)
    .force('yPh', yPosPh)
    .alpha(0.8)
    .restart();
}

// Move to Volatile Acidity frequency.
const xPosVolatile = forceX(d => d.layout.volatile_acidity.x).strength(0.5);
const yPosVolatile = forceY(d => d.layout.volatile_acidity.y).strength(0.5);

function simulateVolatile() {
  state.stats.current = 'volatile_acidity';

  sim
    .nodes(state.stats.data)
    .force('xPh', null)
    .force('yPh', null)
    .force('xVolatile', xPosVolatile)
    .force('yVolatile', yPosVolatile)
    .alpha(0.8)
    .restart();
}

export {
  simulateGlobePosition,
  simulateLattice,
  simulateAlcohol,
  simulateDensity,
  simulateCitric,
  simulatePh,
  simulateVolatile,
};
