/* eslint-disable no-prototype-builtins */
/* eslint-disable import/no-mutable-exports */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-properties */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */

// External libs.
import { extent } from 'd3-array/src';
import { forceSimulation } from 'd3-force';
import { scaleLinear } from 'd3-scale/src';
import 'd3-transition';

import { linearRegression, linearRegressionLine } from 'simple-statistics';

// Internal modules.
import state from '../app/state';
import frequency from '../layouts/frequency';
import labels from '../layouts/labels';
import { txScale, tyScale } from './globe';
import { capitalise, getLinearScale, euclideanDistance } from '../app/utils';

// Module scope.
let dotRadius = 1.5;
let dot;
let dotGood;
let dotBad;
let margin;
let xScale;
let yScale;
let sim;
let tickPadding = 20;

// Regression line data.
let start = [];
let end = [];
let length;
let offset;

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

function drawLine(ctx) {
  // Check for the regression line flag and if there's data to draw.
  if (!state.stats.lr && start.length) return;
  ctx.save();

  // Draw the regression line dynamically.
  ctx.beginPath();
  ctx.setLineDash([length - offset, offset]);
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawStats(ctx) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();

  ctx.globalAlpha = state.stats.alpha.value;

  // Draw axes and labels.
  if (state.stats.current.length) {
    // Base styles.
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 0.2;

    for (let i = 0; i < state.stats.current.length; i++) {
      const currentVar = state.stats.current[i];
      // Check if there's data to draw with.
      if (!currentVar.hasOwnProperty('labelLayout')) break;
      // Reference element and layout info.
      const labelLayout = currentVar.labelLayout;

      // Draw each tick.
      labelLayout.ticks.forEach((tick, j) => {
        // Base info.
        const x = tick.value.x;
        const y = tick.value.y;
        const label = tick.key;

        // For scatter plots (they have label == true)...
        if (currentVar.label) {
          if (currentVar.axis === 'x') {
            ctx.font = '10px Pangolin';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, x, y);

            const xTickLine = x;
            const y1TickLine = labelLayout.bbox.yMin;
            const y2TickLine = y - 10;

            ctx.beginPath();
            ctx.moveTo(xTickLine, y1TickLine);
            ctx.lineTo(xTickLine, y2TickLine);
            ctx.stroke();
          }
          if (currentVar.axis === 'y') {
            ctx.font = '10px Pangolin';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);

            const x1TickLine = labelLayout.bbox.xMin;
            const x2TickLine = x - 10;
            const yTickLine = y;

            ctx.beginPath();
            ctx.moveTo(x1TickLine, yTickLine);
            ctx.lineTo(x2TickLine, yTickLine);
            ctx.stroke();
          }
        }

        // For frequency plots (they have label == false)...
        if (!currentVar.label) {
          // Set the lengths of ticks.
          const y1 = y - tickPadding * 0.5;
          let y2 = y - tickPadding * 0.1;

          // Overwrite y2 if we should arrange long labels in zig zag.
          const zigzagCondition =
            currentVar.axis === 'x' && tick.value.zigzag && j % 2 === 0;
          if (zigzagCondition) y2 += 15;

          // Draw label.
          ctx.font = '10px Pangolin';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(label, x, y2 + 5);

          // Draw ticks.
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();
        }
      });

      // Draw the header.
      if (currentVar.header) {
        const xHeader = labelLayout.label.header.x;
        const yHeader = labelLayout.label.header.y;
        const labelHeader = capitalise(currentVar.name).replace('_', ' ');

        ctx.font = '50px Amatic SC';
        ctx.fillText(labelHeader, xHeader, yHeader - 50);
      }

      // Draw the axis labels.
      if (currentVar.label) {
        const xAxisLabel = labelLayout.label.axisLabel.x;
        const yAxisLabel = labelLayout.label.axisLabel.y;
        const labelAxis = capitalise(currentVar.name).replace('_', ' ');

        ctx.font = '20px Amatic SC';
        ctx.fillText(labelAxis, xAxisLabel, yAxisLabel);
      }
    }
  }

  // Draw dots.
  state.stats.data.forEach(d => {
    if (!state.stats.colourDots) {
      ctx.drawImage(dot, d.x, d.y);
    } else {
      ctx.drawImage(d.quality_binary ? dotBad : dotGood, d.x, d.y);
    }
  });

  ctx.restore();
}

function renderStats() {
  getLinearRegressionLine();

  requestAnimationFrame(() => {
    drawStats(state.ctx.lolli);
    drawLine(state.ctx.lolli);
  });
}

// Scales and Data
// ---------------
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
    const labelLayout = labels()
      .nestKey(d => d.layout[name].value)
      .axis(axis)
      .padding(tickPadding)
      .align(straight)(state.stats.data);

    // Add layout to the current variable object.
    el.labelLayout = labelLayout;
  });
}

function getExtension(range) {
  return state.stats.progress.extend * (range[1] - range[0]);
}

// Calculates the regression line.
function getLinearRegressionLine() {
  // Only do all this work, if we want to show a regression line.
  if (!state.stats.lr) return;

  // Calculate the line function.
  const lrInput = state.stats.data.map(d => [d.x, d.y]);
  const lr = linearRegression(lrInput);
  const lrLine = linearRegressionLine(lr);

  // Calculate the length and offset and save the
  // variables for the draw func in module scope.
  const xRange = extent(state.stats.data, d => d.x);
  const extend = getExtension(xRange);
  console.log(extend);
  start = [xRange[0] - extend, lrLine(xRange[0] - extend)];
  end = [xRange[1] + extend, lrLine(xRange[1] + extend)];
  length = euclideanDistance(start, end);
  offset = (1 - state.stats.progress.draw) * length;
}

// Layouts
// -------

// Layouts to save in each data row. The simulations
// can move the dots to these with forceX, forceY.
function addLayouts() {
  // Get all variable based layouts.
  const frequencyLayouts = [
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

  // Prep the scatter layout loop, with the predictors to use...
  const scatterLayouts = [
    { name: 'alcohol__quality', var: 'alcohol' },
    { name: 'vol_acid__quality', var: 'volatile_acidity' },
  ];

  // ...and the quality scale to use.
  const qualityScale = scaleLinear().domain(
    extent(state.stats.data, d => d.quality)
  );

  // Add all layouts to the main data.
  state.stats.data.forEach(d => {
    d.layout = {};

    // That point where the globe disappears to.
    d.layout.globeExit = {
      x: txScale(1) + Math.random(), // 1
      y: tyScale(1) + Math.random(),
    };

    // Note, the Lattice layout is controlled by the link dataset.

    // Add all variable layouts to the data.
    frequencyLayouts.forEach(el => {
      d.layout[el.name] = {
        x: xScale(el.layout.get(d.id).x),
        y: yScale(el.layout.get(d.id).y),
        value: el.layout.get(d.id).value,
      };
    });

    // Add scatter plot layouts
    scatterLayouts.forEach(el => {
      const varScale = getLinearScale(el.var);
      d.layout[el.name] = {
        x: xScale(varScale(d[el.var])),
        y: yScale(qualityScale(d.quality)),
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
function handleTick() {
  getLabelCoordinates(); // should maybe be in renderStats? TODO
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
    .on('tick', handleTick)
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
export { sim, renderStats };

// 1. Math.random to disperse them a little to start with.
