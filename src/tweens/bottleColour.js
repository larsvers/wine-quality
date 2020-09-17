/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

import { drawBottleWave } from './bottleWave';
import { drawBottle } from './glassBottle';

function renderBottleColour() {
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

  const colourStopGood1 = gsap.fromTo(
    state.bottleColour,
    { colourStop0: '#000000' },
    { colourStop0: '#619FFC' }
  );

  const colourStopGood2 = gsap.fromTo(
    state.bottleColour,
    { colourStop1: '#000000' },
    { colourStop1: '#023B64' }
  );

  const colourStopBad1 = gsap.to(state.bottleColour, {
    colourStop0: '#f5992c',
  });

  const colourStopBad2 = gsap.to(state.bottleColour, {
    colourStop1: '#AE5E00',
  });

  return tl
    .add(colourStopGood1)
    .add(colourStopGood2, '<')
    .add(colourStopBad1, '+=1')
    .add(colourStopBad2, '<');
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
