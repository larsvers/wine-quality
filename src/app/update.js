import { select, selection } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

// Utils
// -----

function isSelection(el) {
  if (typeof el === 'string') return false;
  if (el instanceof selection) return true;
  return false;
}

function getBox(el) {
  const sel = isSelection(el) ? el : select(el);
  return sel.node().getBBox();
}

function setTransform(el, t) {
  const sel = isSelection(el) ? el : select(el);
  sel
    .attr(
      'transform',
      `translate(${t.x}, ${t.y}), scale(${t.scale}, ${t.scale})`
    )
    .attr('data-svg-origin', '0 0');
}

/**
 * This fn calculates the translate and scale values for the object based on the parent visual's
 * dimensions. `fit` decides how big in relation to width or height it should be (width: 1 would
 * be full width). Note, it can only fit towards one measure as skewing is not worked in.
 * `pos` decides which x, y place it should have. Leave this empty if you want to centre the image.
 * @param { SVGRect|Object } object The object's bounding box - at least with width and height
 * @param { Object } fit  { width: 0-1, height: 0-1 } The percentage of the width or height the
 *                        object should fit with. One must be 0!
 * @param { Object } pos  { x: 0-1, y: 0-1 } The percentage of the width or height
 *                        x or y should be at
 * @returns { Object }    { x, y, scale } The translate and scale values to be used for positioning.
 */
function getTransform(object, fit, nudge) {
  if (fit.width !== 0 && fit.height !== 0)
    throw Error('One fit value must be 0');

  // Get the parent visual.
  const frame = select('#svg-main-container').node();
  const visual = {
    width: frame.offsetWidth,
    height: frame.offsetHeight,
  };

  // Establish the object scale. fit.width and fit.height decide the scale
  // in relation to either the height or the width. You can't have both,
  // becasue we won't skew. These two term ↓ don't become a sum, but one
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

  // Nice the values all up.
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    scale: Math.round(scale * 100) / 100,
  };
}

// State.
// ------

let part = 'glass';

const transform = {
  glass: null,
  bottle: null,
};

const tween = {
  glassBottle: { go: null, reverse: null },
};

// Update functions.
// -----------------

// Transforms.
function getGlassTransform() {
  const box = getBox(select('#scape-group path'));
  const fit = { width: 1, height: 0 };
  transform.glass = getTransform(box, fit);
}

function getBottleTransform() {
  const box = getBox(select('#bottle-path'));
  const fit = { width: 0, height: 0.3 };
  const nudge = { x: 0.5, height: null };
  transform.bottle = getTransform(box, fit, nudge);
}

function setTransforms() {
  setTransform(select('#scape-group'), transform.glass);
  if (part === 'glass') setTransform(select('#bottle-group'), transform.glass);
  if (part === 'bottle')
    setTransform(select('#bottle-group'), transform.bottle);
}

// Tweens.
function tweenBottle() {
  const t = transform;

  tween.glassBottle.go = gsap
    .timeline()
    .to('#shape-path', { duration: 2, morphSVG: '#bottle-path' }, 0)
    .to(
      '#bottle-group',
      {
        duration: 3,
        attr: {
          transform: `translate(${t.bottle.x}, ${t.bottle.y}) scale(${t.bottle.scale}, ${t.bottle.scale})`,
        },
      },
      0
    )
    .pause();

  tween.glassBottle.reverse = gsap
    .timeline()
    .to('#shape-path', { duration: 2, morphSVG: '#wine-glass-path' }, 0)
    .to(
      '#bottle-group',
      {
        duration: 3,
        attr: {
          transform: `translate(${t.glass.x}, ${t.glass.y}) scale(${t.glass.scale}, ${t.glass.scale})`,
        },
      },
      0
    )
    .pause();
}

function updateTweens() {
  tweenBottle();
}

// Listener/Handler.
function glassToBottle() {
  tween.glassBottle.go.restart(); // Make sure it's playing a second+ time.
  part = 'bottle';
}

function bottleToGlass() {
  tween.glassBottle.reverse.restart();
  part = 'glass';
}

function setListener() {
  select('#scape-to-bottle').on('click', glassToBottle);
  select('#bottle-to-scape').on('click', bottleToGlass);
}

// Main function.
function update() {
  getGlassTransform();
  getBottleTransform();
  setTransforms();
  updateTweens();
  setListener();
}

export default update;
