/* eslint-disable import/no-mutable-exports */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */

// External libs.
import { forceSimulation } from 'd3-force';
import { nest } from 'd3-collection/src';
import { scaleLinear } from 'd3-scale/src';
import 'd3-transition';

// Internal modules.
import state from '../app/state';
import frequency from '../layouts/frequency';
import { txScale, tyScale } from './globe';
import { capitalise } from '../app/utils';

// Module scope.
let dotRadius = 1.5;
let dot;
let margin;
let xScale;
let yScale;
let sim;
let axisPoints = [];
let headerPoint;

// Render and draw
// ---------------
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

  ctx.globalAlpha = state.stats.alpha.value;

  // Dots.
  state.stats.data.forEach(d => {
    ctx.drawImage(dot, d.x, d.y);
  });

  // Labels.
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.font = '10px Pangolin';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 0.2;

  if (state.stats.current && axisPoints.length) {
    // Axis.
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

    // Header.
    const xHeader = headerPoint.value.x;
    const yHeader = headerPoint.value.yHeader - 60;
    const labelHeader = capitalise(state.stats.current).replace('_', ' ');
    ctx.font = '50px Amatic SC';
    ctx.fillText(labelHeader, xHeader, yHeader);
  }

  ctx.restore();
}

function renderStats() {
  requestAnimationFrame(() => drawStats(state.ctx.lolli));
}

// Scales
// ------
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

// Axis
// ----

// We want to calculate each group's label x position only on the points lower to
// the bottom. Not on all points as the shape might be wavey. We do this here...
function xFocus(leaves) {
  return leaves.filter(
    (_, i, nodes) => i < Math.max(Math.ceil(nodes.length * 0.1), 10)
  );
}

// At each tick, this returns an object with the x and y position
// for each label as well as their text value.
function getLabelCoordinates() {
  if (!state.stats.current) return;

  // Calculate center x and bottom y position. Also sort by value.
  axisPoints = nest()
    .key(d => d.layout[state.stats.current].value)
    .rollup(v => {
      return {
        x: d3.median(xFocus(v), d => d.x),
        y: d3.max(v, d => d.y),
        yHeader: d3.min(v, d => d.y),
        // if labels are longer than 3 than we should arrange them in zig zag.
        zigzag:
          d3.median(
            v,
            d => String(d.layout[state.stats.current].value).length
          ) > 3,
      };
    })
    .entries(state.stats.data)
    .sort((a, b) => +a.key - +b.key);

  // Get category with highest y value (which will be the lowest y pixel value).
  const yHeighest = d3.min(axisPoints, d => d.value.yHeader);
  headerPoint = axisPoints.filter(d => d.value.yHeader === yHeighest)[0];
}

// Layouts
// -------

// Layouts to save in each data row. The simulations
// can move the dots to these with forceX, forceY.
function addLayouts() {
  // Get all variable based layouts.
  const variableLayouts = [
    {
      name: 'alcohol',
      layout: frequency().variable('alcohol')(state.stats.data),
    },
    {
      name: 'density',
      layout: frequency().variable('density')(state.stats.data),
    },
    {
      name: 'citric_acid',
      layout: frequency().variable('citric_acid')(state.stats.data),
    },
    {
      name: 'ph',
      layout: frequency().variable('ph')(state.stats.data),
    },
    {
      name: 'volatile_acidity',
      layout: frequency().variable('volatile_acidity')(state.stats.data),
    },
    {
      name: 'quality',
      layout: frequency().variable('quality')(state.stats.data),
    },
  ];

  // Add all layouts to the main data.
  state.stats.data.forEach(d => {
    d.layout = {};

    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 2
      y: tyScale(1) + Math.random(),
    };

    // Note, the Lattice layout is controlled by the link dataset.

    // Add all variable layouts to the data.
    variableLayouts.forEach(el => {
      d.layout[el.name] = {
        x: xScale(el.layout.get(d.id).x),
        y: yScale(el.layout.get(d.id).y),
        value: el.layout.get(d.id).value,
      };
    });
  });
}

// Set an initial layout.
function setLayout(name) {
  state.stats.data.forEach(d => {
    d.x = d.layout[name].x;
    d.y = d.layout[name].y;
  });
}

// Simulations
// -----------

// All the stuff we run per tick.
function tick() {
  getLabelCoordinates();
  renderStats();
}

// Forces applied to all simulations.
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
    .force('boxForce', boundingBox)
    .on('tick', tick)
    .stop();
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
export { sim };

// 1. Not using `forceCenter` here as v 1.2.1 (the ES5 version) doesn't
//    have a `strangth` setter yet. So I am implementing my own centre
//    force here.
// 2. Math.random to disperse them a little to start with.
