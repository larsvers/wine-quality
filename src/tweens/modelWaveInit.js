/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';

import state from '../app/state';
import { defineTweenBottleWave, startWave, decayWave } from './bottleWave';

function defineTweenModelBottleWave() {
  // Set up timeline.
  const tl = gsap.timeline({ onStart: startWave, onUpdate: decayWave });

  const lift = gsap.to(state.bottleWave, { lift: state.model.probability });

  return tl.add(lift);
}

function tweenModelWaveInit() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('modelWaveInit');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.modelWaveInit) state.tween.modelWaveInit.kill();
  // state.tween.modelWaveInit = defineTweenBottleWave(
  //   -0.05,
  //   state.model.probability
  // );
  state.tween.modelWaveInit = defineTweenModelBottleWave();

  state.tween.modelWaveInit.totalProgress(progress);
}

export default tweenModelWaveInit;
