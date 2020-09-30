/* eslint-disable import/no-duplicates */
/* eslint-disable no-param-reassign */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import state from './state';
import { setWrapHeight, resizeCanvas, getTransform } from './utils';
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
import tweenBlackBox from '../tweens/blackBox';
import tweenCleanup from '../tweens/cleanup';
import tweenBottleEmpty from '../tweens/bottleEmpty';
import tweenBottleTextOut from '../tweens/bottleTextOut';
import tweenAnimals from '../tweens/animals';
import tweenBottleFill from '../tweens/bottleFill';
import tweenBottleColour from '../tweens/bottleColour';
import tweenBottleGrid from '../tweens/bottleGrid';
import tweenBottleGridColour from '../tweens/bottleGridColour';
import tweenBottleGridSort from '../tweens/bottleGridSort';
import tweenBottleGridOut from '../tweens/bottleGridOut';
import tweenDataset from '../tweens/dataset';

import tweenGlobe from '../tweens/globe';
import tweenStats, {
  simulateLatticeEnter,
  simulateLatticeLeaveBack,
} from '../tweens/stats';

// Set ScrollTrigger defaults.
ScrollTrigger.defaults({
  scroller: '#text-wrap',
  start: 'top center',
  end: 'center center',
  scrub: true,
  toggleActions: 'play none none reverse',
  markers: true,
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

// Set off canvas factory.
function setVisualStructure() {
  // Get contexts.
  const contextnames = [
    'scape',
    'glassBottle',
    'bottleText',
    'bottleWave',
    'lolli',
    'blackBox',
    'globe',
  ];

  updateContexts(contextnames);
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

  // The animal data.
  const animals = [
    { name: 'pig', fit: { width: 0.5, height: 0 } },
    { name: 'croc', fit: { width: 0.5, height: 0 } },
    { name: 'giraffe', fit: { width: 0.5, height: 0 } },
    { name: 'sloth1', fit: { width: 0.5, height: 0 } },
    { name: 'whale', fit: { width: 0.5, height: 0 } },
    { name: 'bird', fit: { width: 0.5, height: 0 } },
    { name: 'sloth2', fit: { width: 0.5, height: 0 } },
  ];

  // Get a transform for each animal based on its getBBox dimensions.
  animals.forEach(animal => {
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
  // // Create the scroll triggers.
  // ScrollTrigger.create({
  //   animation: state.tween.wineScape,
  //   trigger: '.section-1',
  //   id: 'wineScape',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.glassBottle,
  //   trigger: '.section-2',
  //   id: 'glassBottle',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleText,
  //   trigger: '.section-3',
  //   id: 'bottleText',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleWave,
  //   trigger: '.section-4',
  //   id: 'bottleWave',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.lolliChart,
  //   trigger: '.section-5',
  //   id: 'lolliChart',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.lolliUpdate1,
  //   trigger: '.section-6',
  //   id: 'lolliUpdate1',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.lolliUpdate2,
  //   trigger: '.section-7',
  //   id: 'lolliUpdate2',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.lolliUpdate3,
  //   trigger: '.section-8',
  //   id: 'lolliUpdate3',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.blackBox,
  //   trigger: '.section-9',
  //   id: 'blackBox',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.cleanup,
  //   trigger: '.section-10',
  //   id: 'cleanup',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleTextOut,
  //   trigger: '.section-11',
  //   id: 'bottleTextOut',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleEmpty,
  //   trigger: '.section-12',
  //   id: 'bottleEmpty',
  //   onLeave: stopWave,
  //   onEnterBack: startWave,
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.animals,
  //   trigger: '.section-13',
  //   id: 'animals',
  //   end: 'bottom center',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleFill,
  //   trigger: '.section-14',
  //   id: 'bottleFill',
  //   onLeave: stopWave,
  //   onEnterBack: startWave,
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleColour,
  //   trigger: '.section-15',
  //   id: 'bottleColour',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleGrid,
  //   trigger: '.section-16',
  //   id: 'bottleGrid',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleGridColour,
  //   trigger: '.section-17',
  //   id: 'bottleGridColour',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleGridSort,
  //   trigger: '.section-18',
  //   id: 'bottleGridSort',
  // });

  // ScrollTrigger.create({
  //   animation: state.tween.bottleGridOut,
  //   trigger: '.section-19',
  //   id: 'bottleGridOut',
  // });

  // // Setting up all the scrolltriggers for the dataset.
  // // We set up a scrolltrigger/tween for each column and the grid.
  // state.dataset.info.forEach((d, i) => {
  //   ScrollTrigger.create({
  //     animation: state.tween[d.tween],
  //     trigger: `.section-${20 + i}`, // first section +1
  //     id: d.tween,
  //   });
  // });

  ScrollTrigger.create({
    animation: state.tween.globe,
    // trigger: '.section-33',
    trigger: '.section-1',
    end: '95% center',
    id: 'globe',
    onUpdate(self) {
      state.globe.scroll.progress = self.progress;
      state.globe.scroll.direction = self.direction;
    },
  });

  ScrollTrigger.create({
    trigger: '.section-2',
    id: 'statsLattice',
    onEnter: simulateLatticeEnter,
    onLeaveBack: simulateLatticeLeaveBack,
  });

  // Recalculate all scroll positions.
  ScrollTrigger.refresh();
}

// Main function.
function update(wineScapeImg) {
  state.scape.image = wineScapeImg;

  setWrapHeight();
  updateDimensions();
  setVisualStructure();
  updateTransforms();

  // tweenWineScape();
  // tweenGlassBottle();
  // tweenBottleText();
  // tweenBottleWave();
  // tweenLolliChart();
  // tweenLolliUpdate1();
  // tweenLolliUpdate2();
  // tweenLolliUpdate3();
  // tweenBlackBox();
  // tweenCleanup();
  // tweenBottleEmpty();
  // tweenBottleTextOut();
  // tweenAnimals();
  // tweenBottleFill();
  // tweenBottleColour();
  // tweenBottleGrid();
  // tweenBottleGridColour();
  // tweenBottleGridSort();
  // tweenBottleGridOut();
  // tweenDataset();
  tweenGlobe();
  tweenStats();

  setScroll();
}

export default update;
