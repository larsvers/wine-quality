/* eslint-disable no-param-reassign */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import state from './state';
import { setWrapHeight, getTransform } from './utils';
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
import tweenBottleZoomOut from '../tweens/bottleZoomOut';

// Set ScrollTrigger defaults.
ScrollTrigger.defaults({
  scroller: '#text-wrap',
  start: 'top center',
  end: 'center center',
  scrub: true,
  toggleActions: 'play none none reverse',
  markers: true,
});

// Update functions.
function resizeCanvas(canvas, container) {
  const context = canvas.getContext('2d');

  // Get the desired dimensions.
  state.width = container.offsetWidth;
  state.height = container.offsetHeight;

  // Give each device pixel an element and drawing surface pixel.
  // This should make it bigger for retina displays for example.
  canvas.width = state.width * window.devicePixelRatio;
  canvas.height = state.height * window.devicePixelRatio;

  // Scale only the element's size down to the given width on the site.
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;

  // Scale the drawing surface (up).
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Get contexts and rezize canvases.
function updateContexts(names) {
  const container = document.querySelector('#canvas-main-container');
  const canvases = document.querySelectorAll('canvas');
  names.forEach((name, i) => {
    state.ctx[name] = canvases[i].getContext('2d');
    resizeCanvas(canvases[i], container);
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
  });

  ScrollTrigger.create({
    animation: state.tween.blackBox,
    trigger: '.section-9',
    id: 'blackBox',
  });

  ScrollTrigger.create({
    animation: state.tween.cleanup,
    trigger: '.section-10',
    id: 'cleanup',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleTextOut,
    trigger: '.section-11',
    id: 'bottleTextOut',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleEmpty,
    trigger: '.section-12',
    id: 'bottleEmpty',
    onLeave: stopWave,
    onEnterBack: startWave,
  });

  ScrollTrigger.create({
    animation: state.tween.animals,
    trigger: '.section-13',
    id: 'animals',
    end: 'bottom center',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleFill,
    trigger: '.section-14',
    id: 'bottleFill',
    onLeave: stopWave,
    onEnterBack: startWave,
  });

  ScrollTrigger.create({
    animation: state.tween.bottleColour,
    trigger: '.section-15',
    id: 'bottleColour',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleZoomOut,
    trigger: '.section-16',
    id: 'bottleZoomOut',
  });

  // Recalculate all scroll positions.
  ScrollTrigger.refresh();
}

// Main function.
function update(wineScapeImg) {
  state.scape.image = wineScapeImg;
  setWrapHeight();
  setVisualStructure();
  updateTransforms();

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
  tweenBottleZoomOut();

  setScroll();
}

export default update;
