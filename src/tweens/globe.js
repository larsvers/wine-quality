/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import { feature } from 'topojson-client';
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo';

import { scaleLinear } from 'd3-scale';
import state from '../app/state';
import { bezWithArrowheads } from '../app/utils';

let countries;
let portugal;
let projection;
let path;
let sphere;
let grid;
let txScale;
let tyScale;
let sScale;
let rScale;
let gaScale;
let aaScale;

let point0;
let point1;
let point2;

// The center of the world (Northern Portigal in our case).
const rBase = [8, -42, 0];

function drawGlobe(ctx) {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();

  ctx.globalAlpha = gaScale(state.globe.scroll.progress);
  ctx.strokeStyle = '#000000';
  ctx.beginPath(), path(sphere), ctx.stroke();

  ctx.lineWidth = 0.1;
  // ctx.beginPath(), path(grid), ctx.stroke();

  ctx.lineWidth = 0.5;
  ctx.beginPath(), path(countries), ctx.stroke();

  ctx.fillStyle = '#ff00ff';
  ctx.beginPath(), path(portugal), ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = aaScale(state.globe.scroll.progress);
  bezWithArrowheads(ctx, point0, point1, point2, undefined, 15, false, true);

  ctx.restore();
}

function renderGlobe() {
  // Set the projection params.
  projection.translate([
    // projection.translate()[0],
    txScale(state.globe.scroll.progress),
    tyScale(state.globe.scroll.progress),
  ]);
  projection.scale(sScale(state.globe.scroll.progress));
  const r = rScale(state.globe.scroll.progress);
  projection.rotate([rBase[0] + r, rBase[1] + r, rBase[2]]);

  // Arrow control point.
  point1 = projection([-20, 43]);
  point1 = { x: point1[0], y: point1[1] };

  // Arrow end point.
  point2 = projection([-10, 41]);
  point2 = { x: point2[0], y: point2[1] };

  // Start the render.
  requestAnimationFrame(() => drawGlobe(state.ctx.globe));
}

function prepData() {
  // Convert from topo to geoJSON.
  countries = feature(
    state.globe.data,
    state.globe.data.objects.ne_110m_admin_0_countries
  );

  [portugal] = countries.features.filter(
    d => d.properties.admin === 'Portugal'
  );

  // Arrow control point 0.
  point0 = { x: state.width * 0.35, y: state.height * 0.45 };
}

function prepGeoTools() {
  projection = geoOrthographic().fitSize(
    [state.width, state.height],
    countries
  );

  path = geoPath()
    .projection(projection)
    .context(state.ctx.globe);

  sphere = { type: 'Sphere' };
  grid = geoGraticule()();
}

function prepScales() {
  // Translate scales.
  txScale = scaleLinear()
    .domain([0, 0.5])
    .range([state.width * 0.3, state.width * 0.5]);

  tyScale = scaleLinear()
    .domain([0, 0.3, 0.7, 1])
    .range([
      state.height * 0.2,
      state.height * 0.5,
      state.height * 0.475,
      state.height * 0.2,
    ]);

  // The scale scale.
  const sInit = projection.scale();
  sScale = scaleLinear()
    .domain([0, 0.3, 0.7, 1])
    .range([sInit, sInit * 2, sInit * 2, 0]);

  // The globe rotation scale.
  rScale = scaleLinear()
    .domain([0, 0.3, 0.7, 1])
    .range([-50, -1, 1, 100]);

  // The globe's globalAlpha scale.
  gaScale = scaleLinear()
    .domain([0, 0.3, 0.95, 1])
    .range([0, 1, 1, 0]);

  // The arrow's globalAlpha scale.
  aaScale = scaleLinear()
    .domain([0, 0.3, 0.35, 0.65, 0.7, 1])
    .range([0, 0, 1, 1, 0, 0]);
}

const foo = { bar: 0 };

function defineTweenGlobe() {
  prepData();
  prepGeoTools();
  prepScales();

  const tl = gsap.timeline({ onUpdate: renderGlobe });
  const blub = gsap.to(foo, { bar: 1 });
  return tl.add(blub);
}

function tweenGlobe() {
  // Capture current progress.
  const scroll = ScrollTrigger.getById('globe');
  const progress = scroll ? scroll.progress : 0;

  // Kill old - set up new timeline.
  if (state.tween.globe) state.tween.globe.kill();
  state.tween.globe = defineTweenGlobe();
  state.tween.globe.totalProgress(progress);
}

export default tweenGlobe;
