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

const transform = {
  scape: null,
  glass: null,
  bottle: null,
  shape: null,
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
// -----------------

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
  transform.scape = getTransform(scapeDim, {
    width: 1,
    height: 0,
  });
  transform.glass = cloneDeep(transform.scape);
  transform.shape = cloneDeep(transform.scape);

  // Update bottle transform.
  const bottleDim = getBox(select('#bottle-path'));
  transform.bottle = getTransform(
    bottleDim,
    { width: 0, height: 0.8 },
    { x: 0.5, height: null }
  );
}

// Generic canvas image draw fn.
function drawImage(ctx, img, t, alpha) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.drawImage(img, 0, 0, img.width, img.height);
  ctx.restore();
}

// Generic morph draw function.
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

// Wine Scape set up
// -----------------

// Draw wine scape.
function drawWineScape() {
  const { alpha } = this.targets()[0];
  drawImage(ctx01, wineScape, transform.scape, alpha);
}

function defineTweenWineScape() {
  return gsap.to(
    { alpha: 0 },
    { duration: 5, alpha: 1, onUpdate: drawWineScape }
  );
}

function definedScrollWineScape() {
  // Create the scroll trigger.
  return ScrollTrigger.create({
    animation: tween.wineScape,
    trigger: '.section-1',
    scrub: true,
    toggleActions: 'play none none reverse',
  });
}

// Glass to bottle set up
// ----------------------

// Draw glass to bottle morph.
function drawGlassBottlePath(rawPath) {
  ctx02.strokeStyle = 'coral';
  drawPath(ctx02, rawPath, transform.shape);
}

// Change image transform function.
function updateTransform() {
  transform.shape = this.targets()[0];
}

function defineTweenGlassBottle() {
  const tl = gsap.timeline({ paused: true });

  const morph = gsap.to('#glass-path', {
    morphSVG: {
      shape: '#bottle-path',
      render: drawGlassBottlePath,
      updateTarget: false,
    },
  });

  const retransform = gsap.fromTo(
    transform.shape,
    {
      x: transform.glass.x,
      y: transform.glass.y,
      scale: transform.glass.scale,
    },
    {
      x: transform.bottle.x,
      y: transform.bottle.y,
      scale: transform.bottle.scale,
      onUpdate: updateTransform,
    }
  );

  tl.add(morph, 0).add(retransform, 0);

  return tl;
}

function defineScrollGlassBottle() {
  return ScrollTrigger.create({
    animation: tween.glassBottle,
    trigger: '.section-2',
    scrub: true,
    toggleActions: 'play none none reverse',
  });
}

// Tween functions
// ---------------

function tweenWineScape() {
  // Set this up for resize (get time and kill running timeline).
  // Note, this queries the timeline dangling off scrolltrigger, Doesn't work otherwise.
  const time = tween.wineScape ? scroll.wineScape.animation.time() : 0;
  if (tween.wineScape) tween.wineScape.kill();

  // Define timeline.
  tween.wineScape = gsap.timeline({ paused: true }).add(defineTweenWineScape());

  // Set time if we're on resize.
  tween.wineScape.time(time);

  // Create the scroll trigger.
  scroll.wineScape = scroll.wineScape || definedScrollWineScape();
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
}

// Main function.
function update(wineScapeImg) {
  wineScape = wineScapeImg;
  setWrapHeight();
  setVisualStructure();
  updateTransforms();

  tweenWineScape();
  tweenGlassBottle();
}

export default update;
