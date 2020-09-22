/* eslint-disable no-use-before-define */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';

import state from '../app/state';
import { renderBottleGrid } from './bottleGrid';

function defineTweenBottleGridColour() {
  // Tween
  const tl = gsap.timeline({ onUpdate: renderBottleGrid });

  const colourGood = gsap.fromTo(
    state.bottleGrid.colour,
    { good: '#000000' },
    { good: '#0000ff' }
  );

  const colourBad = gsap.fromTo(
    state.bottleGrid.colour,
    { bad: '#000000' },
    { bad: '#ff0000' }
  );

  return tl.add(colourGood).add(colourBad);
}

function tweenBottleGridColour() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('bottleGridColour');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.bottleGridColour) state.tween.bottleGridColour.kill();
  state.tween.bottleGridColour = defineTweenBottleGridColour();
  state.tween.bottleGridColour.totalProgress(progress);
}

export default tweenBottleGridColour;
