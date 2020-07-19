import { select } from 'd3-selection/src/index';
import { scaleBand } from 'd3-scale/src/index';
import { csv, image } from 'd3-fetch/src/index';
import rough from 'roughjs/bundled/rough.esm';

import debounce from 'lodash.debounce';
import scape from '../../static/wine-scape-s';
import glass from '../../static/wine-glass-clean';
import bottle from '../../static/wine-bottle-1';
import bottleText from '../../static/text-bottle'; // an array of paths.
import wave1 from '../../static/bottle-wave-1';
import wave2 from '../../static/bottle-wave-2';
import update from './update';
import { getBox, setScaleX } from './utils';

// Utils

/**
 * Splits the path at the M commands.
 * Much more readable than reduce 🥂.
 * @param { String } path
 * @returns { Array } an array of paths
 */
function splitPath(path) {
  return path
    .split('M')
    .filter(d => d)
    .map(d => `M${d}`);
}

function buildChart() {
  // Build the chart.
  // ---------------

  const lolliGroup = shapeGroup.append('g').attr('id', 'lolli-group');

  // Data
  const lolliData = [
    { property: 'alcohol', text: 'Alcohol' },
    { property: 'acid', text: 'Citric Acid' },
    { property: 'chlorides', text: 'Chlorides' },
    { property: 'quality', text: 'Quality' },
  ];

  // Scales.
  const bottleBox = getBox('#bottle-path');
  // Set the xScale here - use it in update.
  setScaleX([0, 1], [0, bottleBox.width]);
  const yScale = scaleBand()
    .domain(lolliData.map(d => d.property))
    .range([0, bottleBox.height / 2]);

  // Build.
  const lolliGroups = lolliGroup
    .attr(
      'transform',
      `translate(${bottleBox.width * 1.1}, ${bottleBox.height * 0.55})`
    )
    .selectAll('.lollipop')
    .data(lolliData)
    .join('g')
    .attr('class', d => `lollipop lolli-${d.property}`)
    .attr('transform', d => `translate(0, ${yScale(d.property)})`);

  lolliGroups
    .append('text')
    .text(d => d.text)
    .attr('dy', '-0.35em');

  lolliGroups
    .append('line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', 0)
    .style('stroke', 'black');

  lolliGroups
    .append('circle')
    .attr('cx', 0)
    .attr('r', 2);
}

function buildVisual() {
  const svg = select('#svg-hidden');
  const stageGroup = svg.append('g').attr('id', 'stage-group');
  const rg = rough.svg(svg.node()).generator;
  const roughBottle = rg.path(bottle, { simplification: 0.6 });
  const roughBottlePath = rg.toPaths(roughBottle);

  stageGroup
    .append('path')
    .attr('id', 'glass-path')
    .attr('d', glass)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');

  stageGroup
    .append('path')
    .attr('id', 'bottle-path')
    .attr('d', roughBottlePath[0].d)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');
}

function buildStory(data) {
  const container = select('#text-wrap');

  // Set up the text.
  container
    .selectAll('section')
    .data(data)
    .join('div')
    .attr('class', d => `section section-${d.index}`)
    .html(d => d.text);
}

function ready([scrollData, wineScape]) {
  buildVisual();
  buildStory(scrollData);

  // TODO: add flag to bypass redraw of canvases on resize.
  update(wineScape);

  // Debounced resize.
  const debounced = debounce(() => update(wineScape), 500);
  window.addEventListener('resize', debounced);
}

function init() {
  const scrollData = csv('../../data/scrolldata.csv');
  const wineScape = image('../../static/wine-scape.png');

  Promise.all([scrollData, wineScape]).then(ready);
}

export default init;
