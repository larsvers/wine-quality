import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

function drawBottleText(ctx, paths, t, length, offset) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.setLineDash([length - offset, offset]);
  // eslint-disable-next-line no-unused-expressions
  Array.isArray(paths)
    ? paths.forEach(path => ctx.stroke(path))
    : ctx.stroke(paths);
  ctx.restore();
}

function renderBottleText() {
  state.ctx.bottleText.strokeStyle = state.bottleText.colour;
  requestAnimationFrame(() => {
    drawBottleText(
      state.ctx.bottleText,
      state.bottleText.paths,
      state.transform.shape,
      state.bottleText.maxLength,
      state.bottleText.dashOffset
    );
  });
}

function defineTweenBottleText() {
  const tl = gsap.timeline({ onUpdate: renderBottleText });

  const offset = gsap.fromTo(
    state.bottleText,
    { dashOffset: state.bottleText.maxLength },
    { dashOffset: 0 }
  );

  const colourvalue = gsap.fromTo(
    state.bottleText,
    { colour: 'rgba(0, 0, 0, 0)' },
    {
      colour: 'rgba(0, 0, 0, 1)',
      ease: 'circ.out',
    }
  );

  return tl.add(offset, 0).add(colourvalue, 0);
}

function tweenBottleText() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleText');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.bottleText) state.tween.bottleText.kill();
  state.tween.bottleText = defineTweenBottleText();
  state.tween.bottleText.totalProgress(progress);
}

export default tweenBottleText;
