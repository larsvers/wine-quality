/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

import { drawBottleWave } from './bottleWave';
import { drawBottle } from './glassBottle';

// Describe the colour stop journey.
const bottleColours = [
  {
    name: 'colourGood',
    fromStop0: '#000000',
    toStop0: '#88B8FF',
    fromStop1: '#000000',
    toStop1: '#023B64',
  },
  {
    name: 'colourBad',
    fromStop0: '#88B8FF',
    toStop0: '#FFDDBD',
    fromStop1: '#023B64',
    toStop1: '#AE5E00',
  },
  {
    name: 'colourBase',
    fromStop0: '#FFDDBD',
    toStop0: '#000000',
    fromStop1: '#AE5E00',
    toStop1: '#000000',
  },
];

// The object to tween to and from.
const colourStops = {
  stop0: null,
  stop1: null,
};

// Helper func to create the colour gradient.
function getColours() {
  const gradient = state.ctx.bottleWave.createLinearGradient(
    0,
    state.glassBottle.bottleBox.height / 2,
    state.glassBottle.bottleBox.width,
    state.glassBottle.bottleBox.height / 2
  );

  gradient.addColorStop(0, colourStops.stop0);
  gradient.addColorStop(0.7, colourStops.stop1);

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

// Render.
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

// Tween set up.
function defineTweenBottleColour(col) {
  const tl = gsap.timeline({ onUpdate: renderBottleColour });

  const stop0Tween = gsap.fromTo(
    colourStops,
    { stop0: col.fromStop0 },
    { stop0: col.toStop0 }
  );

  const stop1Tween = gsap.fromTo(
    colourStops,
    { stop1: col.fromStop1 },
    { stop1: col.toStop1 }
  );

  return tl.add(stop0Tween).add(stop1Tween, '<');
}

function tweenBottleColour() {
  bottleColours.forEach(d => {
    // Capture current progress.
    const scroll = ScrollTrigger.getById(d.name);
    const progress = scroll ? scroll.progress : 0;

    // Kill old - set up new timeline.
    if (state.tween[d.name]) state.tween[d.name].kill();
    state.tween[d.name] = defineTweenBottleColour(d);
    state.tween[d.name].totalProgress(progress);
  });
}

export default tweenBottleColour;
export { bottleColours };
