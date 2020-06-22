import { select } from 'd3-selection/src/index';
import shot from '../../static/wine-scape';

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
  initialImage.attr(
    'transform',
    `translate(0, ${originHeight}) scale(${scale}, ${scale})`
  );
}

function resize() {
  updateInitialImage();
}

function scapeToBottle() {
  // Continue here.
}

function init() {
  const initialImage = select('#svg-main').append('g');

  initialImage
    .append('path')
    .attr('id', 'initial-image')
    .attr('d', shot)
    .style('fill', 'none')
    .style('stroke-width', 1)
    .style('stroke', 'black');

  updateInitialImage();

  window.addEventListener('resize', resize);
  select('#scape-to-bottle').on('click', scapeToBottle);
}

export default init;
