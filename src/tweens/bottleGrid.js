/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear } from 'd3-scale';
import cloneDeep from 'lodash.clonedeep';

import { range } from 'd3-array/src';
import state from '../app/state';

import gridLayout from '../layouts/grid';

const smallBottleScale = 0.15;
let gridOrigin;
let gridTarget;
let xScale;
let yScale;

// function drawCircle(ctx, points) {
//   ctx.clearRect(0, 0, state.width, state.height);
//   ctx.strokeStyle = '#000000';
//   points.forEach(point => {
//     ctx.save();
//     ctx.translate(xScale(point.x), yScale(point.y));
//     ctx.translate(point.scale, point.scale);
//     ctx.beginPath();
//     ctx.arc(0, 0, 4, 0, 2 * Math.PI);
//     ctx.stroke();
//     ctx.restore();
//   });
// }

// TODO: export this and draw the
// bottle outline in the respective ciolours
function drawBottles(ctx, path, points) {
  ctx.clearRect(0, 0, state.width, state.height);
  points.forEach(point => {
    ctx.strokeStyle = point.quality
      ? state.bottleGrid.colour.good
      : state.bottleGrid.colour.bad;
    const { layout } = point;
    ctx.save();
    ctx.translate(xScale(layout.x), yScale(layout.y));
    ctx.scale(layout.scale, layout.scale);
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

// Tween and draw.
function drawBottleWaves(ctx, path, points) {
  ctx.clearRect(0, 0, state.width, state.height);
  points.forEach(point => {
    ctx.fillStyle = point.quality
      ? state.bottleGrid.colour.good
      : state.bottleGrid.colour.bad;
    const { layout } = point;
    ctx.save();
    ctx.translate(xScale(layout.x), yScale(layout.y));
    ctx.scale(layout.scale, layout.scale);

    // Clip path.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(state.width, 0);
    ctx.lineTo(state.width, state.height);
    ctx.lineTo(0, state.height);
    ctx.closePath();
    ctx.clip();

    // Background.
    ctx.fill(path);

    ctx.restore();
  });
}

function renderBottleGrid() {
  requestAnimationFrame(() => {
    drawBottleWaves(
      state.ctx.bottleWave,
      state.bottleWave.bottlePath,
      gridOrigin
    );
    drawBottles(state.ctx.glassBottle, state.glassBottle.path, gridOrigin);
  });
}

function getBaseData(rows, cols) {
  return range(rows * cols).map((d, i) => ({
    quality: Math.random() > 0.3,
    index: i,
  }));
}

function defineTweenBottleGrid() {
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
  const num = 20;
  const baseData = getBaseData(num, num);
  gridTarget = gridLayout()
    .rows(num)
    .cols(num)
    .scale(0.1)(baseData);
  gridOrigin = gridTarget.map(d => cloneDeep(d));
  gridOrigin.forEach(d => {
    d.layout.y = -0.2;
    d.layout.scale = 0;
  });

  // Add the initial position of the main bottle.
  gridOrigin[0].layout.x = xScale.invert(state.transform.bottle.x);
  gridOrigin[0].layout.y = yScale.invert(state.transform.bottle.y);
  gridOrigin[0].layout.scale = state.transform.bottle.scale;

  // Tween
  const tl = gsap.timeline({ onUpdate: renderBottleGrid });

  const pointtween = gsap.to(
    gridOrigin.map(d => d.layout),
    {
      x: i => gridTarget[i].layout.x,
      y: i => gridTarget[i].layout.y,
      scale: i => gridTarget[i].layout.scale,
      stagger: 0.01,
    }
  );

  return tl.add(pointtween);
}

function tweenBottleGrid() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleGrid');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.bottleGrid) state.tween.bottleGrid.kill();
  state.tween.bottleGrid = defineTweenBottleGrid();
  state.tween.bottleGrid.totalProgress(progress);
}

export default tweenBottleGrid;
export { renderBottleGrid };
