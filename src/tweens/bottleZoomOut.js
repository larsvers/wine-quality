/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear } from 'd3-scale';
import clonedeep from 'lodash.clonedeep';

import state from '../app/state';
import { drawBottleWave } from './bottleWave';
import { drawBottle } from './glassBottle';

let rows = 15;
let cols = 15;
const smallBottleScale = 0.15;
let gridOrigin;
let gridTarget;
let xScale;
let yScale;

function drawCircle(ctx, points) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.strokeStyle = '#000000';
  points.forEach(point => {
    ctx.save();
    ctx.translate(xScale(point.x), yScale(point.y));
    ctx.translate(point.scale, point.scale);
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  });
}

// TODO: export this and draw the
// bottle outline in the respective ciolours
function drawBottles(ctx, path, points) {
  ctx.clearRect(0, 0, state.width, state.height);
  points.forEach(point => {
    ctx.save();
    ctx.translate(xScale(point.x), yScale(point.y));
    ctx.scale(point.scale, point.scale);
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
  });
}

function renderBottleZoomOut() {
  requestAnimationFrame(() => {
    // drawBottleWave(
    //   state.ctx.bottleWave,
    //   state.bottleWave.bottlePath,
    //   state.transform.shape
    // );
    // drawBottle(
    //   state.ctx.glassBottle,
    //   state.glassBottle.path,
    //   // state.transform.bottle
    //   {
    //     x:
    //       xScale(gridOrigin[0].x) -
    //       (state.glassBottle.bottleBox.width / 2) * gridOrigin[0].scale,
    //     y:
    //       yScale(gridOrigin[0].y) -
    //       (state.glassBottle.bottleBox.height / 2) * gridOrigin[0].scale,
    //     scale: gridOrigin[0].scale,
    //   }
    // );
    // debugger;
    drawBottles(state.ctx.glassBottle, state.glassBottle.path, gridOrigin);
    // drawCircle(state.ctx.glassBottle, gridOrigin);
  });
}

function getGridOriginData() {
  let points = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const point = {
        x: Math.round((r / (rows - 1)) * 100) / 100,
        y: -0.9,
        scale: smallBottleScale,
      };
      points.push(point);
    }
  }
  return points;
}

function getGridTargetData() {
  let points = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const point = {
        x: Math.round((r / (rows - 1)) * 100) / 100,
        y: Math.round((c / (cols - 1)) * 100) / 100,
        scale: smallBottleScale,
      };
      points.push(point);
    }
  }
  return points;
}

function defineTweenBottleZoomOut() {
  // Get scales (alos determining the space for our visual)
  const xBottleCorrection =
    (state.glassBottle.bottleBox.width / 2) * smallBottleScale;
  const yBottleCorrection =
    (state.glassBottle.bottleBox.height / 2) * smallBottleScale;

  xScale = scaleLinear().range([
    state.width * 0.1 - xBottleCorrection,
    state.width * 0.9 - xBottleCorrection,
  ]);
  yScale = scaleLinear().range([
    state.height * 0.1 - yBottleCorrection,
    state.height * 0.9 - yBottleCorrection,
  ]);

  // Data.
  gridOrigin = getGridOriginData();
  gridTarget = getGridTargetData();

  gridOrigin[0].x = xScale.invert(state.transform.bottle.x);
  gridOrigin[0].y = yScale.invert(state.transform.bottle.y);
  gridOrigin[0].scale = state.transform.bottle.scale;

  // Tween
  const tl = gsap.timeline({ onUpdate: renderBottleZoomOut });

  const pointtween = gsap.to(gridOrigin, {
    x: i => gridTarget[i].x,
    y: i => gridTarget[i].y,
    scale: i => gridTarget[i].scale,
    stagger: {
      each: 0.01,
      // grid: 'end',
    },
  });

  return tl.add(pointtween);
}

function tweenBottleZoomOut() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleZoomOut');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.bottleZoomOut) state.tween.bottleZoomOut.kill();
  state.tween.bottleZoomOut = defineTweenBottleZoomOut(0, 0.8);
  state.tween.bottleZoomOut.totalProgress(progress);
}

export default tweenBottleZoomOut;
