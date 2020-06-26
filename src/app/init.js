import { select, selection } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { splitPathString, toPathString } from 'flubber/index';
import scape from '../../static/wine-scape-s';
import glass from '../../static/wine-glass';
import bottle from '../../static/wine-bottle';

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
  sel.attr(
    'transform',
    `translate(${t.x}, ${t.y}), scale(${t.scale}, ${t.scale})`
  );
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
function getTransform(object, fit, pos) {
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

  // Establish the object's position. There's pos.width and pos.height,
  // both expressed as % of the width or the height. The percentages
  // will be transformed to x and y. If pos is undefined or set to false,
  // the object will be centered.
  let position = { x: null, y: null };
  if (pos) {
    position.x = visual.width * pos.x;
    position.y = visual.height * pos.y;
  } else {
    position.x = visual.width / 2 - (object.width * scale) / 2;
    position.y = visual.height / 2 - (object.height * scale) / 2;
  }

  // Nice the values all up.
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    scale: Math.round(scale * 100) / 100,
  };
}

function updateImage() {
  const imageGroup = select('#image-group');
  const box = getBox(imageGroup.select('path'));
  const fit = { width: 1, height: 0 };
  const transform = getTransform(box, fit);
  setTransform(imageGroup, transform);
}

function glassToBottle() {
  gsap.to('#wine-glass', { duration: 3, morphSVG: '#bottle' });
}

function resize() {
  updateImage();
}

function init() {
  const svg = select('#svg-main');
  const group = svg.append('g').attr('id', 'image-group');

  // Full wine scape svg.
  group
    .append('path')
    .attr('id', 'wine-scape-path')
    .attr('d', scape)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');

  updateImage();

  // To animate scape to bottle:

  // 1. Overlay scape path with glass path
  // 2. Add bottle path - hide it.
  // 3. On button click:
  // 3.1 Calculate end transform values for path
  // 3.2 Animate
  // 3.2.1 morph bottle to glass
  // 3.2.2 animate group transform values

  // General architecture:

  // init() just add all paths you want to show or might want to transition to
  // resize() whatever we have to run if we want to resize things
  // listner() setting up the listener (run from init)
  // handler() all the handling / animations (could be in ther own, see when you get there)

  // // Just glass section from wine scape svg.
  // group
  //   .append('path')
  //   .attr('id', 'wine-glass')
  //   .attr('d', glass)
  //   .style('fill', 'none')
  //   .style('stroke-width', 1)
  //   .style('stroke', 'red');

  // // The bottle as morph target (hidden).
  // svg
  //   .append('path')
  //   .attr('d', bottle)
  //   .attr('id', 'bottle')
  //   .style('fill', 'none')
  //   .style('stroke-width', 1)
  //   .style('visibility', 'none');

  window.addEventListener('resize', resize);
  select('#scape-to-bottle').on('click', glassToBottle);
}

export default init;
