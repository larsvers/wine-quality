/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */

// External libs.
import gsap from 'gsap/gsap-core';
import { nest } from 'd3-collection/src';
import { scaleLinear } from 'd3-scale/src';
import 'd3-transition';
import {
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';

// Internal modules.
import state from '../app/state';
import frequency from '../layouts/frequency';
import { txScale, tyScale } from './globe';

// Module scope.
let dotRadius = 1.5;
let dot;
let margin;
let xScale;
let yScale;
let sim;
let alpha = { value: 1 };
let current;
let axisPoints = [];

// Render and draw.
function drawDot(r, colour) {
  const can = document.createElement('canvas');
  can.width = can.height = r * 2;
  const ctx = can.getContext('2d');

  ctx.beginPath();
  ctx.fillStyle = colour;
  ctx.arc(r, r, r, 0, 2 * Math.PI);
  ctx.fill();

  return can;
}

function drawStats(ctx) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();

  ctx.globalAlpha = alpha.value;

  // Dots.
  state.stats.data.forEach(d => {
    ctx.drawImage(dot, d.x, d.y);
  });

  // Labels.
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 0.2;

  if (current && axisPoints.length) {
    axisPoints.forEach((d, i) => {
      // Variables.
      const { x } = d.value;
      const y1 = d.value.y + 10;
      let y2 = d.value.y + 20;
      // Overwrite y2 if we should arrange long labels in zig zag
      if (d.value.zigzag) y2 = i % 2 === 0 ? d.value.y + 20 : d.value.y + 35;
      const label = d.key;

      // Draw.
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.fillText(label, x, y2 + 5);
    });
  }

  ctx.restore();
}

function renderStats() {
  requestAnimationFrame(() => drawStats(state.ctx.lolli));
}

// Scales.
function getScales() {
  margin = {
    top: state.height * 0.3,
    right: state.width * 0.3,
    bottom: state.height * 0.3,
    left: state.width * 0.3,
  };

  xScale = scaleLinear().range([margin.left, state.width - margin.right]);
  yScale = scaleLinear().range([state.height - margin.bottom, margin.top]);
}

// Layouts to save in each data row. The simulations
// can move the dots to these with forceX, forceY.
function addLayouts() {
  const layoutAlcohol = frequency().variable('alcohol')(state.stats.data);
  const layoutDensity = frequency().variable('density')(state.stats.data);

  state.stats.data.forEach(d => {
    d.layout = {};

    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 2
      y: tyScale(1) + Math.random(),
    };

    // Note, the Lattice layout is controlled by the link dataset.

    // Alcohol.
    d.layout.alcohol = {
      x: xScale(layoutAlcohol.get(d.id).x),
      y: yScale(layoutAlcohol.get(d.id).y),
      value: layoutAlcohol.get(d.id).value,
    };

    // Density.
    d.layout.density = {
      x: xScale(layoutDensity.get(d.id).x),
      y: yScale(layoutDensity.get(d.id).y),
      value: layoutDensity.get(d.id).value,
    };
  });
}

// Set an initial layout.
function setLayout(name) {
  state.stats.data.forEach(d => {
    d.x = d.layout[name].x;
    d.y = d.layout[name].y;
  });
}

// General Forces (specific forces above relevant functions).
function boundingBox() {
  // Relies on some globals.
  const r = dotRadius;
  state.stats.data.forEach(node => {
    node.x = Math.max(r, Math.min(node.x, state.width - r * 2));
    node.y = Math.max(r, Math.min(node.y, state.height - r * 2));
  });
}

// ---------------------------------------------------

// We want to calculate each group's label x position
// only on the points lower to the bottom. Not on all points
// as the shape might be wavey. We do this here...
function xFocus(leaves) {
  return leaves.filter(
    (_, i, nodes) => i < Math.max(Math.ceil(nodes.length * 0.1), 10)
  );
}

// At each tick, this returns an object with the x and y position
// for each label as well as their text value.
function getAxisPoints() {
  if (!current) return;

  // Calculate center x and bottom y position. Also sort by value.
  axisPoints = nest()
    .key(d => d.layout[current].value)
    .rollup(v => {
      return {
        x: d3.median(xFocus(v), d => d.x),
        y: d3.max(v, d => d.y),
        // if labels are longer than 3 than we should arrange them in zig zag.
        zigzag: d3.median(v, d => String(d.layout[current].value).length) > 3,
      };
    })
    .entries(state.stats.data)
    .sort((a, b) => +a.key - +b.key);
}

// All the stuff we run per tick.
function tick() {
  getAxisPoints();
  renderStats();
}
// Set up the simulations and stop it. We don't want
// to start it until ScrollTrigger triggers it.
function setSimulation() {
  sim = forceSimulation(state.stats.data)
    .on('tick', tick)
    .stop();
}

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
  current = null;

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
    .force('boxForce', boundingBox)
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
  alpha.value = 1;
}

// Move to Alcohol frequency.
const chargeFrequencies = forceManyBody().strength(-2);
const xPosAlcohol = forceX(d => d.layout.alcohol.x).strength(0.5);
const yPosAlcohol = forceY(d => d.layout.alcohol.y).strength(0.5);

function simulateAlcohol() {
  current = 'alcohol';

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
  current = 'density';

  sim
    .nodes(state.stats.data)
    .force('xAlcohol', null)
    .force('yAlcohol', null)
    .force('xDensity', xPosDensity)
    .force('yDensity', yPosDensity)
    .alpha(0.8)
    .restart();
}

// Initial function run on each update.
function tweenStats() {
  getScales();
  addLayouts();
  setLayout('globeExit');
  setSimulation();
  dot = drawDot(dotRadius, '#000000');
}

export default tweenStats;
export {
  simulateGlobePosition,
  simulateLattice,
  simulateAlcohol,
  simulateDensity,
};

// 1. Not using `forceCenter` here as v 1.2.1 (the ES5 version) doesn't
//    have a `strangth` setter yet. So I am implementing my own centre
//    force here.
// 2. Math.random to disperse them a little to start with.
