export default {
  // General.
  width: null,
  height: null,
  transform: {
    scape: null,
    bottle: null,
    shape: null,
  },
  ctx: {
    scape: null,
    glassBottle: null,
    bottleText: null,
    bottleWave: null,
    lolliChart: null,
  },
  // Tweens.
  tween: {
    wineScape: null,
    glassBottle: null,
    bottleText: null,
    bottleWave: null,
    lolliChart: null,
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
    r: null,
  },
  lolliChart: {
    data: null,
    values: null,
    radius: null,
  },
};
