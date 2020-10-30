/* eslint-disable no-return-assign */
/* eslint-disable import/no-duplicates */
/* eslint-disable no-param-reassign */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import rough from 'roughjs/bundled/rough.esm';

import state from './state';
import { resizeCanvas, getTransform, clear } from './utils';
import tweenBottleWave, { startWave, stopWave } from '../tweens/bottleWave';
import tweenWineScape from '../tweens/wineScape';

import tweenGlassBottle from '../tweens/glassBottle';
import tweenBottleText from '../tweens/bottleText';

import tweenLolliChart from '../tweens/lolliChart';
import {
  tweenLolliUpdate1,
  tweenLolliUpdate2,
  tweenLolliUpdate3,
} from '../tweens/lolliUpdate';
import tweenBlackBox, { arrows } from '../tweens/blackBox';
import tweenCleanup from '../tweens/cleanup';
import tweenBottleEmpty from '../tweens/bottleEmpty';
import tweenBottleTextOut from '../tweens/bottleTextOut';
import tweenAnimals, { animalPaths } from '../tweens/animals';
import tweenBottleFill from '../tweens/bottleFill';
import tweenBottleColour, { bottleColours } from '../tweens/bottleColour';
import tweenBottleGrid from '../tweens/bottleGrid';
import tweenBottleGridColour from '../tweens/bottleGridColour';
import tweenBottleGridSort from '../tweens/bottleGridSort';
import tweenBottleGridOut from '../tweens/bottleGridOut';
import tweenDataset from '../tweens/dataset';

import tweenGlobe from '../tweens/globe';
import tweenStats, { renderStats, tweenStatsAlpha, sim } from '../tweens/stats';
import {
  simulateGlobePosition,
  simulateLattice,
  simulateAlcohol,
  simulateDensity,
  simulateCitric,
  simulatePh,
  simulateVolatile,
  simulateQuality,
} from '../tweens/statsFrequencies';

import {
  simulateQualAlc,
  simulateQualVol,
  simulateQualBinAlc,
  simulateRemove,
} from '../tweens/statsScatter';

import tweenImportance from '../tweens/importance';

import buildModelControls from '../model/buildModel';
import tweenModelBottle from '../tweens/modelBottle';

import {
  updateModelWave,
  stopModelWave,
  checkModelWave,
} from '../tweens/modelWaveInit';

// Set ScrollTrigger defaults.
ScrollTrigger.defaults({
  scroller: '#container',
  start: 'top center',
  end: 'center center',
  scrub: true,
  toggleActions: 'play none none reverse',
  markers: false,
});

function updateDimensions() {
  const container = document.querySelector('#canvas-main-container');
  state.width = container.clientWidth;
  state.height = container.clientHeight;
}

// Get contexts and rezize canvases.
function updateContexts(names) {
  const canvases = document.querySelectorAll('canvas');
  names.forEach((name, i) => {
    state.ctx[name] = canvases[i].getContext('2d');
    resizeCanvas(canvases[i], state.width, state.height);
  });
}

function setRoughCanvases() {
  state.rough.chart = rough.canvas(state.ctx.chart.canvas);
  state.rough.globe = rough.canvas(state.ctx.globe.canvas);
}

// Set off canvas factory.
function setVisualStructure() {
  // Get contexts.
  const contextnames = [
    'scape',
    'glassBottle',
    'bottleText',
    'bottleWave',
    'chart',
    'blackBox',
    'globe',
  ];

  updateContexts(contextnames);
  setRoughCanvases();
}

function updateTransforms() {
  // Update all necessary transforms.

  // Update winescape image (and glass) transform.
  const scapeDim = {
    width: state.scape.image.width,
    height: state.scape.image.height,
  };
  state.transform.scape = getTransform(scapeDim, {
    width: 1,
    height: 0,
  });
  state.transform.shape = cloneDeep(state.transform.scape);

  // There's no mathemtacial connection between the bottle's
  // ideal height and the aspect ratio, but using the ar
  // fits quite nicely in this case.
  state.glassBottle.bottleTop = Math.min(
    Math.floor((state.width / state.height) * 100) / 100,
    0.8
  );
  state.glassBottle.bottleLeft = 0.25;
  state.transform.bottle = getTransform(
    state.glassBottle.bottleBox,
    { width: 0, height: state.glassBottle.bottleTop },
    { x: state.glassBottle.bottleLeft, height: null }
  );

  // Animals.
  // Get a transform for each animal based on its getBBox dimensions.
  state.animals.data.forEach(animal => {
    state.transform[animal.name] = getTransform(state.animals[animal.name], {
      width: 0.5,
      height: 0,
    });
  });

  // Update the dataset transform.
  state.transform.dataset = getTransform(state.dataset.box, {
    width: 0.9,
    height: 0,
  });
}

function setScroll() {
  // Create the scroll triggers.
  ScrollTrigger.create({
    animation: state.tween.wineScape,
    trigger: '.section-1',
    id: 'wineScape',
  });

  ScrollTrigger.create({
    animation: state.tween.glassBottle,
    trigger: '.section-2',
    id: 'glassBottle',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleText,
    trigger: '.section-3',
    id: 'bottleText',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleWave,
    trigger: '.section-4',
    id: 'bottleWave',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliChart,
    trigger: '.section-5',
    id: 'lolliChart',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliUpdate1,
    trigger: '.section-6',
    id: 'lolliUpdate1',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliUpdate2,
    trigger: '.section-7',
    id: 'lolliUpdate2',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliUpdate3,
    trigger: '.section-8',
    id: 'lolliUpdate3',
    onEnterBack: () => clear(state.ctx.blackBox),
  });

  // 2 items.
  arrows.forEach((d, i) => {
    ScrollTrigger.create({
      animation: state.tween[d],
      trigger: `.section-${9 + i}`,
      id: d,
    });
  });

  ScrollTrigger.create({
    animation: state.tween.cleanup,
    trigger: '.section-11',
    id: 'cleanup',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleTextOut,
    trigger: '.section-12',
    id: 'bottleTextOut',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleEmpty,
    trigger: '.section-13',
    id: 'bottleEmpty',
    onLeave() {
      stopWave();
      clear(state.ctx.bottleWave);
    },
    onEnterBack: startWave,
  });

  // Setting up all the scrolltriggers for the animals.
  // 9 items.
  for (let i = 0; i < animalPaths.length - 1; i++) {
    const animal = animalPaths[i];
    ScrollTrigger.create({
      animation: state.tween[animal.name],
      trigger: `.section-${14 + i}`,
      id: animal.name,
    });
  }

  ScrollTrigger.create({
    animation: state.tween.bottleFill,
    trigger: '.section-22',
    id: 'bottleFill',
    onLeave: stopWave,
    onEnterBack: startWave,
  });

  // 3 items.
  bottleColours.forEach((d, i) => {
    ScrollTrigger.create({
      animation: state.tween[d.name],
      trigger: `.section-${23 + i}`,
      id: d.name,
    });
  });

  ScrollTrigger.create({
    animation: state.tween.bottleGrid,
    trigger: '.section-26',
    id: 'bottleGrid',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleGridColour,
    trigger: '.section-27',
    id: 'bottleGridColour',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleGridSort,
    trigger: '.section-28',
    id: 'bottleGridSort',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleGridOut,
    trigger: '.section-29',
    id: 'bottleGridOut',
    // glassBottle shows the dataset.
    onEnterBack: () => clear(state.ctx.glassBottle),
  });

  // Setting up all the scrolltriggers for the dataset.
  // We set up a scrolltrigger/tween for each column and the grid.
  // 13 items.
  state.dataset.info.forEach((d, i) => {
    ScrollTrigger.create({
      animation: state.tween[d.tween],
      trigger: `.section-${30 + i}`,
      id: d.tween,
    });
  });

  ScrollTrigger.create({
    animation: state.tween.globe,
    trigger: '.section-44',
    end: '95% center',
    id: 'globe',
    onEnter: () => clear(state.ctx.glassBottle),
    onUpdate: self => (state.globe.scroll.progress = self.progress),
  });

  ScrollTrigger.create({
    trigger: '.section-45',
    id: 'statsLattice',
    onLeaveBack: simulateGlobePosition,
    onEnter: simulateLattice,
  });

  ScrollTrigger.create({
    trigger: '.section-46',
    id: 'statsAlcohol',
    onLeaveBack: simulateLattice,
    onEnter: simulateAlcohol,
  });

  ScrollTrigger.create({
    trigger: '.section-47',
    id: 'statsDensity',
    onLeaveBack: simulateAlcohol,
    onEnter: simulateDensity,
  });

  ScrollTrigger.create({
    trigger: '.section-48',
    id: 'statsCitric',
    onLeaveBack: simulateDensity,
    onEnter: simulateCitric,
  });

  ScrollTrigger.create({
    trigger: '.section-49',
    id: 'statsPh',
    onLeaveBack: simulateCitric,
    onEnter: simulatePh,
  });

  ScrollTrigger.create({
    trigger: '.section-50',
    id: 'statsVolatile',
    onLeaveBack: simulatePh,
    onEnter: simulateVolatile,
  });

  ScrollTrigger.create({
    trigger: '.section-51',
    id: 'statsQuality',
    onLeaveBack: simulateVolatile,
    onEnter: simulateQuality,
  });

  ScrollTrigger.create({
    trigger: '.section-52',
    id: 'qualityDots',
    onLeaveBack: () => (state.stats.colourDots = false),
    onEnter: () => (state.stats.colourDots = true),
  });

  ScrollTrigger.create({
    trigger: '.section-53',
    id: 'statsAlcoholColoured',
    onLeaveBack: simulateQuality,
    onEnter: simulateAlcohol,
  });

  ScrollTrigger.create({
    trigger: '.section-54',
    id: 'statsAlcoholQuality',
    onLeaveBack: simulateAlcohol,
    onEnter: simulateQualAlc,
  });

  ScrollTrigger.create({
    trigger: '.section-55',
    id: 'statsDrawLR',
    onLeaveBack: () => {
      state.stats.lr = false;
      simulateQualAlc();
    },
    onEnter: () => (state.stats.lr = true),
    onUpdate(self) {
      state.stats.progress.draw = self.progress;
      renderStats();
    },
  });

  ScrollTrigger.create({
    trigger: '.section-56',
    id: 'statsDrawLRPoint',
    onUpdate(self) {
      state.stats.progress.point = self.progress;
      renderStats();
    },
  });

  ScrollTrigger.create({
    trigger: '.section-57',
    id: 'statsExtendLR',
    onUpdate(self) {
      state.stats.progress.extend = self.progress;
      renderStats();
    },
  });

  ScrollTrigger.create({
    trigger: '.section-58',
    id: 'statsQualityBinarayAlcohol',
    onLeaveBack: simulateQualAlc,
    onEnter: simulateQualBinAlc,
  });

  ScrollTrigger.create({
    trigger: '.section-59',
    id: 'statsLogisticLine',
    onLeaveBack: simulateQualBinAlc, // TODO: necessary as we do it in the next one too?
    onUpdate(self) {
      state.stats.progress.logistic = self.progress;
      renderStats();
    },
  });

  ScrollTrigger.create({
    trigger: '.section-60',
    id: 'statsRemove',
    onLeaveBack() {
      state.stats.lr = true;
      tweenStatsAlpha(1); // Switch the global alpha back on.
      simulateQualBinAlc();
    },
    onEnter() {
      state.stats.lr = false;
      simulateRemove();
    },
  });

  ScrollTrigger.create({
    animation: state.tween.importance,
    trigger: '.section-61',
    id: 'importance',
    // Stop the simulation as it would otherwise
    // continue to draw on the context.
    onEnter: () => sim.stop(),
    onEnterBack: () => clear(state.ctx.bottleWave), // 1
  });

  ScrollTrigger.create({
    animation: state.tween.importanceRemove,
    trigger: '.section-62',
    id: 'importanceRemove',
  });

  ScrollTrigger.create({
    animation: state.tween.modelBottleIn,
    trigger: '.section-63',
    id: 'modelBottleIn',
    onEnterBack: () => clear(state.ctx.bottleWave), // 1
  });

  ScrollTrigger.create({
    trigger: '.section-64',
    id: 'modelWaveInit',
    onLeaveBack() {
      stopModelWave();
    },
    onUpdate: self => updateModelWave(self),
  });

  // Recalculate all scroll positions.
  ScrollTrigger.refresh();
}

// Main function.
function update(wineScapeImg) {
  state.scape.image = wineScapeImg;

  updateDimensions();
  setVisualStructure();
  updateTransforms();
  buildModelControls();

  tweenWineScape();
  tweenGlassBottle();
  tweenBottleText();
  tweenBottleWave();
  tweenLolliChart();
  tweenLolliUpdate1();
  tweenLolliUpdate2();
  tweenLolliUpdate3();
  tweenBlackBox();
  tweenCleanup();
  tweenBottleEmpty();
  tweenBottleTextOut();
  tweenAnimals();
  tweenBottleFill();
  tweenBottleColour();
  tweenBottleGrid();
  tweenBottleGridColour();
  tweenBottleGridSort();
  tweenBottleGridOut();
  tweenDataset();
  tweenGlobe();
  tweenStats();
  tweenImportance();
  tweenModelBottle();

  setScroll();
  checkModelWave();
}

export default update;

// 1. A bit of a tenacious context that gets easily stuck
//    when racing back. So better safely removing it twice...
