/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

import { drawBottleWave } from './bottleWave';
import { drawBottle } from './glassBottle';

function setColours() {
  // Gradient.
  const gradient = state.ctx.bottleWave.createLinearGradient(
    0,
    0,
    state.width,
    state.height
  );

  gradient.addColorStop(0, state.bottleColour.colourStop0);
  gradient.addColorStop(0.2, state.bottleColour.colourStop1);

  // Context styles.
  state.ctx.bottleWave.fillStyle = gradient;
  state.ctx.glassBottle.strokeStyle = gradient;
}

function renderBottleColour() {
  setColours();

  requestAnimationFrame(() => {
    drawBottleWave(
      state.ctx.bottleWave,
      state.bottleWave.bottlePath,
      state.transform.shape
    );
    drawBottle(
      state.ctx.glassBottle,
      state.glassBottle.path,
      state.transform.bottle
    );
  });
}

function defineTweenBottleColour() {
  const tl = gsap.timeline({ onUpdate: renderBottleColour });

  const colourStop0_good = gsap.fromTo(
    state.bottleColour,
    { colourStop0: state.bottleColour.base },
    { colourStop0: state.bottleColour.start[0] }
  );

  const colourStop1_good = gsap.fromTo(
    state.bottleColour,
    { colourStop1: state.bottleColour.base },
    { colourStop1: state.bottleColour.stop[0] }
  );

  const colourStop0_bad = gsap.to(state.bottleColour, {
    colourStop0: state.bottleColour.start[1],
  });

  const colourStop1_bad = gsap.to(state.bottleColour, {
    colourStop1: state.bottleColour.stop[1],
  });

  const colourStop0_base = gsap.to(state.bottleColour, {
    colourStop0: state.bottleColour.base,
  });

  const colourStop1_base = gsap.to(state.bottleColour, {
    colourStop1: state.bottleColour.base,
  });

  return tl
    .add(colourStop0_good)
    .add(colourStop1_good, '<')
    .add(colourStop0_bad, '+=1')
    .add(colourStop1_bad, '<')
    .add(colourStop0_base, '+=1')
    .add(colourStop1_base, '<');
}

function tweenBottleColour() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleColour');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.bottleColour) state.tween.bottleColour.kill();
  state.tween.bottleColour = defineTweenBottleColour(0, 0.8);
  state.tween.bottleColour.totalProgress(progress);
}

export default tweenBottleColour;
