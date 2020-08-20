import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';
import { renderLolliChart } from './lolliChart';

function defineTweenLolliUpdate1() {
  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderLolliChart });

  // Loop through all lolli-data (which is an object).
  Object.keys(state.lolli.data).forEach(d => {
    // Datapoint to tween around with.
    const datapoint = state.lolli.data[d];

    // Set up the tweens.
    const valueTween = gsap.fromTo(
      datapoint,
      { value: datapoint.values[1] },
      { value: datapoint.values[2] }
    );

    // Add the tweens to the timeline.
    // "<" start or ">" end of previous tween.
    tl.add(valueTween, '<');
  });

  return tl;
}

function defineTweenLolliUpdate2() {
  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderLolliChart });

  // Loop through all lolli-data (which is an object).
  Object.keys(state.lolli.data).forEach(d => {
    // Datapoint to tween around with.
    const datapoint = state.lolli.data[d];

    // Set up the tweens.
    const valueTween = gsap.fromTo(
      datapoint,
      { value: datapoint.values[2] },
      { value: datapoint.values[3] }
    );

    // Add the tweens to the timeline.
    // "<" start or ">" end of previous tween.
    tl.add(valueTween, '<');
  });

  return tl;
}

function defineTweenLolliUpdate3() {
  // Things to tween.
  const tl = gsap.timeline({ onUpdate: renderLolliChart });

  // Loop through all lolli-data (which is an object).
  Object.keys(state.lolli.data).forEach(d => {
    // Datapoint to tween around with.
    const datapoint = state.lolli.data[d];

    // Set up the tweens.
    const valueTween = gsap.fromTo(
      datapoint,
      { value: datapoint.values[3] },
      { value: datapoint.values[4] }
    );
    const radiusTween = gsap.fromTo(
      datapoint,
      { radius: state.lolli.radiusTarget },
      { radius: 0 }
    );

    tl.add(valueTween, '>').add(radiusTween, '<');

    if (d === 'quality') {
      const offsetTween = gsap.fromTo(
        datapoint.text,
        { offset: 0 },
        { offset: datapoint.text.length }
      );

      tl.add(offsetTween, '>');
    }
  });

  return tl;
}

function tweenLolliUpdate1() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('lolliUpdate1');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.lolliUpdate1) state.tween.lolliUpdate1.kill();
  state.tween.lolliUpdate1 = defineTweenLolliUpdate1();
  state.tween.lolliUpdate1.totalProgress(progress);
}

function tweenLolliUpdate2() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('lolliUpdate2');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.lolliUpdate2) state.tween.lolliUpdate2.kill();
  state.tween.lolliUpdate2 = defineTweenLolliUpdate2();
  state.tween.lolliUpdate2.totalProgress(progress);
}

function tweenLolliUpdate3() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('lolliUpdate3');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.lolliUpdate3) state.tween.lolliUpdate3.kill();
  state.tween.lolliUpdate3 = defineTweenLolliUpdate3();
  state.tween.lolliUpdate3.totalProgress(progress);
}

export { tweenLolliUpdate1, tweenLolliUpdate2, tweenLolliUpdate3 };
