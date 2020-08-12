import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear, scalePoint } from 'd3-scale/src/index';
import { curveStep } from 'd3-shape/src';
import state from '../app/state';

let chart = { top: 0, left: undefined, height: undefined, width: undefined };
let xScale;
let yScale;

function drawLolliChart(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  ctx.fillStyle = 'rgba(0,0,50,0.2)';
  ctx.fillRect(chart.left, chart.top, chart.width, chart.height);

  ctx.strokeStyle = 'black';
  state.lolliChart.data.forEach(d => {
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(d.property));
    ctx.lineTo(xScale(d.value), yScale(d.property));
    ctx.stroke();
  });

  ctx.restore();
}

function renderLolliChart() {
  requestAnimationFrame(() =>
    drawLolliChart(state.ctx.lolliChart, state.transform.bottle)
  );
}

function defineTweenLolliChart() {
  // Get the lollichart area.
  const bottle = state.glassBottle; // Just for shortness.
  chart.left = bottle.bottleBox.width;
  chart.height = bottle.bottleBox.height;
  chart.width =
    (state.width / state.transform.bottle.scale) * bottle.bottleLeft +
    bottle.bottleBox.width;

  // Get the lolli scale.
  xScale = scaleLinear([0, 1], [chart.left, chart.left + chart.width * 0.9]);
  yScale = scalePoint()
    .domain(state.lolliChart.data.map(d => d.property))
    .range([chart.height * 0.4, chart.height * 0.9]);

  // Load in the texts (in init)
  // Draw them as in bottleText.js

  // Things to tween.
  const tl = gsap.timeline({ onStart: renderLolliChart });
  const position = gsap.fromTo(state.lolliChart, { x: 0 }, { x: 1 });
  return tl.add(position, 0);
}

function tweenLolliChart() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('lolliChart');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.lolliChart) state.tween.lolliChart.kill();
  state.tween.lolliChart = defineTweenLolliChart();
  state.tween.lolliChart.totalProgress(progress);
}

export default tweenLolliChart;
