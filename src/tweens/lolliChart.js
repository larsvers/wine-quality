import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { scaleLinear, scalePoint } from 'd3-scale/src/index';
import state from '../app/state';

let chart = {
  top: undefined,
  right: undefined,
  bottom: undefined,
  left: undefined,
  height: undefined,
  width: undefined,
};
let xScale;
let yScale;
let lolliRadiusTarget;

// Utils.
function setDimensions() {
  // Set the lollichart area.
  const bottle = state.glassBottle; // Just for shortness.
  // Horizontal dims.
  chart.left = Math.floor(bottle.bottleBox.width * 1.05);
  chart.width = Math.floor(
    (state.width / state.transform.bottle.scale) * bottle.bottleLeft +
      bottle.bottleBox.width
  );
  chart.right = Math.floor(chart.left + chart.width);
  // Vertical dims.
  chart.top = Math.floor(bottle.bottleBox.height * 0.5);
  chart.bottom = Math.floor(bottle.bottleBox.height * 0.9);
  chart.height = Math.floor(chart.bottom - chart.top);

  // Set the lolly radius target.
  lolliRadiusTarget = 5 / state.transform.bottle.scale;

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
    const datapoint = state.lolliChart.data[d];
    const xValue = datapoint.value;
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
    ctx.arc(xScale(xValue), yScale(d), datapoint.radius, 0, 2 * Math.PI);
    ctx.fill();

    // Text.
    ctx.save();
    ctx.translate(xScale(0), yScale(d) + 2);
    ctx.lineWidth = 0.5;
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

  // Loop through all data (in object).
  Object.keys(state.lolliChart.data).forEach(d => {
    // Datapoint to tween around with.
    const datapoint = state.lolliChart.data[d];

    // Set up the tweens.
    const valueTween = gsap.fromTo(
      datapoint,
      { value: datapoint.values[0] },
      { value: datapoint.values[1] }
    );
    const radiusTween = gsap.fromTo(
      datapoint,
      { radius: 0 },
      { radius: lolliRadiusTarget }
    );
    const offsetTween = gsap.fromTo(
      datapoint.text,
      { offset: datapoint.text.length },
      { offset: 0 }
    );

    // Add the tweens to the timeline.
    // ">" end "<" start of previous tween.
    tl.add(valueTween, '>')
      .add(radiusTween, '<')
      .add(offsetTween, '>');
  });

  return tl;
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
