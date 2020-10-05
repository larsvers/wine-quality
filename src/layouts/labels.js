import { nest } from 'd3-collection';
import { min, max, extent, median } from 'd3-array';

// We want to calculate each group's label x position only on the points lower to
// the bottom. Not on all points as the shape might be wavey. We do this here...
function focus(leaves) {
  return leaves.filter(
    (_, i, nodes) => i < Math.max(Math.ceil(nodes.length * 0.1), 10)
  );
}

// Values for an x axis.
function xAxisValues(values, key, p) {
  return {
    x: median(focus(values), d => d.x),
    y: max(values, d => d.y) + p,
    xRange: extent(values, d => d.x),
    yRange: extent(values, d => d.y),
    zigzag: String(median(values, key)).length > 3, // 1
  };
}

// Values for a y axis.
function yAxisValues(values, key, p) {
  return {
    x: max(values, d => d.x) + p,
    y: median(focus(values), d => d.y),
    xRange: extent(values, d => d.x),
    yRange: extent(values, d => d.y),
    zigzag: String(median(values, key)).length > 3,
  };
}

function labels() {
  let nestKey;
  let axis = 'x';
  let align = false;
  let padding = 10;

  function layout(data) {
    // Label positions for each variable category.
    const ticks = nest()
      .key(nestKey)
      .rollup(v => {
        if (axis === 'x') return xAxisValues(v, nestKey, padding);
        if (axis === 'y') return yAxisValues(v, nestKey, padding);
        throw Error('Label axis parameter needs to be x or y');
      })
      .entries(data)
      .sort((a, b) => +a.key - +b.key);

    // Bounding box of the variable's point cloud.
    const bbox = {
      xMin: min(ticks, d => d.value.xRange[0]),
      xMax: max(ticks, d => d.value.xRange[1]),
      yMin: min(ticks, d => d.value.yRange[0]),
      yMax: max(ticks, d => d.value.yRange[1]),
    };

    // If align is true, we correct/align the labels' cross axis position.
    if (align && axis === 'x') {
      ticks.forEach(tick => (tick.value.y = bbox.yMax + padding));
    }
    if (align && axis === 'y') {
      ticks.forEach(tick => (tick.value.x = bbox.xMax + padding));
    }

    return {
      ticks,
      bbox,
    };
  }

  layout.nestKey = _ => (_ ? ((nestKey = _), layout) : nestKey);
  layout.axis = _ => (_ ? ((axis = _), layout) : axis);
  layout.padding = _ => (_ ? ((padding = _), layout) : padding);
  // Special treatment for boolean getter/setter:
  layout.align = _ =>
    _ !== undefined || _ !== null ? ((align = _), layout) : align;

  return layout;
}

export default labels;

// 1.  if labels are longer than 3 than we should arrange them in zig zag.
