import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';
import { drawScape } from './wineScape';

// function drawScape(ctx, img, t, alpha) {
//   ctx.clearRect(0, 0, state.width, state.height);
//   ctx.save();
//   ctx.globalAlpha = alpha;
//   ctx.translate(t.x, t.y);
//   ctx.scale(t.scale, t.scale);
//   ctx.drawImage(img, 0, 0, img.width, img.height);
//   ctx.restore();
// }

function renderScape() {
  requestAnimationFrame(() =>
    drawScape(
      state.ctx.scape,
      state.scape.image,
      state.transform.scape,
      state.scape.alpha
    )
  );
}

function defineTweenStatsScape() {
  const tl = gsap.timeline({ onUpdate: renderScape });
  const imagealpha = gsap.fromTo(
    state.scape,
    { alpha: state.scape.alphaTarget },
    { alpha: 0 }
  );
  return tl.add(imagealpha);
}

function tweenStatsScape() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('statsScape');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.statsScape) state.tween.statsScape.kill();
  state.tween.statsScape = defineTweenStatsScape();
  state.tween.statsScape.totalProgress(progress);
}

export default tweenStatsScape;
