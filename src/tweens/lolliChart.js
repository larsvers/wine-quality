import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear, scalePoint } from 'd3-scale/src/index';
import state from '../app/state';

let chart = {
  top: 0,
  right: undefined,
  bottom: undefined,
  left: undefined,
  height: undefined,
  width: undefined,
};
let xScale;
let yScale;
let lolliRadius;

// Utils.
function setDimensions() {
  // Set the lollichart area.
  const bottle = state.glassBottle; // Just for shortness.
  chart.left = Math.floor(bottle.bottleBox.width);
  chart.height = Math.floor(bottle.bottleBox.height);
  chart.width = Math.floor(
    (state.width / state.transform.bottle.scale) * bottle.bottleLeft +
      bottle.bottleBox.width
  );
  chart.right = Math.floor(chart.left + chart.width);
  chart.bottom = Math.floor(chart.top + chart.height);

  // Set the lolly radius.
  lolliRadius = 5 / state.transform.bottle.scale;

  // Set the lolly scales.
  xScale = scaleLinear([0, 1], [chart.left, chart.right]);
  yScale = scalePoint()
    .domain(state.lolliChart.values)
    .range([chart.top, chart.bottom]);
}

// Canvas draw function.
function drawLolliChart(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  state.lolliChart.values.forEach(d => {
    const xValue = state.lolliChart.data[d].value;
    const { length } = state.lolliChart.data[d].text;
    const { offset } = state.lolliChart.data[d].text;
    const { paths } = state.lolliChart.data[d].text;

    // Line.
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(d));
    ctx.lineTo(xScale(xValue), yScale(d));
    ctx.stroke();

    // Circle.
    ctx.beginPath();
    ctx.arc(xScale(xValue), yScale(d), lolliRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Text.
    ctx.save();
    ctx.translate(xScale(0), yScale(d));
    ctx.setLineDash([length - offset, offset]);
    paths.forEach(path => ctx.stroke(path));
    ctx.restore();
  });

  ctx.restore();
}

function renderLolliChart() {
  requestAnimationFrame(() =>
    drawLolliChart(state.ctx.lolliChart, state.transform.bottle)
  );
}

function defineTweenLolliChart() {
  setDimensions();

  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderLolliChart });

  // The path offset tweens.
  const alcoholOffset = gsap.fromTo(
    state.lolliChart.data.alcohol.text,
    { offset: state.lolliChart.data.alcohol.text.length },
    { offset: 0 }
  );
  const acidOffset = gsap.fromTo(
    state.lolliChart.data.acid.text,
    { offset: state.lolliChart.data.acid.text.length },
    { offset: 0 }
  );
  const chlorideOffset = gsap.fromTo(
    state.lolliChart.data.chloride.text,
    { offset: state.lolliChart.data.chloride.text.length },
    { offset: 0 }
  );
  const qualityOffset = gsap.fromTo(
    state.lolliChart.data.quality.text,
    { offset: state.lolliChart.data.quality.text.length },
    { offset: 0 }
  );

  // Set them off one after the ather.
  return tl
    .add(alcoholOffset)
    .add(acidOffset)
    .add(chlorideOffset)
    .add(qualityOffset);
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
