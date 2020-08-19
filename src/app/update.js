/* eslint-disable no-param-reassign */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import state from './state';
import { setWrapHeight, getTransform } from './utils';

import tweenWineScape from '../tweens/wineScape';
import tweenGlassBottle from '../tweens/glassBottle';
import tweenBottleText from '../tweens/bottleText';
import tweenBottleWave from '../tweens/bottleWave';
import tweenLolliChart from '../tweens/lolliChart';

ScrollTrigger.defaults({
  scroller: '#text-wrap',
  start: 'top center',
  end: 'center center',
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

function setVisualStructure() {
  // Get elements.
  const container = document.querySelector('#canvas-main-container');
  const can00 = document.querySelector('#canvas-level-0');
  const can01 = document.querySelector('#canvas-level-1');
  const can02 = document.querySelector('#canvas-level-2');
  const can03 = document.querySelector('#canvas-level-3');
  const can04 = document.querySelector('#canvas-level-4');

  // Get contexts.
  state.ctx.scape = can00.getContext('2d');
  state.ctx.glassBottle = can01.getContext('2d');
  state.ctx.bottleText = can02.getContext('2d');
  state.ctx.bottleWave = can03.getContext('2d');
  state.ctx.lolli = can04.getContext('2d');

  // Resize canvas.
  resizeCanvas(can00, container);
  resizeCanvas(can01, container);
  resizeCanvas(can02, container);
  resizeCanvas(can03, container);
  resizeCanvas(can04, container);
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
}

function setScroll() {
  // Create the scroll triggers.
  ScrollTrigger.create({
    animation: state.tween.wineScape,
    trigger: '.section-1',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'wineScape',
  });

  ScrollTrigger.create({
    animation: state.tween.glassBottle,
    trigger: '.section-2',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'glassBottle',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleText,
    trigger: '.section-3',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'bottleText',
  });

  ScrollTrigger.create({
    animation: state.tween.bottleWave,
    trigger: '.section-4',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'bottleWave',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliChart,
    trigger: '.section-5',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'lolliChart',
  });

  ScrollTrigger.create({
    animation: state.tween.lolliUpdate,
    trigger: '.section-6',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'lolliUpdate',
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

  setScroll();
}

export default update;
