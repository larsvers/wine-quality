import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

function drawBlackBox(ctx, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

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

  ctx.restore();
}

function renderBlackBox() {
  requestAnimationFrame(() => {
    drawBlackBox(state.ctx.blackBox, state.transform.bottle);
  });
}

function defineTweenCleanup() {
  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderBlackBox });

  // Box path.
  const boxoffset = gsap.fromTo(
    state.blackBox.box,
    { offset: state.blackBox.box.length },
    { offset: 0 }
  );

  tl.add(boxoffset);

  return tl;
}

function tweenCleanup() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('cleanup');
  scroll;
  // const progress = scroll ? scroll.progress : 0;

  // // Kill old - set up new timeline.
  // if (state.tween.cleanup) state.tween.cleanup.kill();
  // state.tween.cleanup = defineTweenCleanup();
  // state.tween.cleanup.totalProgress(progress);
}

export default tweenCleanup;
