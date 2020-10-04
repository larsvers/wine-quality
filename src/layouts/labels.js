import { nest } from 'd3-collection';

// We want to calculate each group's label x position only on the points lower to
// the bottom. Not on all points as the shape might be wavey. We do this here...
function focus(leaves) {
  return leaves.filter(
    (_, i, nodes) => i < Math.max(Math.ceil(nodes.length * 0.1), 10)
  );
}

function xValues(values, key) {
  return {
    x: d3.median(focus(values), d => d.x),
    y: d3.max(values, d => d.y),
    xHeader: d3.min(values, d => d.x),
    yHeader: d3.min(values, d => d.y),
    zigzag: String(d3.median(values, key)).length > 3, // 1
  };
}

function yValues(values, key) {
  return {
    x: d3.max(values, d => d.x),
    y: d3.median(focus(values), d => d.y),
    xHeader: d3.min(values, d => d.x),
    yHeader: d3.min(values, d => d.y),
    zigzag: String(d3.median(values, key)).length > 3,
  };
}

function labels() {
  let nestKey;
  let axis = 'x';

  function layout(data) {
    // Label positions.
    const labelPoints = nest()
      .key(nestKey)
      .rollup(v => {
        if (axis === 'x') return xValues(v, nestKey);
        if (axis === 'y') return yValues(v, nestKey);
        throw Error('Label axis parameter needs to b x or y');
      })
      .entries(data)
      .sort((a, b) => +a.key - +b.key);

    // Header positions.
    // Get category with highest y value (which will be the lowest y pixel value).
    const xHeighest = d3.min(labelPoints, d => d.value.xHeader);
    const yHeighest = d3.min(labelPoints, d => d.value.yHeader);
    const xHeader = labelPoints.filter(d => d.value.xHeader === xHeighest)[0];
    const yHeader = labelPoints.filter(d => d.value.yHeader === yHeighest)[0];

    return {
      labels: labelPoints,
      xHeader,
      yHeader,
    };
  }

  layout.nestKey = _ => (_ ? ((nestKey = _), layout) : nestKey);
  layout.axis = _ => (_ ? ((axis = _), layout) : axis);

  return layout;
}

export default labels;

// 1.  if labels are longer than 3 than we should arrange them in zig zag.
