import { select } from 'd3-selection/src/index';
import { scaleBand } from 'd3-scale/src/index';
import { csv, image } from 'd3-fetch/src/index';
import rough from 'roughjs/bundled/rough.esm';

import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import { max } from 'd3-array/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import glass from '../../static/wine-glass-clean';
import bottle from '../../static/wine-bottle-1';
import textBottle from '../../static/text-bottle'; // an array of paths.
import state from './state';
import update from './update';
import { getBox, splitPath, getPathLength, setScaleX } from './utils';

// Gsap register.
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

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
  state.glassBottle.bottleBox = getBox('#bottle-path');

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

  // Add glass/bottle morph paths.
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

  // Prep bottle dims.
  state.glassBottle.bottleBox = getBox('#bottle-path');

  // Prep text bottle.
  const bottleTexts = splitPath(textBottle);
  state.bottleText.maxLength = max(bottleTexts.map(getPathLength));
  state.bottleText.dashOffset = cloneDeep(state.bottleText.maxLength);
  state.bottleText.paths = bottleTexts.map(p => new Path2D(p));

  // Prep bottle wave.
  state.bottleWave.bottlePath = new Path2D(bottle);
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
