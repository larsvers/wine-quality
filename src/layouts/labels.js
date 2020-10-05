import { nest } from 'd3-collection';
import { min, max, extent, median } from 'd3-array';

// We want to calculate each group's label x position only on the points lower to
// the bottom. Not on all points as the shape might be wavey. We do this here...
function focus(leaves) {
  return leaves.filter(
    (_, i, nodes) => i < Math.max(Math.ceil(nodes.length * 0.1), 10)
  );
}

// TODO: If I build the x axis, I want
// 1. the minimal y value to align the ticks for the scatter plat
// 2. the maximal y value to position the header.
// 3. the x value of the category with the maximum y value.

function xValues(values, key) {
  return {
    x: median(focus(values), d => d.x),
    y: max(values, d => d.y),
    xRange: extent(values, d => d.x),
    yRange: extent(values, d => d.y),
    zigzag: String(median(values, key)).length > 3, // 1
  };
}

function yValues(values, key) {
  return {
    x: max(values, d => d.x),
    y: median(focus(values), d => d.y),
    xRange: extent(values, d => d.x),
    yRange: extent(values, d => d.y),
    zigzag: String(median(values, key)).length > 3,
  };
}

function labels() {
  let nestKey;
  let axis = 'x';
  let type = 'frequency';

  function layout(data) {
    // Label positions.
    const ticks = nest()
      .key(nestKey)
      .rollup(v => {
        if (axis === 'x') return xValues(v, nestKey);
        if (axis === 'y') return yValues(v, nestKey);
        throw Error('Label axis parameter needs to b x or y');
      })
      .entries(data)
      .sort((a, b) => +a.key - +b.key);

    const bbox = {
      xMin: min(ticks, d => d.value.xRange[0]),
      xMax: max(ticks, d => d.value.xRange[1]),
      yMin: min(ticks, d => d.value.yRange[0]),
      yMax: max(ticks, d => d.value.yRange[1]),
    };
    // Header positions.
    // Get category with highest y value (which will be the lowest y pixel value).
    const xMin = d3.min(ticks, d => d.value.xMin);
    const yMin = d3.min(ticks, d => d.value.yMin);
    const header =
      axis === 'x'
        ? ticks.filter(d => d.value.xMin === xMin)[0]
        : ticks.filter(d => d.value.yMin === yMin)[0];

    return {
      ticks,
      header,
      bbox,
    };
  }

  layout.nestKey = _ => (_ ? ((nestKey = _), layout) : nestKey);
  layout.axis = _ => (_ ? ((axis = _), layout) : axis);
  layout.type = _ => (_ ? ((axis = _), layout) : axis);

  return layout;
}

export default labels;

// 1.  if labels are longer than 3 than we should arrange them in zig zag.
