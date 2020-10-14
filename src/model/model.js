/* eslint-disable no-param-reassign */
/* eslint-disable no-cond-assign */
/* eslint-disable no-return-assign */
import isequal from 'lodash.isequal';
import { max, mean } from 'd3-array/src';
import { format } from 'd3-format/src';
import { scaleLinear } from 'd3-scale/src';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape/src';

import state from '../app/state';
import { prettyLabel } from '../app/utils';

// Module state.
const margin = { top: 20, right: 20, bottom: 30, left: 20 };

// Helpers.
const formatNum = format('~s');

/**
 * Calculates the Logistic Regression probability for the
 * given values based on the given model parameters.
 * @param { map } values map of the values
 * @param { map } weights map of the weights
 * @param { number } intercept the model intercept
 */
function getProbability(values, weights, intercept) {
  const check = isequal(values.keys(), weights.keys());
  if (!check) throw Error('values and weights are not equal.');

  let logOdds = intercept;
  values.keys().forEach(variable => {
    logOdds += values.get(variable) * weights.get(variable);
  });

  const odds = Math.exp(logOdds);
  const prob = odds / (1 + odds);
  return prob;
}

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

// Function to compute density
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [
        x,
        mean(V, function(v) {
          return kernel(x - v);
        }),
      ];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}

function buildControl(datum) {
  const { key: variable, value } = datum;

  // Set up.
  const sel = select(this);
  sel.select('svg').remove(); // No join mechanics here - let's be deterministic.
  const svg = sel.append('svg').attr('class', 'control');
  const clippy = svg
    .append('defs')
    .append('clipPath')
    .attr('id', `clippy-${variable}`)
    .append('path');
  // SVG is defined as 100% width/height in CSS.
  const width = parseInt(svg.style('width'), 10) - margin.left - margin.right;
  const height = parseInt(svg.style('height'), 10) - margin.top - margin.bottom;
  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // x Scale.
  const xScale = scaleLinear()
    .domain(state.model.ranges.get(variable))
    .range([0, width]);

  // Label.
  g.append('text')
    .attr('x', width)
    .attr('y', -margin.top / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .style('font-family', 'Pangolin')
    .style('font-size', 10)
    .text(prettyLabel(variable));

  // Axis.
  g.append('line')
    .attr('y1', height)
    .attr('x2', width)
    .attr('y2', height)
    .style('stroke-width', 1)
    .style('stroke', '#000');

  // Density data.
  const k =
    (state.model.ranges.get(variable)[1] -
      state.model.ranges.get(variable)[0]) *
    0.05;
  const kde = kernelDensityEstimator(kernelEpanechnikov(k), xScale.ticks(40));
  const density = kde(state.stats.data.map(d => d[variable]));

  // Add a start and an end point at x = 0 to the mix.
  density.unshift([density[0][0], 0]);
  density.push([density[density.length - 1][0], 0]);

  // y Scale.
  const yScale = scaleLinear()
    .domain([0, max(density.map(d => d[1]))])
    .range([height, 0]);

  // Line generator.
  const lineGen = line()
    .curve(curveBasis)
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  // Get density path.
  const densityPath = lineGen(density);

  // Density chart.
  g.append('path')
    .attr('class', `density ${variable}`)
    .style('fill', '#000')
    .style('fill-opacity', 0.2)
    .style('stroke-width', 1)
    .style('stroke', '#000')
    .style('stroke-linejoin', 'round')
    .attr('d', densityPath);

  // Clip path data.
  clippy.attr('d', densityPath);

  // Marker.
  g.append('line')
    .attr('x1', xScale(value))
    .attr('y1', height)
    .attr('x2', xScale(value))
    .attr('y2', 0)
    .attr('clip-path', `url(#clippy-${variable})`)
    .style('stroke-width', 1)
    .style('stroke', 'black');

  // Handle.
  g.append('circle')
    .attr('cx', xScale(value))
    .attr('cy', height)
    .attr('r', 5)
    .style('fill', '#000');

  // Number.
  g.append('text')
    .attr('x', xScale(value))
    .attr('y', height)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'hanging')
    .attr('dy', '0.7em')
    .style('font-family', 'Pangolin')
    .style('font-size', 12)
    .text(value.toFixed(2));
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
    .style('width', `${Math.min(200, state.width * 0.475)}px`) // 1
    .style('height', `${100}px`)
    .each(buildControl);
}

export { getProbability, buildModelControls };

// 1. We want at least 2 controls sided by side.
//    Hence the minimum would be 0.5% of the width.
//    However, we give it a little leeway here with 0.475
