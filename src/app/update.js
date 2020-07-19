import { select } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import cloneDeep from 'lodash.clonedeep';
import { getBox } from './utils';

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

// Utils
// -----

/**
 * Set height of scrollydiv deterministically. It's flex-wrap, which
 * is a fucker to set otherwise (if at all possible).
 */
function setWrapHeight() {
  const contHeight = select('#text-container').node().offsetHeight;
  select('#text-wrap').style('height', `${contHeight}px`);
}

/**
 * This fn calculates the translate and scale values for the object based on the parent visual's
 * dimensions. `fit` decides how big in relation to width or height it should be (width: 1 would
 * be full width). Note, it can only fit towards one measure as skewing is not worked in.
 * `pos` decides which x, y place it should have. Leave this empty if you want to centre the image.
 * @param { SVGRect|Object } object The object's bounding box - at least with width and height. Required.
 * @param { Object } fit  { width: 0-1, height: 0-1 } The percentage of the width or height the
 *                        object should fit with. One must be 0! Required.
 * @param { Object } pos  { x: 0-1, y: 0-1 } The percentage of the width or height
 *                        x or y should be at. Optional.
 * @returns { Object }    { x, y, scale } The translate and scale values to be used for positioning.
 */
function getTransform(object, fit, nudge) {
  if (fit.width !== 0 && fit.height !== 0)
    throw Error('One fit value must be 0');

  // Get the parent visual.
  const frame = document.querySelector('#canvas-main-container');
  const visual = {
    width: frame.offsetWidth,
    height: frame.offsetHeight,
  };

  // Establish the object scale. fit.width and fit.height decide the scale
  // in relation to either the height or the width. You can't have both,
  // becasue we won't skew. These two terms ↓ don't become a sum, but one
  // will be 0 when the other one is not.
  const scale =
    (visual.width / object.width) * fit.width +
    (visual.height / object.height) * fit.height;

  // Establish the object's position. The default value is the centre:
  const position = {
    x: visual.width / 2 - (object.width * scale) / 2,
    y: visual.height / 2 - (object.height * scale) / 2,
  };

  // If `nudge` is defined, then `nudge.x` and `nudge.y` are both
  // expressed  as % of the central position. 1 would be just that,
  // 2 would be the end (100% width) 0.5 half the centre (0.25 % width).
  if (nudge && nudge.x) position.x *= nudge.x;
  if (nudge && nudge.y) position.y *= nudge.y;

  // Nice all the values up.
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    scale: Math.round(scale * 100) / 100,
  };
}

// State.
// ------

let wineScape;
let width;
let height;
let ctx01;
let ctx02;

const state = {
  path: null,
  colour: null,
  transform: {
    scape: null,
    bottle: null,
    shape: null,
  },
  alpha: null,
};

const tween = {
  wineScape: null,
  glassBottle: null,
};

const scroll = {
  wineScape: null,
  glassBottle: null,
};

ScrollTrigger.defaults({
  scroller: '#text-wrap',
  start: 'top center',
  end: 'center center',
  markers: true,
});

// Update functions.
function setVisualStructure() {
  // Get elements.
  const container = document.querySelector('#canvas-main-container');
  const can01 = document.querySelector('#canvas-main');
  const can02 = document.querySelector('#canvas-level-1');
  ctx01 = can01.getContext('2d');
  ctx02 = can02.getContext('2d');

  // Resize canvas.
  resizeCanvas(can01, container);
  resizeCanvas(can02, container);

  // Base measures (module scope).
  width = parseFloat(can01.style.width);
  height = parseFloat(can01.style.height);
}

function resizeCanvas(canvas, container) {
  const context = canvas.getContext('2d');

  // Get the desired dimensions.
  const width = container.offsetWidth;
  const height = container.offsetHeight;

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

  // Remove visual when before start trigger.
  if (
    !scroll.glassBottle ||
    scroll.glassBottle.scroll() <= scroll.glassBottle.start
  ) {
    ctx02.clearRect(0, 0, width, height);
  }
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
      render: path => (state.path = path),
      updateTarget: false,
    },
    id: 'morph',
  });

  const colourvalue = gsap.fromTo(
    state,
    { colour: 'rgba(0, 0, 0, 0.2)' },
    {
      colour: 'rgba(0, 0, 0, 1)',
      id: 'colour',
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
      id: 'transform',
    }
  );

  const imagealpha = gsap.fromTo(
    state,
    { alpha: 1 },
    {
      alpha: 0.2,
      id: 'alpha',
    }
  );

  tl.add(retransform, 0)
    .add(colourvalue, 0)
    .add(morph, 0)
    .add(imagealpha, 0);

  return tl;
}

// ScrollTrigger set up
function defineScrollWineScape() {
  // Create the scroll trigger.
  return ScrollTrigger.create({
    animation: tween.wineScape,
    trigger: '.section-1',
    scrub: true,
    toggleActions: 'play none none reverse',
  });
}

function defineScrollGlassBottle() {
  return ScrollTrigger.create({
    animation: tween.glassBottle,
    trigger: '.section-2',
    scrub: true,
    toggleActions: 'play none none reverse',
  });
}

// Animation kill and rebuild.
function tweenWineScape() {
  // Capture current progress.
  const progress = scroll.wineScape ? scroll.wineScape.progress : 0;

  // Kill old - set up new timeline.
  if (tween.wineScape) tween.wineScape.kill();
  tween.wineScape = defineTweenWineScape();
  tween.wineScape.totalProgress(progress);

  // Kill old - set up new scroll instance.
  if (scroll.wineScape) scroll.wineScape.kill();
  scroll.wineScape = defineScrollWineScape();
}

function tweenGlassBottle() {
  // Capture current progress.
  const progress = scroll.glassBottle ? scroll.glassBottle.progress : 0;

  // Kill old - set up new timeline.
  if (tween.glassBottle) tween.glassBottle.kill();
  tween.glassBottle = defineTweenGlassBottle();
  tween.glassBottle.totalProgress(progress);

  // Kill old - set up new scroll instance.
  if (scroll.glassBottle) scroll.glassBottle.kill();
  scroll.glassBottle = defineScrollGlassBottle();
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
  console.log(state);
}

export default update;
