import { select } from 'd3-selection/src/index';
import { csv } from 'd3-fetch/src/index';
import rough from 'roughjs/bundled/rough.esm';

import scape from '../../static/wine-scape-s';
import glass from '../../static/wine-glass-clean';
import bottle from '../../static/wine-bottle-1';
import bottleText from '../../static/text-bottle'; // an array of paths.
import update from './update';

// Utils

/**
 * Splits the path at the M commands.
 * Much more readable than reduce 🥂.
 * @param { String } path
 * @returns { Array } an array of paths
 */
function splitPath(path) {
  return path
    .split('M')
    .filter(d => d)
    .map(d => `M${d}`);
}

function buildVisual() {
  const svg = select('#svg-main');
  const scapeGroup = svg.append('g').attr('id', 'scape-group');
  const shapeGroup = svg.append('g').attr('id', 'shape-group');
  const rj = rough.svg(svg.node());
  const rg = rj.generator;

  // Full wine scape svg.
  scapeGroup
    .append('path')
    .attr('id', 'wine-scape-path')
    .attr('d', scape)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');

  // Only the glass from wine scape svg.
  shapeGroup
    .append('path')
    .attr('id', 'shape-path')
    .attr('d', glass)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'red');

  // Get a sketchy bottle.
  const roughBottle = rg.path(bottle, { simplification: 0.6 });
  const roughBottlePath = rg.toPaths(roughBottle);

  // The bottle as morph target (hidden).
  svg
    .append('path')
    .attr('id', 'bottle-path')
    .attr('d', roughBottlePath[0].d)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('visibility', 'none');

  // Add the text to the shape group.
  // Split the bottle text path for the gsap anim.
  const bottleTexts = splitPath(bottleText);
  shapeGroup
    .selectAll('.bottle-text-path')
    .data(bottleTexts)
    .join('path')
    .attr('class', 'bottle-text-path')
    .attr('id', (d, i) => `bottle-text-path-${i}`)
    .attr('d', d => d)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'red');
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

  window.addEventListener('resize', update);
}

function init() {
  csv('../../data/scrolldata.csv').then(ready);
}

export default init;
