import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

// Canvas draw function.
function drawLolliChart(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  state.lolli.values.forEach(d => {
    const datapoint = state.lolli.data[d];

    const xValue = datapoint.value;
    const { length } = state.lolli.data[d].text;
    const { offset } = state.lolli.data[d].text;
    const { paths } = state.lolli.data[d].text;

    // Line.
    ctx.beginPath();
    ctx.moveTo(state.lolli.x(0), state.lolli.y(d));
    ctx.lineTo(state.lolli.x(xValue), state.lolli.y(d));
    ctx.stroke();

    // Circle.
    ctx.beginPath();
    ctx.arc(
      state.lolli.x(xValue),
      state.lolli.y(d),
      datapoint.radius,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Text.
    ctx.save();
    ctx.translate(state.lolli.x(0), state.lolli.y(d) + 2);
    ctx.lineWidth = 0.5;
    ctx.setLineDash([length - offset, offset]);
    paths.forEach(path => ctx.stroke(path));
    ctx.restore();
  });

  ctx.restore();
}

function drawBlackBox(ctx, t) {

  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  // debugger;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 0.1;

  state.blackBox.box.paths.forEach(path => ctx.stroke(path));

  ctx.restore();

}

function renderBlackBox() {
  requestAnimationFrame(() =>
    drawBlackBox(state.ctx.lolli, state.transform.bottle)
  );
}


function defineTweenBlackBox() {
  // Things to tween.
  const tl = gsap.timeline({
    onStart: renderBlackBox,
    // onUpdate: renderBlackBox,
  });

  // Loop through all lolli-data (which is an object).
  Object.keys(state.lolli.data).forEach(d => {
    // Datapoint to tween around with.
    const datapoint = state.lolli.data[d];

    // Set up the tweens.
    const valueTween = gsap.fromTo(
      datapoint,
      { value: datapoint.values[3] },
      { value: datapoint.values[4] }
    );
    const radiusTween = gsap.fromTo(
      datapoint,
      { radius: state.lolli.radiusTarget },
      { radius: 0 }
    );

    tl.add(valueTween, '>').add(radiusTween, '<');

    if (d === 'quality') {
      const offsetTween = gsap.fromTo(
        datapoint.text,
        { offset: 0 },
        { offset: datapoint.text.length }
      );

      tl.add(offsetTween, '>');
    }
  });

  return tl;
}

function tweenBlackBox() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('blackBox');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.blackBox) state.tween.blackBox.kill();
  state.tween.blackBox = defineTweenBlackBox();
  state.tween.blackBox.totalProgress(progress);
}

export default tweenBlackBox;
