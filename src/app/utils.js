/* eslint-disable import/no-mutable-exports */
import { select, selection } from 'd3-selection/src/index';
import { scaleLinear } from 'd3-scale/src/index';

function isSelection(el) {
  if (typeof el === 'string') return false;
  if (el instanceof selection) return true;
  return false;
}

function getBox(el) {
  const sel = isSelection(el) ? el : select(el);
  return sel.node().getBBox();
}

// Need xScale in init and update
// but only want to set it once (in init).
let xScale;
function setScaleX(domain, range) {
  xScale = scaleLinear()
    .domain(domain)
    .range(range);
}

export { isSelection, getBox, setScaleX, xScale };
