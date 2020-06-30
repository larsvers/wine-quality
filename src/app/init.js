import { select } from 'd3-selection/src/index';
import scape from '../../static/wine-scape-s';
import glass from '../../static/wine-glass';
import bottle from '../../static/wine-bottle';

import update from './update';

function init() {
  const svg = select('#svg-main');
  const scapeGroup = svg.append('g').attr('id', 'scape-group');
  const bottleGroup = svg.append('g').attr('id', 'bottle-group');

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

  update();

  window.addEventListener('resize', update);
}

export default init;
