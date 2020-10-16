/* eslint-disable no-use-before-define */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';

import state from '../app/state';
import { defineTweenBottleWave } from './bottleWave';

function tweenModelWaveInit() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('modelWaveInit');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.modelWaveInit) state.tween.modelWaveInit.kill();
  state.tween.modelWaveInit = defineTweenBottleWave(
    -0.05,
    state.model.probability
  );
  state.tween.modelWaveInit.totalProgress(progress);
}

export default tweenModelWaveInit;
