import { select } from 'd3-selection/src/index';
import { csv } from 'd3-fetch/src/index';
import { gsap } from 'gsap/all';
import { ScrollTrigger } from 'gsap/src/ScrollTrigger';
import scape from '../../static/wine-scape-s';
import glass from '../../static/wine-glass';
import bottle from '../../static/wine-bottle';

import update from './update';

gsap.registerPlugin(ScrollTrigger);

function buildVisual() {
  const svg = select('#svg-main');
  const scapeGroup = svg.append('g').attr('id', 'scape-group');
  const bottleGroup = svg.append('g').attr('id', 'bottle-group');

  // Test
  svg
    .append('rect')
    .attr('class', 'my-rect')
    .attr('x', 100)
    .attr('y', 100)
    .attr('width', 100)
    .attr('height', 100)
    .style('fill', 'none')
    .style('stroke', 'black');

  // Full wine scape svg.
  scapeGroup
    .append('path')
    .attr('id', 'wine-scape-path')
    .attr('d', scape)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');

  // Just glass section from wine scape svg.
  bottleGroup
    .append('path')
    .attr('id', 'shape-path')
    .attr('d', glass)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'red');

  // The bottle as morph target (hidden).
  svg
    .append('path')
    .attr('id', 'bottle-path')
    .attr('d', bottle)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('visibility', 'none');

  svg
    .append('path')
    .attr('id', 'wine-glass-path')
    .attr('d', glass)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('visibility', 'none');
}

function buildStory(data) {
  const container = select('#text-wrap');

  // Set up the text.
  container
    .selectAll('section')
    .data(data)
    .join('div')
    .attr('class', d => `section section-${d.index}`)
    .html(d => d.text);
}

function ready(data) {
  buildVisual();
  buildStory(data);

  update();

  gsap.to('.my-rect', {
    x: 150,
    scrollTrigger: {
      scroller: '#text-wrap',
      trigger: '.section-2',
      start: 'top center',
      end: 'center center',
      scrub: true,
      markers: true,
      onEnter: self => console.log('entered', self),
    },
  });

  window.addEventListener('resize', update);
}

function init() {
  csv('../../data/scrolldata.csv').then(ready);
}

export default init;
