export default {
  // General.
  width: null,
  height: null,
  transform: {
    shape: null,
    scape: null,
    bottle: null,
    // all the animal transforms
    // will be added in `update`
  },
  ctx: {
    scape: null,
    glassBottle: null,
    bottleText: null,
    bottleWave: null,
    lolli: null,
    blackBox: null,
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
    bottleFill: null,
    bottleTextOut: null,
    animals: null,
  },
  scape: {
    image: null,
    alpha: null,
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
};
