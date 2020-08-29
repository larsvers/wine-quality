import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

const inputProperties = ['alcohol', 'acid', 'chloride'];
const outputProperties = ['quality'];

const zoom = { factor: 1 };

function drawBlackBox(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  // Scaling and translating with some added "pulse" to
  // suck up the predictors and spit out the dependent.
  ctx.translate(
    t.x - ((zoom.factor - 1) * (state.blackBox.boxDims.width * t.scale)) / 2,
    t.y
  );
  ctx.scale(t.scale * zoom.factor, t.scale);

  // Draw box (animate)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.1;
  state.blackBox.box.paths.forEach(path => {
    ctx.setLineDash([
      state.blackBox.box.length - state.blackBox.box.offset,
      state.blackBox.box.offset,
    ]);
    ctx.stroke(path);
  });

  // Draw text (don't animate).
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  state.blackBox.model.paths.forEach(path => ctx.stroke(path));

  ctx.restore();
}

// Canvas draw function.
function drawText(ctx, t, input, output) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  // Draw input properties.
  input.forEach(d => {
    const datapoint = state.lolli.data[d];
    const { paths } = state.lolli.data[d].text;

    ctx.save();
    ctx.translate(
      state.lolli.x(0) + datapoint.offset.x,
      state.lolli.y(d) + datapoint.offset.y + 2
    );
    ctx.lineWidth = 0.5;
    paths.forEach(path => ctx.stroke(path));
    ctx.restore();
  });

  // Draw output property (or properties).
  output.forEach(d => {
    const datapoint = state.lolli.data[d];
    const { paths } = state.lolli.data[d].text;

    ctx.save();
    ctx.translate(
      state.lolli.x(0) + datapoint.offset.x,
      state.lolli.y(d) + datapoint.offset.y + 2
    );
    ctx.lineWidth = 0.5;
    paths.forEach(path => ctx.stroke(path));
    ctx.restore();
  });

  ctx.restore();
}

function renderBlackBox() {
  requestAnimationFrame(() => {
    drawBlackBox(state.ctx.blackBox, state.transform.bottle);
    drawText(state.ctx.lolli, state.transform.bottle, inputProperties, [
      'quality',
    ]);
  });
}

function defineTweenBlackBox() {
  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderBlackBox });

  // Box path.
  const boxoffset = gsap.fromTo(
    state.blackBox.box,
    { offset: state.blackBox.box.length },
    { offset: 0 }
  );

  tl.add(boxoffset);

  // Model text path (don't animate).

  // Property x/y.
  inputProperties.forEach((d, i) => {
    // The x offset to move the predictor text by
    // basically the width of the bottle.
    const datapoint = state.lolli.data[d];
    const xoffset = gsap.fromTo(
      datapoint.offset,
      { x: 0 },
      { x: -state.lolli.area.left }
    );

    // The y offset to move the predictor text by
    // the point scale step (pretty hard coded).
    let yOffsetTarget;
    if (i === 0) yOffsetTarget = state.lolli.y.step();
    else yOffsetTarget = 0;

    const yoffset = gsap.fromTo(
      datapoint.offset,
      { y: 0 },
      { y: yOffsetTarget }
    );

    const scaleup = gsap.to(zoom, { factor: 0.95, duration: 0.2 });
    const scaledown = gsap.to(zoom, { factor: 1 });

    tl.add(xoffset, '>')
      .add(yoffset, '<')
      .add(scaleup, '<')
      .add(scaledown, '>');
  });

  // Outcome x/y.
  outputProperties.forEach((d, i) => {
    // The x offset to move the predictor text by
    // basically the width of the bottle.
    const datapoint = state.lolli.data[d];
    const xoffset = gsap.fromTo(
      datapoint.offset,
      { x: -state.lolli.area.left },
      { x: 0 }
    );

    // The y offset to move the predictor text by
    // taken by the point scale step (pretty hard coded).
    let yOffsetTarget;
    const step = state.lolli.y.step();
    if (i === 0) yOffsetTarget = -step;

    const yoffset = gsap.fromTo(
      datapoint.offset,
      { y: yOffsetTarget },
      { y: yOffsetTarget * 0.5 }
    );

    const scaleup = gsap.to(zoom, { factor: 1.1, duration: 0.2 });
    const scaledown = gsap.to(zoom, { factor: 1 });

    tl.add(xoffset, '+=0.5')
      .add(yoffset, '<')
      .add(scaleup, '<')
      .add(scaledown, '>');
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
