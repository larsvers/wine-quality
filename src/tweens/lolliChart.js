import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear } from 'd3-scale/src/index';
import state from '../app/state';

let chart = { top: 0, left: undefined, height: undefined, width: undefined };

function drawLolliChart(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  ctx.fillStyle = 'rgba(150,0,0,0.5)';
  ctx.fillRect(chart.left, chart.top, chart.width, chart.height);

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
  // This is a bit complex, yeas.
  chart.width =
    (state.width / state.transform.bottle.scale) * bottle.bottleLeft +
    bottle.bottleBox.width;

  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderLolliChart });
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
