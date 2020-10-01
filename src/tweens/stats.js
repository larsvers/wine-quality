/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */
import gsap from 'gsap/gsap-core';
import { extent, ticks } from 'd3-array/src';
import { scaleLinear, scalePoint } from 'd3-scale/src';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';

import state from '../app/state';
import { txScale, tyScale } from './globe';

let dotRadius = 1.5;
let dotPadding = 1;
let dot;
let margin;
let xScale;
let yScale;
let sim;
let alpha = { value: 1 };

const variable = {};

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

  state.stats.data.forEach(d => {
    ctx.drawImage(dot, d.x, d.y);
  });

  ctx.restore();
}

function renderStats() {
  requestAnimationFrame(() => drawStats(state.ctx.lolli));
}

// Scales.

function variableScale(variable) {
  const domain = extent(state.stats.data, d => d[variable]);
  const tickArray = ticks(domain[0], domain[1], 12);
  const scale = scalePoint()
    .domain(tickArray)
    .range([margin.left, state.width - margin.right]);

  function snap(number) {
    return tickArray.reduce((a, b) => {
      return Math.abs(b - number) < Math.abs(a - number) ? b : a;
    });
  }

  return { scale, snap };
}

function getScales() {
  margin = {
    top: state.height * 0.3,
    right: state.width * 0.3,
    bottom: state.height * 0.3,
    left: state.width * 0.3,
  };

  xScale = scaleLinear().range([margin.left, state.width - margin.right]);
  yScale = scaleLinear().range([margin.top, state.height - margin.bottom]);

  variable.alcohol = variableScale('alcohol');
  variable.density = variableScale('density');
}

// Layouts to save in each data row. The simulations
// can move the dots to these with forceX, forceY.
function addLayouts() {
  // const alcoholFreq = frequency().variable('alcohol')(state.stats.data);

  let a = [];
  state.stats.data.forEach(d => {
    d.layout = {};
    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 2
      y: tyScale(1) + Math.random(),
    };
    // Just an example layout.
    d.layout.random = {
      x: xScale(Math.random()),
      y: yScale(Math.random()),
    };
    // Alcohol.
    a.push(variable.alcohol.snap(d.alcohol));
    d.layout.alcohol = {
      x: variable.alcohol.scale(variable.alcohol.snap(d.alcohol)),
      y: state.height / 2,
    };
    // Density.
    d.layout.density = {
      x: variable.density.scale(variable.density.snap(d.density)),
      y: state.height / 2,
    };
  });
  console.log(Array.from(new Set(a)));
}

// Set an initial layout.
function setLayout(name) {
  state.stats.data.forEach(d => {
    d.x = d.layout[name].x;
    d.y = d.layout[name].y;
  });
}

// Forces.
const chargeForce = forceManyBody().strength(-6);
const xPosGlobe = forceX(d => d.layout.globeExit.x).strength(0.1);
const yPosGlobe = forceY(d => d.layout.globeExit.y).strength(0.1);
const xPosCentre = forceX(() => state.width / 2).strength(0.05); // 1
const yPosCentre = forceY(() => state.height / 2).strength(0.05);
const xPosRandom = forceX(d => d.layout.random.x).strength(0.5);
const yPosRandom = forceY(d => d.layout.random.y).strength(0.5);

function boundingBox() {
  // Relies on some globals.
  const r = dotRadius;
  state.stats.data.forEach(node => {
    node.x = Math.max(r, Math.min(node.x, state.width - r * 2));
    node.y = Math.max(r, Math.min(node.y, state.height - r * 2));
  });
}

// Set up the simulations and stop it. We don't want
// to start it until ScrollTrigger triggers it.
function setSimulation() {
  sim = forceSimulation(state.stats.data)
    .on('tick', renderStats)
    .stop();
}

// Move to the globe's exit position.
function simulateGlobePosition() {
  // Configure and start simulation.
  sim
    .nodes(state.stats.data)
    .force('chargeForce', null)
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
function simulateLattice() {
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
    .force('chargeForce', chargeForce)
    .force('boxForce', boundingBox)
    .force('link', linkForce)
    .force('xCentre', xPosCentre)
    .force('xCentre', yPosCentre)
    .force('xGlobe', null)
    .force('yGlobe', null)
    .force('xRandom', null)
    .force('yRandom', null)
    .alpha(0.8)
    .restart();

  // Switch the global alpha on.
  alpha.value = 1;
}

function simulateRandom() {
  sim
    .nodes(state.stats.data)
    .force('link', null)
    .force('xCentre', null)
    .force('xCentre', null)
    .force('xRandom', xPosRandom)
    .force('yRandom', yPosRandom)
    .alpha(0.8)
    .restart();
}

const chargeAlcohol = forceManyBody().strength(-5);
const collideFrequency = forceCollide(dotRadius + dotPadding).strength(0.5);
// const xPosAlcohol = forceX(d => d.layout.alcohol.x).strength(0.5);
// const yPosAlcohol = forceY(d => d.layout.alcohol.y).strength(0.5);
const xPosAlcohol = forceX(d => d.layout.alcohol.x).strength(0.6);
const yPosAlcohol = forceY(d => d.layout.alcohol.y).strength(0.3);

function simulateAlcohol() {
  sim
    .nodes(state.stats.data)
    .force('chargeForce', null)
    .force('chargeAlcohol', chargeAlcohol)
    .force('collideFrequency', collideFrequency)
    .force('xRandom', null)
    .force('yRandom', null)
    .force('xAlcohol', xPosAlcohol)
    .force('yAlcohol', yPosAlcohol)
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
  simulateLattice,
  simulateGlobePosition,
  simulateRandom,
  simulateAlcohol,
};

// 1. Not using `forceCenter` here as v 1.2.1 (the ES5 version) doesn't
//    have a `strangth` setter yet. So I am implementing my own centre
//    force here.
// 2. Math.random to disperse them a little to start with.
