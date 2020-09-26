/* eslint-disable import/no-mutable-exports */
import { max } from 'd3-array/src/index';
import { select, selection } from 'd3-selection/src/index';

function isSelection(el) {
  if (typeof el === 'string') return false;
  if (el instanceof selection) return true;
  return false;
}

/**
 * Get the bounding box of either a DOM element, a D3 selection
 *  or a path string. Either `el` or `path` needs to be falsey.
 * @param { node|selection } el either a DOM node or a D3 selection
 * @param { string } path an svg path
 * @return An SVG rect with (most importantly) width and height
 */
function getBox(el, path) {
  let box;
  if (el) {
    const sel = isSelection(el) ? el : select(el);
    box = sel.node().getBBox();
  } else if (path) {
    const domPath = select('body')
      .append('svg')
      .attr('class', 'svg-temp')
      .append('path')
      .attr('d', path);

    box = domPath.node().getBBox();
    domPath.remove();
  } else {
    throw Error('Either el or path must be defined');
  }
  return box;
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
 * @param { Object } pos  { x: 0-1, y: 0-1 } The percentage of the full width or height
 *                        x or y should be at. 1 represents the centre. Optional.
 * @returns { Object }    { x, y, scale } The translate and scale values to be used for positioning.
 */
function getTransform(object, fit, nudge) {
  if (fit.width !== 0 && fit.height !== 0)
    throw Error('One fit value must be 0');

  // Get the parent visual.
  const frame = document.querySelector('#canvas-main-container');
  const visual = {
    width: frame.clientWidth,
    height: frame.clientHeight,
  };

  // Establish the object scale. fit.width and fit.height decide the scale
  // in relation to either the height or the width. You can't have both,
  // becasue we don't skew. These two terms ↓ don't become a sum, but one
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
  // expressed  as % of width and/or height. 1 would be full width/height,
  // 0.5 would be the (default) centre and 0.25 half the centre (25% width).
  if (nudge && nudge.x) position.x *= nudge.x * 2; // *2 as the default position
  if (nudge && nudge.y) position.y *= nudge.y * 2; // is the centre (see above).

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

function getPathDims(pathData) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  const domPath = select('#stage-group')
    .append('path')
    .attr('class', 'remove')
    .attr('d', pathData);
  const dims = domPath.node().getBBox();
  const pathDims = {
    x: Math.round(dims.x),
    y: Math.round(dims.y),
    width: Math.round(dims.width),
    height: Math.round(dims.height),
    length: Math.round(path.getTotalLength() || 0),
  };
  domPath.remove();

  return pathDims;
}

function getPathData(path) {
  const splitPaths = splitPath(path);
  const paths = splitPaths.map(p => new Path2D(p));
  const dims = splitPaths.map(getPathDims);
  const length = max(dims, d => d.length);
  const offset = length;
  return { paths, dims, length, offset };
}

export {
  isSelection,
  getBox,
  setWrapHeight,
  getTransform,
  splitPath,
  getPathDims,
  getPathData,
};
