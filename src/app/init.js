import { select } from 'd3-selection/src/index';
import { gsap } from 'gsap/all';
import { MorphSVGPlugin } from 'gsap/src/MorphSVGPlugin';
import { splitPathString, toPathString } from 'flubber/index';
import shot from '../../static/wine-scape-s';
import glass from '../../static/wine-glass';
import bottle from '../../static/wine-bottle';

gsap.registerPlugin(MorphSVGPlugin);

function updateInitialImage() {
  // Elements
  const svg = select('#svg-main-container');
  const initialImage = svg.select('#initial-image');

  // Base measures.
  const initialImageBox = initialImage.node().getBBox();
  const visualWidth = svg.node().offsetWidth;
  const visualHeight = svg.node().offsetHeight;

  // Target measures.
  const scale = visualWidth / initialImageBox.width;
  const originHeight = visualHeight / 2 - (initialImageBox.height * scale) / 2;

  // Update.
  // initialImage.attr(
  svg
    .select('g')
    .attr(
      'transform',
      `translate(0, ${originHeight}) scale(${scale}, ${scale})`
    );
}

function resize() {
  updateInitialImage();
}

function addTestElements(parent) {
  parent
    .append('circle')
    .attr('class', 'circle')
    .attr('cx', 100)
    .attr('cy', 100)
    .attr('r', 20)
    .style('fill', 'none')
    .style('stroke', 'black');

  parent
    .append('rect')
    .attr('class', 'rect')
    .attr('x', 100)
    .attr('y', 100)
    .attr('width', 50)
    .attr('height', 50)
    .style('fill', 'none')
    .style('stroke', 'black');

  MorphSVGPlugin.convertToPath('.circle, .rect');
}

let index = 350;
let imgPathSplit = [];

function findGlassPath() {
  select('#svg-main')
    .select('.hello')
    .remove();

  select('#svg-main')
    .append('g')
    .attr('class', 'hello')
    .attr('transform', `translate(0, 500) scale(0.5, 0.5)`)
    .append('path')
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'black')
    .attr('d', imgPathSplit[index]);

  console.log(index);
  console.log(imgPathSplit[index]);
  index++;

  // gsap.to('#initial-image', { duration: 2, morphSVG: '.circle' });
}

function getBoxDims() {
  const box = select('#svg-main g')
    .node()
    .getBBox();
  console.log(box);
}

function glassToBottle() {
  getBoxDims();
  gsap
    .timeline({ onComplete: getBoxDims })
    .to('#wine-glass', { duration: 3, morphSVG: '#bottle' });
}

function init() {
  const svg = select('#svg-main');
  const group = svg.append('g');

  // Full wine scape svg.
  group
    .append('path')
    .attr('id', 'initial-image')
    .attr('d', shot)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'grey');

  // Just glass section from wine scape svg.
  group
    .append('path')
    .attr('id', 'wine-glass')
    .attr('d', glass)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'red');

  // The bottle as morph target (hidden).
  svg
    .append('path')
    .attr('d', bottle)
    .attr('id', 'bottle')
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('visibility', 'none');

  // Scale and translate the initial image.
  updateInitialImage();

  // imgPathSplit = splitPathString(select('#initial-image').attr('d'));
  // addTestElements(svg);

  window.addEventListener('resize', resize);
  select('#scape-to-bottle').on('click', glassToBottle);
}

export default init;
