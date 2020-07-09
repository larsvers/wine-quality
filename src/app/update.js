import { select } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/src/DrawSVGPlugin';
import { GSDevTools } from 'gsap/src/GSDevTools';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { isSelection, getBox, xScale } from './utils';

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, ScrollTrigger, GSDevTools);

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
 * @param { SVGRect|Object } object The object's bounding box - at least with width and height. Required.
 * @param { Object } fit  { width: 0-1, height: 0-1 } The percentage of the width or height the
 *                        object should fit with. One must be 0! Required.
 * @param { Object } pos  { x: 0-1, y: 0-1 } The percentage of the width or height
 *                        x or y should be at. Optional.
 * @returns { Object }    { x, y, scale } The translate and scale values to be used for positioning.
 */
function getTransform(object, fit, nudge) {
  if (fit.width !== 0 && fit.height !== 0)
    throw Error('One fit value must be 0');

  // Get the parent visual.
  const frame = document.querySelector('#canvas-main-container');
  const visual = {
    width: frame.offsetWidth,
    height: frame.offsetHeight,
  };

  // Establish the object scale. fit.width and fit.height decide the scale
  // in relation to either the height or the width. You can't have both,
  // becasue we won't skew. These two terms ↓ don't become a sum, but one
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

  // Nice all the values up.
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
  shape: null,
  bottle: null,
};

ScrollTrigger.defaults({
  scroller: '#text-wrap',
  markers: true,
});

// Update functions.
// -----------------

function resizeCanvas(canvas, container) {
  const context = canvas.getContext('2d');

  // Get the desired dimensions.
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  // Give each device pixel an element and drawing surface pixel.
  // This should make it bigger for retina displays for example.
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;

  // Scale only the element's size down to the given width on the site.
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Scale the drawing surface (up).
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function drawImage(ctx, img, t) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.drawImage(img, 0, 0, img.width, img.height);
  ctx.restore();
}

// Transforms.
function getGlassTransform() {
  const box = getBox(select('#glass-path'));
  const fit = { width: 1, height: 0 };
  // transform.glass = getTransform(box, fit);
  // transform.shape = getTransform(box, fit);
  // console.log(transform.glass);
}

function getBottleTransform() {
  const box = getBox(select('#bottle-path'));
  const fit = { width: 0, height: 0.8 };
  const nudge = { x: 0.5, height: null };
  transform.bottle = getTransform(box, fit, nudge);
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
function update(wineScape) {
  // Get elements.
  const container = document.querySelector('#canvas-main-container');
  const can01 = document.querySelector('#canvas-main');
  const ctx01 = can01.getContext('2d');
  const can02 = document.querySelector('#canvas-level-1');
  const ctx02 = can02.getContext('2d');

  // Resize canvas.
  resizeCanvas(can01, container);
  resizeCanvas(can02, container);

  // Base measures.
  const width = parseFloat(can01.style.width);
  const height = parseFloat(can01.style.height);

  // Update all necessary transforms.
  const scapeDim = { width: wineScape.width, height: wineScape.height };
  transform.scape = transform.shape = getTransform(scapeDim, {
    width: 1,
    height: 0,
  });

  const bottleDim = getBox(select('#bottle-path'));
  transform.bottle = getTransform(
    bottleDim,
    { width: 0, height: 0.8 },
    { x: 0.5, height: null }
  );

  // Draw wine Scape.
  drawImage(ctx01, wineScape, transform.scape);

  // Morph draw function.
  ctx02.strokeStyle = 'red';
  function draw(rawPath) {
    ctx02.clearRect(0, 0, width, height);
    ctx02.save();
    ctx02.translate(transform.shape.x, transform.shape.y);
    ctx02.scale(transform.shape.scale, transform.shape.scale);
    ctx02.beginPath();
    for (let i = 0; i < rawPath.length; i++) {
      const segment = rawPath[i];
      const l = segment.length;
      ctx02.moveTo(segment[0], segment[1]);
      for (let j = 2; j < l; j += 6) {
        ctx02.bezierCurveTo(
          segment[j],
          segment[j + 1],
          segment[j + 2],
          segment[j + 3],
          segment[j + 4],
          segment[j + 5]
        );
      }
      if (segment.closed) {
        ctx02.closePath();
      }
    }
    ctx02.stroke();
    ctx02.restore();
  }

  // Change transform function.
  function updateTransform() {
    transform.shape = this._targets[0];
  }

  // Animation.
  const tl = gsap.timeline({ defaults: { duration: 2 }, paused: true });
  tl.to('#glass-path', {
    morphSVG: {
      shape: '#bottle-path',
      render: draw,
    },
  }).to(
    transform.shape,
    {
      x: transform.bottle.x,
      y: transform.bottle.y,
      scale: transform.bottle.scale,
      onUpdate: updateTransform,
    },
    0
  );

  tl.progress(0.0001);

  // GSDevTools.create({ animation: tl });

  let flag = true;
  function anim() {
    if (flag) {
      tl.play();
      this.innerHTML = 'Reverse';
    } else {
      tl.reverse();
      this.innerHTML = 'Play';
    }
    flag = !flag;
  }

  document.querySelector('button').addEventListener('click', anim);
  // setWrapHeight();
  // getGlassTransform();
  // getBottleTransform();
  // setTransforms();
  // updateTweens();
}

export default update;
