import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import state from '../app/state';

function drawAnimals(ctx, path, t) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.strokeStyle = state.glassBottle.colour;
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const l = segment.length;
    ctx.moveTo(segment[0], segment[1]);
    for (let j = 2; j < l; j += 6) {
      ctx.bezierCurveTo(
        segment[j],
        segment[j + 1],
        segment[j + 2],
        segment[j + 3],
        segment[j + 4],
        segment[j + 5]
      );
    }
    if (segment.closed) {
      ctx.closePath();
    }
  }
  ctx.stroke();
  ctx.restore();
}

function renderAnimals() {
  requestAnimationFrame(() => {
    drawAnimals(
      state.ctx.glassBottle,
      state.glassBottle.path,
      state.transform.shape
    );
  });
}

function defineTweenAnimals() {
  // The timeline.
  const tl = gsap.timeline({ onUpdate: renderAnimals });

  // The morphs to get through.)
  const things = [
    { id: '#bottle-path', name: 'bottle', pos: 0 },
    { id: '#animal-pig', name: 'pig', pos: '+=1' },
    { id: '#animal-croc', name: 'croc', pos: '+=1' },
    { id: '#animal-giraffe', name: 'giraffe', pos: '+=1' },
    { id: '#animal-sloth1', name: 'sloth1', pos: '+=1' },
    { id: '#animal-whale', name: 'whale', pos: '+=1' },
    { id: '#animal-bird', name: 'bird', pos: '+=1' },
    { id: '#animal-sloth2', name: 'sloth2', pos: '+=1' },
    { id: '#bottle-path', name: 'bottle', pos: '+=1' },
  ];

  // Function for the loop that sets up 1 morph
  // (in here as it needs to be within `tl` scope).
  function setMorphs(from, to) {
    const morph = gsap.to(from.id, {
      morphSVG: {
        shape: to.id,
        map: 'complexity',
        updateTarget: false,
        render(path) {
          state.glassBottle.path = path;
        },
      },
    });

    const trans = gsap.fromTo(
      state.transform.shape,
      {
        x: state.transform[from.name].x,
        y: state.transform[from.name].y,
        scale: state.transform[from.name].scale,
      },
      {
        x: state.transform[to.name].x,
        y: state.transform[to.name].y,
        scale: state.transform[to.name].scale,
        ease: 'none',
      }
    );

    tl.add(morph, from.pos).add(trans, '<');
  }

  // Loop through the elements we'd like to morph.
  for (let i = 0; i < things.length - 1; i++) {
    const from = things[i];
    const to = things[i + 1];
    setMorphs(from, to);
  }

  return tl;
}

function tweenAnimals() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('animals');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.animals) state.tween.animals.kill();
  state.tween.animals = defineTweenAnimals();
  state.tween.animals.totalProgress(progress);
}

export default tweenAnimals;
