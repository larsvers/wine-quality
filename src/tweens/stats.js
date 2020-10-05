/* eslint-disable import/no-mutable-exports */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */

// External libs.
import { forceSimulation } from 'd3-force';
import { scaleLinear } from 'd3-scale/src';
import 'd3-transition';

import { extent } from 'd3-array/src';

// Internal modules.
import state from '../app/state';
import frequency from '../layouts/frequency';
import labels from '../layouts/labels';
import { txScale, tyScale } from './globe';
import { capitalise } from '../app/utils';

// Module scope.
let dotRadius = 1.5;
let dot;
let dotGood;
let dotBad;
let margin;
let xScale;
let yScale;
let sim;
let labelInfo;

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
    if (!state.stats.colourDots) {
      ctx.drawImage(dot, d.x, d.y);
    } else {
      ctx.drawImage(d.quality_binary ? dotBad : dotGood, d.x, d.y);
    }
  });

  // if (state.stats.current.length && axisPoints.length && !state.stats.scatter) {
  if (state.stats.current.length && !state.stats.scatter) {
    // Styles.
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.font = '10px Pangolin';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 0.2;

    for (let i = 0; i < state.stats.current.length; i++) {
      const variable = state.stats.current[i];
      if (!variable.hasOwnProperty('ticks')) break;

      // TODO:
      // - Add tick lines (depend on axis and alignment)
      // - header (depends on type of chart)

      variable.ticks.forEach(tick => {
        const x = tick.value.x;
        const y = tick.value.y;

        // const y1 = tick.value.y + 10;
        // let y2 = tick.value.y + 20;
        // let y2 = tick.value.y;

        // Overwrite y2 if we should arrange long labels in zig zag
        // if (tick.value.zigzag)
        //   y2 = i % 2 === 0 ? tick.value.y + 20 : tick.value.y + 35;
        const label = tick.key;

        // Draw.
        // ctx.beginPath();
        // ctx.moveTo(x, y1);
        // ctx.lineTo(x, y2);
        // ctx.stroke();
        // ctx.fillText(label, x, y2 + 5);
        ctx.fillText(label, x, y);
      });

      // // Header.
      // const xHeader = headerPoint.value.x;
      // const yHeader = headerPoint.value.yHeader - 60;
      // const labelHeader = capitalise(state.stats.current[0].name).replace(
      //   '_',
      //   ' '
      // );
      // ctx.font = '50px Amatic SC';
      // ctx.fillText(labelHeader, xHeader, yHeader);
    }
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

// At each tick, this returns an object with the x and y position
// for each label as well as their text value.
function getLabelCoordinates() {
  if (!state.stats.current.length) return;

  // Get tick values and the cloud's bounding box.
  state.stats.current.forEach(el => {
    const { name, axis, straight } = el;
    const labelPositions = labels()
      .nestKey(d => d.layout[name].value)
      .axis(axis)
      .align(straight)(state.stats.data);

    el.ticks = labelPositions.ticks;
    el.bbox = labelPositions.bbox;

    // Get the header position for frequencies (highest bar) and scatter (top left).
    // prettier-ignore
    const yMinTick = el.ticks.filter(d => d.value.yRange[0] === el.bbox.yMin)[0];
    el.headerFreq = { x: yMinTick.value.x, y: el.bbox.yMin };
    el.headerScatter = { x: el.bbox.xMin, y: el.bbox.yMin };
  });
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

  const sAlc = scaleLinear().domain(extent(state.stats.data, d => d.alcohol));
  const sQual = scaleLinear().domain(extent(state.stats.data, d => d.quality));

  // Add all layouts to the main data.
  state.stats.data.forEach(d => {
    d.layout = {};

    d.layout.qualAlc = {
      x: xScale(sQual(d.quality)),
      y: yScale(sAlc(d.alcohol)),
    };

    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 1
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
  dotGood = drawDot(dotRadius, '#0000ff');
  dotBad = drawDot(dotRadius, '#ff0000');
}

export default tweenStats;
export { sim };

// 1. Math.random to disperse them a little to start with.
