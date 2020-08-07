/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { select } from 'd3-selection/src/index';
import { range } from 'd3-array/src/index';
import { scalePoint } from 'd3-scale/src/index';
import { line, curveBasis } from 'd3-shape/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import state from './state';
import { getBox, setWrapHeight, getTransform, getWavePoints } from './utils';

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// State.
// ------

let wineScape;
let width;
let height;
let ctx00;
let ctx01;
let ctx02;
let ctx03;

const tween = {
  wineScape: null,
  glassBottle: null,
  textBottle: null,
  bottleWave: null,
};

ScrollTrigger.defaults({
  scroller: '#text-wrap',
  start: 'top center',
  end: 'center center',
  markers: true,
});

function resizeCanvas(canvas, container) {
  const context = canvas.getContext('2d');

  // Get the desired dimensions.
  width = container.offsetWidth;
  height = container.offsetHeight;

  // Give each device pixel an element and drawing surface pixel.
  // This should make it bigger for retina displays for example.
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;

  // Scale only the element's size down to the given width on the site.
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Scale the drawing surface (up).
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Update functions.
function setVisualStructure() {
  // Get elements.
  const container = document.querySelector('#canvas-main-container');
  const can00 = document.querySelector('#canvas-level-0');
  const can01 = document.querySelector('#canvas-level-1');
  const can02 = document.querySelector('#canvas-level-2');
  const can03 = document.querySelector('#canvas-level-3');

  // Get contexts.
  ctx00 = can00.getContext('2d');
  ctx01 = can01.getContext('2d');
  ctx02 = can02.getContext('2d');
  ctx03 = can03.getContext('2d');

  // Resize canvas.
  resizeCanvas(can00, container);
  resizeCanvas(can01, container);
  resizeCanvas(can02, container);
  resizeCanvas(can03, container);

  // Base measures (module scope).
  width = parseFloat(can00.style.width);
  height = parseFloat(can00.style.height);
}

function updateTransforms() {
  // Update all necessary transforms.

  // Update winescape image (and glass) transform.
  const scapeDim = { width: wineScape.width, height: wineScape.height };
  state.transform.scape = getTransform(scapeDim, {
    width: 1,
    height: 0,
  });
  state.transform.shape = cloneDeep(state.transform.scape);

  // Update bottle transform.
  const bottleDim = getBox(select('#bottle-path'));
  state.transform.bottle = getTransform(
    bottleDim,
    { width: 0, height: 0.8 },
    { x: 0.5, height: null }
  );
}

// Canvas draw functions.
function drawImage(ctx, img, t, alpha) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.drawImage(img, 0, 0, img.width, img.height);
  ctx.restore();
}

function drawPath(ctx, path, t) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const l = segment.length;
    ctx.moveTo(segment[0], segment[1]);
    for (let j = 2; j < l; j += 6) {
      ctx.bezierCurveTo(
        segment[j],
        segment[j + 1],
        segment[j + 2],
        segment[j + 3],
        segment[j + 4],
        segment[j + 5]
      );
    }
    if (segment.closed) {
      ctx.closePath();
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, paths, t, length, offset) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.setLineDash([length - offset, offset]);
  Array.isArray(paths)
    ? paths.forEach(path => ctx.stroke(path))
    : ctx.stroke(paths);
  ctx.restore();
}

function drawPathSimple(ctx, path, t) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  // Clip path.
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, (1 - state.lift) * height);
  ctx.lineTo(width, (1 - state.lift) * height);
  ctx.closePath();
  ctx.clip();

  // Background.
  ctx.fill(path);

  ctx.restore();
}

// Render functions.
function drawScape() {
  requestAnimationFrame(() =>
    drawImage(ctx00, wineScape, state.transform.scape, state.alpha)
  );
}

function drawBottle() {
  ctx01.strokeStyle = state.colour;
  requestAnimationFrame(() => {
    drawImage(ctx00, wineScape, state.transform.scape, state.alpha);
    drawPath(ctx01, state.path, state.transform.shape);
  });
}

function drawBottleText() {
  ctx02.strokeStyle = state.colour;
  requestAnimationFrame(() => {
    drawImage(ctx00, wineScape, state.transform.scape, state.alpha);
    drawPath(ctx01, state.path, state.transform.shape);
    drawText(
      ctx02,
      state.bottleTexts,
      state.transform.shape,
      state.maxBottlePathLength,
      state.dash.offset
    );
  });
}

function drawBottleWave() {
  ctx03.fillStyle = state.colour;
  requestAnimationFrame(() => {
    drawImage(ctx00, wineScape, state.transform.scape, state.alpha);
    drawPath(ctx01, state.path, state.transform.shape);
    drawText(
      ctx02,
      state.bottleTexts,
      state.transform.shape,
      state.maxBottlePathLength,
      state.dash.offset
    );
    drawPathSimple(ctx03, state.bottlePath, state.transform.shape);
  });
}

// Timeline set up.
function defineTweenWineScape() {
  const tl = gsap.timeline({ onUpdate: drawScape });
  const imagealpha = gsap.fromTo(state, { alpha: 0 }, { alpha: 1 });
  return tl.add(imagealpha, 0);
}

function defineTweenGlassBottle() {
  const tl = gsap.timeline({ onUpdate: drawBottle });

  const morph = gsap.to('#glass-path', {
    morphSVG: {
      shape: '#bottle-path',
      map: 'complexity',
      render(path) {
        state.path = path;
      },
      updateTarget: false,
    },
  });

  const colourvalue = gsap.fromTo(
    state,
    { colour: 'rgba(0, 0, 0, 0)' },
    {
      colour: 'rgba(0, 0, 0, 1)',
      ease: 'circ.out',
    }
  );

  const retransform = gsap.fromTo(
    state.transform.shape,
    {
      x: state.transform.scape.x,
      y: state.transform.scape.y,
      scale: state.transform.scape.scale,
    },
    {
      x: state.transform.bottle.x,
      y: state.transform.bottle.y,
      scale: state.transform.bottle.scale,
      ease: 'none',
    }
  );

  const imagealpha = gsap.fromTo(state, { alpha: 1 }, { alpha: 0.2 });

  return tl
    .add(retransform, 0)
    .add(colourvalue, 0)
    .add(morph, 0)
    .add(imagealpha, 0);
}

function defineTweenTextBottle() {
  const tl = gsap.timeline({ onUpdate: drawBottleText });

  const offset = gsap.fromTo(
    state.dash,
    { offset: state.maxBottlePathLength },
    { offset: 0 }
  );

  const colourvalue = gsap.fromTo(
    state,
    { colour: 'rgba(0, 0, 0, 0)' },
    {
      colour: 'rgba(0, 0, 0, 1)',
      ease: 'circ.out',
    }
  );

  return tl.add(offset, 0).add(colourvalue, 0);
}

// The wave...
// -----------
const n = 20;
const xWaveScale = scalePoint(range(20), [0, width]);
const waveLineGen = line()
  .x(d => d[0])
  .y(d => d[1])
  .curve(curveBasis);

function makeWave(time, deltaTime, frame) {
  state.wavePoints = range(n).map((d, i) => {
    let xy = getWavePoints(15, 0.5, 2, xWaveScale(d), state.lift, time / 1000);
    if (i === 0) xy[0] = 0;
    if (i === n - 1) xy[0] = width;
    return xy;
  });
}

function startWave() {
  gsap.ticker.add(makeWave);
}

function defineTweenBottleWave() {
  const tl = gsap.timeline({
    onUpdate: drawBottleWave,
    onStart: startWave,
  });

  const bottlefill = gsap.fromTo(
    state,
    { colour: 'rgba(0, 0, 0, 0)' },
    {
      colour: 'rgba(0, 0, 0, 1)',
      ease: 'circ.out',
    }
  );

  const lift = gsap.fromTo(state, { lift: 0 }, { lift: 1 });

  return tl.add(bottlefill, 0).add(lift, 0);
}

// Animation kill and rebuild.
function tweenWineScape() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('wineScape');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (tween.wineScape) tween.wineScape.kill();
  tween.wineScape = defineTweenWineScape();
  tween.wineScape.totalProgress(progress);
}

function tweenGlassBottle() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('glassBottle');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (tween.glassBottle) tween.glassBottle.kill();
  tween.glassBottle = defineTweenGlassBottle();
  tween.glassBottle.totalProgress(progress);
}

function tweenTextBottle() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('textBottle');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (tween.textBottle) tween.textBottle.kill();
  tween.textBottle = defineTweenTextBottle();
  tween.textBottle.totalProgress(progress);
}

function tweenBottleWave() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleWave');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (tween.textBottle) tween.textBottle.kill();
  tween.bottleWave = defineTweenBottleWave();
  tween.bottleWave.totalProgress(progress);
}

function setScroll() {
  // Create the scroll triggers.
  ScrollTrigger.create({
    animation: tween.wineScape,
    trigger: '.section-1',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'wineScape',
  });

  ScrollTrigger.create({
    animation: tween.glassBottle,
    trigger: '.section-2',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'glassBottle',
  });

  ScrollTrigger.create({
    animation: tween.textBottle,
    trigger: '.section-3',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'textBottle',
  });

  ScrollTrigger.create({
    animation: tween.bottleWave,
    trigger: '.section-4',
    scrub: true,
    toggleActions: 'play none none reverse',
    id: 'bottleWave',
  });

  // Recalculate all scroll positions.
  ScrollTrigger.refresh();
}

// Main function.
function update(wineScapeImg) {
  wineScape = wineScapeImg;
  setWrapHeight();
  setVisualStructure();
  updateTransforms();

  tweenWineScape();
  tweenGlassBottle();
  tweenTextBottle();
  tweenBottleWave();

  setScroll();
}

export default update;
