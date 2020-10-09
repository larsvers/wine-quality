/* eslint-disable no-param-reassign */
// Libs.
import gsap from 'gsap/gsap-core';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { max } from 'd3-array';
import { scaleLinear, scalePoint } from 'd3-scale';

import state from '../app/state';
import { capitalise } from '../app/utils';

// Module scope.
let area = {
  top: null,
  right: null,
  bottom: null,
  left: null,
  width: null,
  height: null,
};

let xScale;
let yScale;
let r = 5;
let lw = 2;
let title = { alpha: 0 };

// Set up / prep.
function setDimensions() {
  const marginHorz = state.width * 0.1;
  const marginVert = state.height * 0.1;

  area.top = Math.floor(marginVert * 2);
  area.right = Math.floor(state.width - marginHorz);
  area.bottom = Math.floor(state.height - marginVert);
  area.left = Math.floor(marginHorz);
  area.width = Math.floor(area.right - area.left);
  area.height = Math.floor(area.bottom - area.top);
}

function augmentData() {
  state.varImp.data.forEach(d => {
    d.value = 0;
    d.alpha = 0;
  });
}

function setScales() {
  xScale = scaleLinear()
    .domain([0, max(state.varImp.data, d => d.importance)])
    .range([area.left, area.right]);

  yScale = scalePoint()
    .domain(state.varImp.data.map(d => d.variable))
    .range([area.top, area.bottom]);
}

// Draw and render.
function drawImportanceChart(ctx) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();

  // Title.
  ctx.save();
  ctx.globalAlpha = title.alpha;
  ctx.font = '40px Amatic SC';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Variable Importance', area.left, area.top - 30);
  ctx.restore();

  // The bars.
  state.varImp.data.forEach(d => {
    // Lime.
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(d.variable));
    ctx.lineTo(xScale(d.value), yScale(d.variable));
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = d.alpha;

    // Circle.
    ctx.beginPath();
    ctx.arc(
      xScale(d.value) + (r + lw) / 2,
      yScale(d.variable),
      r,
      0,
      2 * Math.PI
    );
    ctx.stroke();

    // Text.
    ctx.font = '16px Pangolin';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(
      capitalise(d.variable).replaceAll('_', ' '),
      xScale(0),
      yScale(d.variable) + 5
    );
    ctx.restore();
  });

  ctx.restore();
}

function renderImportance() {
  // Need to set the alppa as it's 0 from before.
  state.ctx.lolli.globalAlpha = 1;
  state.ctx.lolli.lineWidth = lw;

  requestAnimationFrame(() => {
    drawImportanceChart(state.ctx.lolli);
  });
}

function defineTweenImportance() {
  const tl = gsap.timeline({ onUpdate: renderImportance });

  // Tween the title alpha.
  const titletween = gsap.fromTo(title, { alpha: 0 }, { alpha: 1 });
  tl.add(titletween);

  // Tween the variable importance values and alphas.
  state.varImp.data.forEach(d => {
    const valuetween = gsap.fromTo(d, { value: 0 }, { value: d.importance });
    const alphatween = gsap.fromTo(d, { alpha: 0 }, { alpha: 1 });

    tl.add(alphatween, '>').add(valuetween, '<');
  });

  return tl;
}

function defineTweenImportanceRemove() {
  const tl = gsap.timeline({ onUpdate: renderImportance });

  // Tween the title alpha.
  const titletween = gsap.fromTo(title, { alpha: 1 }, { alpha: 0 });
  tl.add(titletween, 0);

  // Tween the variable importance values and alphas.
  state.varImp.data.forEach(d => {
    const valuetween = gsap.to(d, { value: 0 });
    const alphatween = gsap.to(d, { alpha: 0 });

    tl.add(alphatween, '>').add(valuetween, '<');
  });

  return tl;
}

function tweenAdd() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('importance');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.importance) state.tween.importance.kill();
  state.tween.importance = defineTweenImportance();
  state.tween.importance.totalProgress(progress);
}

function tweenRemove() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('importanceRemove');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.importanceRemove) state.tween.importanceRemove.kill();
  state.tween.importanceRemove = defineTweenImportanceRemove();
  state.tween.importanceRemove.totalProgress(progress);
}

function tweenimportance() {
  // Some prep.
  setDimensions();
  augmentData();
  setScales();

  // Defining the add and remove tweens.
  tweenAdd();
  tweenRemove();
}

export default tweenimportance;
export { renderImportance };
