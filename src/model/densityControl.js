/* eslint-disable no-param-reassign */
/* eslint-disable no-cond-assign */
/* eslint-disable no-return-assign */
import { max, mean } from 'd3-array/src';
import { scaleLinear } from 'd3-scale/src';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape/src';
import { prettyLabel } from '../app/utils';

import state from '../app/state';

// Module state.
const margin = { top: 20, right: 20, bottom: 30, left: 20 };

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
  // SVG is defined as 100% width/height in CSS.
  const width = parseInt(svg.style('width'), 10) - margin.left - margin.right;
  const height = parseInt(svg.style('height'), 10) - margin.top - margin.bottom;
  // Clip path for the marker.
  const clippy = svg
    .append('defs')
    .append('clipPath')
    .attr('id', `clippy-${variable}`)
    .append('path');
  // The chart g.
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
    .style('font-size', 12)
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

export default buildControl;
