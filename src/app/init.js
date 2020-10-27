/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
// Libs.
import { select } from 'd3-selection/src/index';
import { csv, image, json } from 'd3-fetch/src/index';
import { max, mean, extent } from 'd3-array/src/index';
import { map } from 'd3-collection/src/index';
import { autoType } from 'd3-dsv/src/index';
import rough from 'roughjs/bundled/rough.esm';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';

// App modules.
import state from './state';
import update from './update';
import { getBox, splitPath, getPathData } from './utils';
import getProbability from '../model/probability';

// Paths general.
import glass from '../../static/wine-glass';
import bottle from '../../static/wine-bottle';
import textBottle from '../../static/text-bottle'; // an array of paths.
import textAlcohol from '../../static/text-alcohol';
import textAcid from '../../static/text-acid';
import textChloride from '../../static/text-chloride';
import textQuality from '../../static/text-quality';
import blackBox from '../../static/black-box-fill';
import textModel from '../../static/text-model';

// Animal Paths.
import animalBird from '../../static/animal-bird';
import animalCroc from '../../static/animal-crocodile';
import animalGiraffe from '../../static/animal-giraffe';
import animalPig from '../../static/animal-pig';
import animalSloth1 from '../../static/animal-sloth-1';
import animalSloth2 from '../../static/animal-sloth-2';
import animalWhale from '../../static/animal-whale';

// Dataset paths
import dataset00Grid from '../../static/dataset-00-grid';
import dataset01Id from '../../static/dataset-01-id';
import dataset02Quality from '../../static/dataset-02-quality';
import dataset03FAcidity from '../../static/dataset-03-f-acidity';
import dataset04VAcidity from '../../static/dataset-04-v-acidity';
import dataset05Citric from '../../static/dataset-05-citric';
import dataset06Sugar from '../../static/dataset-06-sugar';
import dataset07Chlorides from '../../static/dataset-07-chlorides';
import dataset08Sulfur from '../../static/dataset-08-sulfur';
import dataset09Density from '../../static/dataset-09-density';
import dataset10Ph from '../../static/dataset-10-ph';
import dataset11Sulphates from '../../static/dataset-11-sulphates';
import dataset12Alcohol from '../../static/dataset-12-alcohol';

// Gsap register.
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// Helpers.
function setModelWeightMap(array) {
  const mapResult = map();
  array.forEach(d => mapResult.set(d.term, d.estimate));
  return mapResult;
}

function getModelValues(data) {
  const predictors = data.columns.filter(
    d =>
      d !== 'id' && d !== 'index' && d !== 'quality' && d !== 'quality_binary'
  );

  const meanMap = map();
  const rangeMap = map();
  predictors.forEach(col => {
    meanMap.set(
      col,
      mean(data, d => d[col])
    );
    rangeMap.set(
      col,
      extent(data, d => d[col])
    );
  });
  return { meanMap, rangeMap };
}

// Build funcs.
function prepareVisuals(
  globeData,
  wineData,
  varImpData,
  modelIntercept,
  modelWeights
) {
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

  // All animals, their paths and how they should be scaled.
  // prettier-ignore
  state.animals.data = [
    { name: 'animalPig', path: animalPig, fit: { width: 0.5, height: 0 } },
    { name: 'animalCroc', path: animalCroc, fit: { width: 0.5, height: 0 } },
    { name: 'animalGiraffe', path: animalGiraffe, fit: { width: 0.5, height: 0 } },
    { name: 'animalSloth1', path: animalSloth1, fit: { width: 0.5, height: 0 } },
    { name: 'animalWhale', path: animalWhale, fit: { width: 0.5, height: 0 } },
    { name: 'animalBird', path: animalBird, fit: { width: 0.5, height: 0 } },
    { name: 'animalSloth2', path: animalSloth2, fit: { width: 0.5, height: 0 } },
  ];

  // Add the paths to the DOM.
  const animalPaths = stageGroup
    .append('g')
    .attr('class', 'animals')
    .selectAll('.animal')
    .data(state.animals.data)
    .join('path')
    .attr('class', 'animal')
    .attr('id', d => d.name)
    .attr('d', d => d.path);

  // Get each animal path's BBox.
  animalPaths.each(function (d) {
    state.animals[d.name] = this.getBBox();
  });

  // Set the paths and info of all dataset's elements.
  state.dataset.info = [
    { name: 'grid', paths: dataset00Grid, tween: 'datasetGrid' },
    { name: 'id', paths: dataset01Id, tween: 'datasetId' },
    { name: 'quality', paths: dataset02Quality, tween: 'datasetQuality' },
    { name: 'fxAcidity', paths: dataset03FAcidity, tween: 'datasetFxAcidity' },
    { name: 'vlAcidity', paths: dataset04VAcidity, tween: 'datasetVlAcidity' },
    { name: 'citric', paths: dataset05Citric, tween: 'datasetCitric' },
    { name: 'sugar', paths: dataset06Sugar, tween: 'datasetSugar' },
    { name: 'chlorides', paths: dataset07Chlorides, tween: 'datasetChlorides' },
    { name: 'sulfur', paths: dataset08Sulfur, tween: 'datasetSulfur' },
    { name: 'density', paths: dataset09Density, tween: 'datasetDensity' },
    { name: 'ph', paths: dataset10Ph, tween: 'datasetPh' },
    { name: 'sulphates', paths: dataset11Sulphates, tween: 'datasetSulphates' },
    { name: 'alcohol', paths: dataset12Alcohol, tween: 'datasetAlcohol' },
  ];

  // Get the path info for each element.
  state.dataset.info.forEach(
    d => (state.dataset[d.name] = getPathData(d.paths))
  );

  // Also, the grid and columns share the same base bounding box,
  // so we just need a single bbox, we take from the grid:
  state.dataset.box = getBox(false, dataset00Grid);

  // Save the world json.
  state.globe.data = globeData;

  // Save the wine data
  state.stats.data = wineData;

  // Get a link grid.
  const n = 40;
  const links = [];
  for (let y = 0; y < n; ++y) {
    for (let x = 0; x < n; ++x) {
      if (y > 0) links.push({ source: (y - 1) * n + x, target: y * n + x });
      if (x > 0) links.push({ source: y * n + (x - 1), target: y * n + x });
    }
  }
  state.stats.links = links;

  // Variable importance.
  state.varImp.data = varImpData.sort((a, b) => b.importance - a.importance);

  // Model.
  state.model.intercept = modelIntercept[0].estimate;
  state.model.weights = setModelWeightMap(modelWeights);
  const modelValues = getModelValues(state.stats.data);
  state.model.values = modelValues.meanMap;
  state.model.ranges = modelValues.rangeMap;
  state.model.probability = getProbability(
    state.model.values,
    state.model.weights,
    state.model.intercept
  );

  // Model bottle.
  const bottlePath = roughBottlePath.map(d => d.d).join();
  const bottlePathInfo = getPathData(bottlePath);
  state.modelBottle.paths = bottlePathInfo.paths;
  state.modelBottle.maxLength = bottlePathInfo.length;
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

  // Add model base.
  // needs to come at the better end to stop at top and become scrollable.
  const modelApp = select('#text-wrap').append('div').attr('id', 'model-app');

  modelApp.append('div').attr('id', 'model-app-header');
  modelApp.append('div').attr('id', 'model-app-wrap');
}

// Main func.
function ready([
  scrollData,
  wineScape,
  globeData,
  wineData,
  varImpData,
  modelIntercept,
  modelWeights,
]) {
  // Make sure all variable names are lower case! This is not checked in the app.
  prepareVisuals(globeData, wineData, varImpData, modelIntercept, modelWeights);
  buildStory(scrollData);

  // TODO: add flag to bypass redraw of canvases on resize.
  update(wineScape);

  // Debounced resize.
  const debounced = debounce(() => update(wineScape), 500);
  window.addEventListener('resize', debounced);
  window.addEventListener('load', () => {
    console.log('loaded');
  });
}

function init() {
  const scrollData = csv('../../data/scrolldata.csv');
  const wineScape = image('../../static/wine-scape.png');
  const globeData = json('../../data/world-simple.json');
  const wineData = csv('../../data/winedata.csv', autoType);
  const varImpData = csv('../../data/importance.csv', autoType);
  const modelIntercept = csv('../../data/model-intercept.csv', autoType);
  const modelWeights = csv('../../data/model-weights.csv', autoType);

  Promise.all([
    scrollData,
    wineScape,
    globeData,
    wineData,
    varImpData,
    modelIntercept,
    modelWeights,
  ]).then(ready);
}

export default init;
