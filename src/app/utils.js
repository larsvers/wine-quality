/* eslint-disable import/no-mutable-exports */
import { select, selection } from 'd3-selection/src/index';
import { scaleLinear } from 'd3-scale/src/index';

function isSelection(el) {
  if (typeof el === 'string') return false;
  if (el instanceof selection) return true;
  return false;
}

function getBox(el) {
  const sel = isSelection(el) ? el : select(el);
  return sel.node().getBBox();
}

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

/**
 * Splits the path at the M commands.
 * Much more readable than reduce 🥂.
 * @param { String } path
 * @returns { Array } an array of paths
 */
function splitPath(path) {
  return path
    .split('M')
    .filter(d => d)
    .map(d => `M${d}`);
}

function getPathLength(pathData) {
  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  return path.getTotalLength() || 0;
}

// Need xScale in init and update
// but only want to set it once (in init).
let xScale;
function setScaleX(domain, range) {
  xScale = scaleLinear()
    .domain(domain)
    .range(range);
}

function getWavePoints(r, alpha, beta, x0, y0, t) {
  let arg = alpha * x0 + beta * t;
  let x = x0 + r * Math.cos(arg);
  let y = y0 + r * Math.sin(arg);
  return [x, y];
}

export {
  isSelection,
  getBox,
  setWrapHeight,
  getTransform,
  splitPath,
  getPathLength,
  setScaleX,
  xScale,
  getWavePoints,
};
