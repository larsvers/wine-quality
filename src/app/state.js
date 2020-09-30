export default {
  // General.
  width: null,
  height: null,
  transform: {
    shape: null,
    scape: null,
    bottle: null,
    // all the animal transforms
    // are being added in `update`
    dataset: null,
  },
  ctx: {
    scape: null,
    glassBottle: null,
    bottleText: null,
    bottleWave: null,
    lolli: null,
    blackBox: null,
    globe: null,
  },
  // Tweens.
  tween: {
    wineScape: null,
    glassBottle: null,
    bottleText: null,
    bottleWave: null,
    lolliChart: null,
    lolliUpdate1: null,
    lolliUpdate2: null,
    lolliUpdate3: null,
    blackBox: null,
    cleanup: null,
    bottleEmpty: null,
    bottleTextOut: null,
    animals: null,
    bottleFill: null,
    bottleColour: null,
    bottleGrid: null,
    bottleGridColour: null,
    bottleGridSort: null,
    bottleGridOut: null,
    // dataset tweens are being added in tween func
    globe: null,
  },
  scape: {
    image: null,
    alpha: null,
    alphaTarget: 0.2,
  },
  glassBottle: {
    bottleBox: null,
    bottleTop: null, // % of bottle's top position
    bottleLeft: null, // % of bottle's top position
    path: null,
    colour: null,
  },
  bottleText: {
    paths: null,
    maxLength: null,
    dashOffset: null,
    colour: null,
  },
  bottleWave: {
    bottlePath: null,
    wavePoints: null,
    lift: null,
    liftTarget: null,
    r: null,
    n: 20,
    xWaveScale: null,
    waveLine: null,
    waveAlpha: null,
  },
  lolli: {
    data: null,
    values: null,
    radiusTarget: null,
    area: null,
    x: null,
    y: null,
  },
  blackBox: {
    box: null,
    boxDims: null,
    model: null,
    xOffset: null,
  },
  animals: {
    bird: null,
    croc: null,
    giraffe: null,
    pig: null,
    sloth1: null,
    sloth2: null,
    whale: null,
  },
  bottleColour: {
    start: ['#619FFC', '#f5992c'],
    stop: ['#023B64', '#AE5E00'],
    base: '#000000',
    colourStop0: '#000000',
    colourStop1: '#000000',
  },
  bottleGrid: {
    baseData: null,
    dataOrigin: null,
    dataTarget: null,
    dataSorted: null,
    dataOut: null,
    colour: {
      good: '#000000',
      bad: '#000000',
    },
  },
  dataset: {
    info: null,
    box: null,
    // all the column path data
    // are being added in `init`
  },
  globe: {
    data: null,
    scroll: {
      progress: null,
      direction: null,
    },
  },
  stats: {
    data: null,
    links: null,
  },
};
