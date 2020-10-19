/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

import { drawBottleWave } from './bottleWave';
import { drawBottle } from './glassBottle';

function getColours() {
  const gradient = state.ctx.bottleWave.createLinearGradient(
    0,
    0,
    state.width,
    state.height
  );

  gradient.addColorStop(0, state.bottleColour.colourStop0);
  gradient.addColorStop(0.2, state.bottleColour.colourStop1);

  return gradient;
}

// When scrolling back to start from the end of the story,
// the bottle wave points are below the bottle from the model.
// app. We simply set them to above the bottle neck.
function fillUpBottleWave() {
  state.bottleWave.wavePoints = [
    [0, -20],
    [state.width, -20],
  ];
}

function renderBottleColour() {
  requestAnimationFrame(() => {
    // Save contexts.
    state.ctx.bottleWave.save();
    state.ctx.glassBottle.save();

    // Set context styles.
    const gradient = getColours();
    state.ctx.bottleWave.fillStyle = gradient;
    state.ctx.glassBottle.strokeStyle = gradient;

    // Set the bottle wave line to be above bottle.
    fillUpBottleWave();

    // Draw.
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

    // Restore contexts.
    state.ctx.bottleWave.restore();
    state.ctx.glassBottle.restore();
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
  state.tween.bottleColour = defineTweenBottleColour();
  state.tween.bottleColour.totalProgress(progress);
}

export default tweenBottleColour;
