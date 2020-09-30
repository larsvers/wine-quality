/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */
import { scaleLinear } from 'd3-scale/src';
import {
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';

import state from '../app/state';
import { txScale, tyScale } from './globe';
import gsap from 'gsap/gsap-core';

let xScale;
let yScale;
let dotRadius = 1.5;
let dot;
let sim;
let alpha = { value: 1 }

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
function getScales() {
  xScale = scaleLinear().rangeRound([state.width * 0.1, state.width * 0.9]);
  yScale = scaleLinear().rangeRound([state.height * 0.1, state.height * 0.9]);
}

// Layouts to save in each data row. The simulations 
// can move the dots to these with forceX, forceY.
function addLayouts() {
  state.stats.data.forEach(d => {
    d.layout = {};
    // Just an example layout.
    d.layout.random = {
      x: xScale(Math.random()),
      y: yScale(Math.random()),
    };
    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 2
      y: tyScale(1) + Math.random(),
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

// Forces.
const chargeForce = forceManyBody().strength(-6);
const xPosGlobe = forceX(d => d.layout.globeExit.x).strength(0.1);
const yPosGlobe = forceY(d => d.layout.globeExit.y).strength(0.1);
const xPosCentre = forceX(() => state.width / 2).strength(0.05); // 1
const yPosCentre = forceY(() => state.height / 2).strength(0.05);

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

// Enter the lattice.
function simulateLatticeEnter() {
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
    .alpha(0.8)
    .restart();

  // Switch the global alpha on.
  alpha.value = 1;
}

// Remove the lattice.
function simulateLatticeLeaveBack() {
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
  gsap.to(alpha, { value: 0, duration: 0.5 })
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
export { simulateLatticeEnter, simulateLatticeLeaveBack };

// 1. Not using `forceCenter` here as v 1.2.1 (the ES5 version) doesn't
//    have a `strangth` setter yet. So I am implementing my own centre
//    force here.
// 2. Math.random to disperse them a little to start with.