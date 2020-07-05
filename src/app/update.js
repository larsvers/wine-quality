import { select } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { isSelection, getBox, xScale } from './utils';

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger);

// Utils
// -----

/**
 * Set height of scrollydiv deterministically. It's flex-wrap, which
 * is a fucker to set otherwise (if at all possible).
 */
function setWrapHeight() {
  const contHeight = select('#text-container').node().offsetHeight;
  select('#text-wrap').style('height', `${contHeight}px`);
}

function setTransform(el, t) {
  const sel = isSelection(el) ? el : select(el);
  sel
    .attr(
      'transform',
      `translate(${t.x}, ${t.y}), scale(${t.scale}, ${t.scale})`
    )
    .attr('data-svg-origin', '0 0');
}

/**
 * This fn calculates the translate and scale values for the object based on the parent visual's
 * dimensions. `fit` decides how big in relation to width or height it should be (width: 1 would
 * be full width). Note, it can only fit towards one measure as skewing is not worked in.
 * `pos` decides which x, y place it should have. Leave this empty if you want to centre the image.
 * @param { SVGRect|Object } object The object's bounding box - at least with width and height
 * @param { Object } fit  { width: 0-1, height: 0-1 } The percentage of the width or height the
 *                        object should fit with. One must be 0!
 * @param { Object } pos  { x: 0-1, y: 0-1 } The percentage of the width or height
 *                        x or y should be at
 * @returns { Object }    { x, y, scale } The translate and scale values to be used for positioning.
 */
function getTransform(object, fit, nudge) {
  if (fit.width !== 0 && fit.height !== 0)
    throw Error('One fit value must be 0');

  // Get the parent visual.
  const frame = select('#svg-main-container').node();
  const visual = {
    width: frame.offsetWidth,
    height: frame.offsetHeight,
  };

  // Establish the object scale. fit.width and fit.height decide the scale
  // in relation to either the height or the width. You can't have both,
  // becasue we won't skew. These two term ↓ don't become a sum, but one
  // will be 0 when the other one is not.
  const scale =
    (visual.width / object.width) * fit.width +
    (visual.height / object.height) * fit.height;

  // Establish the object's position. The default value is the centre:
  const position = {
    x: visual.width / 2 - (object.width * scale) / 2,
    y: visual.height / 2 - (object.height * scale) / 2,
  };

  // If `nudge` is defined, then `nudge.x` and `nudge.y` are both
  // expressed  as % of the central position. 1 would be just that,
  // 2 would be the end (100% width) 0.5 half the centre (0.25 % width).
  if (nudge && nudge.x) position.x *= nudge.x;
  if (nudge && nudge.y) position.y *= nudge.y;

  // Nice the values all up.
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    scale: Math.round(scale * 100) / 100,
  };
}

// State.
// ------

let part = 'glass';

const transform = {
  glass: null,
  bottle: null,
};

ScrollTrigger.defaults({
  scroller: '#text-wrap',
  markers: true,
});

// Update functions.
// -----------------

// Transforms.
function getGlassTransform() {
  const box = getBox(select('#scape-group path'));
  const fit = { width: 1, height: 0 };
  transform.glass = getTransform(box, fit);
}

function getBottleTransform() {
  const box = getBox(select('#bottle-path'));
  const fit = { width: 0, height: 0.8 };
  const nudge = { x: 0.5, height: null };
  transform.bottle = getTransform(box, fit, nudge);
}

function setTransforms() {
  setTransform(select('#scape-group'), transform.glass);
  if (part === 'glass') setTransform(select('#shape-group'), transform.glass);
  if (part === 'bottle') setTransform(select('#shape-group'), transform.bottle);
}

// Tweens.
function tweenBottle() {
  const t = transform;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.section-1',
        start: 'top center',
        end: 'center center',
        toggleActions: 'play none none reverse',
      },
    })
    .to(
      '#shape-path',
      {
        duration: 2,
        morphSVG: { shape: '#bottle-path' },
      },
      0
    )
    .to(
      '#shape-group',
      {
        duration: 3,
        attr: {
          transform: `translate(${t.bottle.x}, ${t.bottle.y}) scale(${t.bottle.scale}, ${t.bottle.scale})`,
        },
      },
      0
    );
}

function tweenBottleText() {
  gsap.from('.bottle-text-path', {
    scrollTrigger: {
      trigger: '.section-2',
      start: 'top center',
      end: 'center center',
      scrub: true,
    },
    drawSVG: '0',
  });
}

function tweenBottleWave() {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.section-3',
        start: 'top center',
        end: 'center center',
        toggleActions: 'play none none reverse',
      },
    })
    .to('#wave-1', { duration: 1, opacity: 0.5 })
    .to(
      '#wave-1',
      {
        duration: 3,
        morphSVG: { shape: '#wave-2', shapeIndex: [-14] },
        // yoyo: true,
        // repeat: 2,
        ease: 'sine.inOut',
      },
      0
    );
}

function tweenChart() {
  const elements = document.querySelectorAll(
    '.lolli-alcohol, .lolli-acid, .lolli-chlorides'
  );
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.section-4',
        start: 'top center',
        end: 'center center',
        scrub: true,
      },
    })
    .to(elements, { opacity: 1 }, 0)
    .to('.lolli-alcohol line', { attr: { x2: xScale(1) } }, 0)
    .to('.lolli-acid line', { attr: { x2: xScale(0.5) } }, 0)
    .to('.lolli-chlorides line', { attr: { x2: xScale(0.75) } }, 0)
    .to('.lolli-alcohol circle', { attr: { cx: xScale(1) } }, 0)
    .to('.lolli-acid circle', { attr: { cx: xScale(0.5) } }, 0)
    .to('.lolli-chlorides circle', { attr: { cx: xScale(0.75) } }, 0);
}

function tweenQuality() {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.section-5',
        start: 'top center',
        end: 'center center',
        toggleActions: 'play none none reverse',
        scrub: true,
      },
    })
    .to('.lolli-quality', { opacity: 1 }, 0)
    .to('.lolli-quality text', { attr: { x2: xScale(1) }, fill: 'green' }, 0)
    .to('.lolli-quality line', { attr: { x2: xScale(1) }, stroke: 'green' }, 0)
    .to('.lolli-quality circle', { attr: { cx: xScale(1) }, fill: 'green' }, 0);
}

function tweenQualityChange() {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.section-6',
        start: 'top center',
        end: 'center center',
        scrub: true,
      },
    })
    .to('.lolli-alcohol line', { attr: { x2: xScale(0.2) } }, 0)
    .to('.lolli-alcohol circle', { attr: { cx: xScale(0.2) } }, 0)
    .to('.lolli-acid line', { attr: { x2: xScale(0.3) } }, 0)
    .to('.lolli-acid circle', { attr: { cx: xScale(0.3) } }, 0)
    .to('.lolli-chlorides line', { attr: { x2: xScale(1) } }, 0)
    .to('.lolli-chlorides circle', { attr: { cx: xScale(1) } }, 0)
    .to('.lolli-quality text', { fill: 'red' }, 0)
    .to('.lolli-quality line', { attr: { x2: xScale(0.3) }, stroke: 'red' }, 0)
    .to('.lolli-quality circle', { attr: { cx: xScale(0.3) }, fill: 'red' }, 0);
}

function updateTweens() {
  tweenBottle();
  tweenBottleText();
  tweenBottleWave();
  tweenChart();
  tweenQuality();
  tweenQualityChange();
}

// Main function.
function update() {
  setWrapHeight();
  getGlassTransform();
  getBottleTransform();
  setTransforms();
  updateTweens();
}

export default update;
