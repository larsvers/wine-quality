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

/**
 * Drwa canvas arrows. From:
 * (https://riptutorial.com/html5-canvas/example/18138/cubic---quadratic-bezier-curve-with-arrowheads)
 * @param { objecr } ctx Canvas context to draw on.
 * @param { object } p0 {x, y} control point - start
 * @param { object } p1 {x, y} control point - control quadratic
 * @param { object } p2 {x, y} control point - end
 * @param { object } p3 {x, y} control point - control cubic if defined
 * @param { number } arrowLength Length of arrow head
 * @param { boolean } hasStartArrow Add start arrow
 * @param { boolean } hasEndArrow Add end arrow
 */
function bezWithArrowheads(
  ctx,
  p0,
  p1,
  p2,
  p3,
  arrowLength,
  hasStartArrow,
  hasEndArrow
) {
  let x;
  let y;
  let norm;
  let ex;
  let ey;
  function pointsToNormalisedVec(p, pp) {
    let len;
    norm.y = pp.x - p.x;
    norm.x = -(pp.y - p.y);
    len = Math.sqrt(norm.x * norm.x + norm.y * norm.y);
    norm.x /= len;
    norm.y /= len;
    return norm;
  }

  const arrowWidth = arrowLength / 2;
  norm = {};
  // defaults to true for both arrows if arguments not included
  hasStartArrow =
    hasStartArrow === undefined || hasStartArrow === null
      ? true
      : hasStartArrow;
  hasEndArrow =
    hasEndArrow === undefined || hasEndArrow === null ? true : hasEndArrow;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  if (p3 === undefined) {
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ex = p2.x; // get end point
    ey = p2.y;
    norm = pointsToNormalisedVec(p1, p2);
  } else {
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ex = p3.x; // get end point
    ey = p3.y;
    norm = pointsToNormalisedVec(p2, p3);
  }
  if (hasEndArrow) {
    x = arrowWidth * norm.x + arrowLength * -norm.y;
    y = arrowWidth * norm.y + arrowLength * norm.x;
    ctx.moveTo(ex + x, ey + y);
    ctx.lineTo(ex, ey);
    x = arrowWidth * -norm.x + arrowLength * -norm.y;
    y = arrowWidth * -norm.y + arrowLength * norm.x;
    ctx.lineTo(ex + x, ey + y);
  }
  if (hasStartArrow) {
    norm = pointsToNormalisedVec(p0, p1);
    x = arrowWidth * norm.x - arrowLength * -norm.y;
    y = arrowWidth * norm.y - arrowLength * norm.x;
    ctx.moveTo(p0.x + x, p0.y + y);
    ctx.lineTo(p0.x, p0.y);
    x = arrowWidth * -norm.x - arrowLength * -norm.y;
    y = arrowWidth * -norm.y - arrowLength * norm.x;
    ctx.lineTo(p0.x + x, p0.y + y);
  }

  ctx.stroke();
}

export {
  isSelection,
  getBox,
  setWrapHeight,
  getTransform,
  splitPath,
  getPathDims,
  getPathData,
  bezWithArrowheads,
};
