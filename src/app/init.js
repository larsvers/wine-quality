import { select } from 'd3-selection/src/index';
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
import textAlcohol from '../../static/text-alcohol';
import textAcid from '../../static/text-acid';
import textChloride from '../../static/text-chloride';
import textQuality from '../../static/text-quality';
import state from './state';
import update from './update';
import { getBox, splitPath, getPathLength } from './utils';

// Gsap register.
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// Utils.
function getPathData(path) {
  const splitPaths = splitPath(path);
  const paths = splitPaths.map(p => new Path2D(p));
  const length = Math.ceil(max(splitPaths.map(getPathLength)));
  const offset = length;
  return { paths, length, offset };
}

// Prep visual.
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

  // Prep lolly chart.

  // Get the lolly's path data (the paths and the length).
  const lolliTextPaths = [textAlcohol, textAcid, textChloride, textQuality].map(
    getPathData
  );

  // Set the data
  // `value` is the mutable value to change,
  // `values` has all values we want to gsap to.
  state.lolliChart.data = {
    alcohol: {
      value: 0,
      values: [0, 0.8, 0.3, 0.8],
      radius: 0,
      text: lolliTextPaths[0],
    },
    acid: {
      value: 0,
      values: [0, 0.2, 0.7, 0.2],
      radius: 0,
      text: lolliTextPaths[1],
    },
    chloride: {
      value: 0,
      values: [0, 0.4, 0.6, 0.4],
      radius: 0,
      text: lolliTextPaths[2],
    },
    quality: {
      value: 0,
      values: [0, 0.9, 0.3, 0.9],
      radius: 0,
      text: lolliTextPaths[3],
    },
  };

  // A bit roundabout, but in order to gsapolate the values we need them in
  // objects as below. But to iterate through them in the canvas draw function
  // we need at least the names in an array like here:
  state.lolliChart.values = Object.keys(state.lolliChart.data);
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
