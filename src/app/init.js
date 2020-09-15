import { select, selectAll } from 'd3-selection/src/index';
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
import blackBox from '../../static/black-box-fill';
import textModel from '../../static/text-model';
import state from './state';
import update from './update';
import { getBox, splitPath, getPathData } from './utils';

import animalBird from '../../static/animal-bird';
import animalCroc from '../../static/animal-crocodile';
import animalGiraffe from '../../static/animal-giraffe';
import animalPig from '../../static/animal-pig';
import animalSloth1 from '../../static/animal-sloth-1';
import animalSloth2 from '../../static/animal-sloth-2';
import animalWhale from '../../static/animal-whale';

// Gsap register.
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// Prep visual.
function prepareVisuals() {
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
  state.bottleText.dims = bottleTexts.map(p => getPathData(p));
  state.bottleText.maxLength = max(state.bottleText.dims, d => d.length);
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
  state.lolli.data = {
    alcohol: {
      value: 0,
      values: [0, 0.6, 0.3, 0.8, 0],
      radius: 0,
      text: lolliTextPaths[0],
      offset: {
        x: 0,
        y: 0,
      },
    },
    acid: {
      value: 0,
      values: [0, 0.3, 0.7, 0.2, 0],
      radius: 0,
      text: lolliTextPaths[1],
      offset: {
        x: 0,
        y: 0,
      },
    },
    chloride: {
      value: 0,
      values: [0, 0.7, 0.6, 0.4, 0],
      radius: 0,
      text: lolliTextPaths[2],
      offset: {
        x: 0,
        y: 0,
      },
    },
    quality: {
      value: 0,
      values: [0, 0.5, 0.3, 0.9, 0],
      radius: 0,
      text: lolliTextPaths[3],
      offset: {
        x: 0,
        y: 0,
      },
    },
  };

  // A bit roundabout, but in order to gsapolate the values we need them in
  // objects as below. But to iterate through them in the canvas draw function
  // we need at least the names in an array like here:
  state.lolli.values = Object.keys(state.lolli.data);

  // Get the blackbox pathdata.
  state.blackBox.box = getPathData(blackBox);
  state.blackBox.model = getPathData(textModel);

  stageGroup
    .append('path')
    .attr('id', 'black-box-path')
    .attr('d', blackBox)
    .style('fill', 'none')
    .style('stroke-width', 0)
    .style('stroke', 'none');

  state.blackBox.boxDims = getBox('#black-box-path');

  // Add animal morph paths.

  // The animals we have paths for.
  const animals = [
    { name: 'bird', path: animalBird },
    { name: 'croc', path: animalCroc },
    { name: 'giraffe', path: animalGiraffe },
    { name: 'pig', path: animalPig },
    { name: 'sloth1', path: animalSloth1 },
    { name: 'sloth2', path: animalSloth2 },
    { name: 'whale', path: animalWhale },
  ];

  // Add the paths to the DOM.
  const animalPaths = stageGroup
    .append('g')
    .attr('class', 'animals')
    .selectAll('.animal')
    .data(animals)
    .join('path')
    .attr('class', 'animal')
    .attr('id', d => `animal-${d.name}`)
    .attr('d', d => d.path);

  // Get each animal path's BBox.
  animalPaths.each(function(d) {
    state.animals[d.name] = this.getBBox();
  });
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
  prepareVisuals();
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
