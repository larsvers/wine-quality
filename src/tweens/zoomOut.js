/* eslint-disable no-use-before-define */
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';

import state from '../app/state';
import { defineTweenBottleWave } from './bottleWave';

function tweenZoomOut() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('zoomOut');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.zoomOut) state.tween.zoomOut.kill();
  state.tween.zoomOut = defineTweenBottleWave(0.8, 1);
  state.tween.zoomOut.totalProgress(progress);
}

export default tweenZoomOut;
