/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { select } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import state from './state';
import { getBox, setWrapHeight, getTransform } from './utils';

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// State.
// ------

let wineScape;
let width;
let height;
let ctx01;
let ctx02;
let ctx03;

const tween = {
  wineScape: null,
  glassBottle: null,
  textBottle: null,
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
  const can01 = document.querySelector('#canvas-main');
  const can02 = document.querySelector('#canvas-level-1');
  const can03 = document.querySelector('#canvas-level-2');
  ctx01 = can01.getContext('2d');
  ctx02 = can02.getContext('2d');
  ctx03 = can03.getContext('2d');

  // Resize canvas.
  resizeCanvas(can01, container);
  resizeCanvas(can02, container);
  resizeCanvas(can03, container);

  // Base measures (module scope).
  width = parseFloat(can01.style.width);
  height = parseFloat(can01.style.height);
}

function updateTransforms() {
  // Update all necessary transforms.

  // Update winescape image (and glass) transform.
  const scapeDim = { width: wineScape.width, height: wineScape.height };
  state.transform.scape = getTransform(scapeDim, {
    width: 1,
    height: 0,
  });
  // transform.glass = cloneDeep(transform.scape);
  // transform.shape = cloneDeep(transform.scape);
  state.transform.shape = cloneDeep(state.transform.scape);

  // Update bottle transform.
  const bottleDim = getBox(select('#bottle-path'));
  // transform.bottle = getTransform(
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

function drawText(ctx, path, t, length, offset) {
  console.log('draw', length - offset, offset);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.setLineDash([length - offset, offset]);
  ctx.stroke(path);
  ctx.restore();
}

// Render functions.
function drawScape() {
  requestAnimationFrame(() =>
    drawImage(ctx01, wineScape, state.transform.scape, state.alpha)
  );
}

function drawBottle() {
  ctx02.strokeStyle = state.colour;
  requestAnimationFrame(() => {
    drawImage(ctx01, wineScape, state.transform.scape, state.alpha);
    drawPath(ctx02, state.path, state.transform.shape);
  });
}

function drawBottleText() {
  console.log('render', state.pathTextlength, state.dash.offset);
  requestAnimationFrame(() => {
    drawImage(ctx01, wineScape, state.transform.scape, state.alpha);
    drawPath(ctx02, state.path, state.transform.shape);
    drawText(
      ctx03,
      state.pathText,
      state.transform.shape,
      state.pathTextlength,
      state.dash.offset
    );
  });
}

// Timeline set up.
function defineTweenWineScape() {
  const tl = gsap.timeline({ onUpdate: drawScape });
  const imagealpha = gsap.fromTo(state, { alpha: 0 }, { alpha: 1 });
  tl.add(imagealpha, 0);

  return tl;
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

  tl.add(retransform, 0)
    .add(colourvalue, 0)
    .add(morph, 0)
    .add(imagealpha, 0);

  return tl;
}

function defineTweenTextBottle() {
  const tl = gsap.timeline({ onUpdate: drawBottleText });
  const offset = gsap.to(state.dash, { offset: 0 });
  tl.add(offset, 0);
  return tl;
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

  setScroll();
}

export default update;
