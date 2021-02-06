import { select } from 'd3-selection';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import state from '../app/state';
import sloth from '../../static/animal-sloth-2b';
import { renderAnimals } from '../tweens/animals';

function clicked() {
  const slothArrays = MorphSVGPlugin.stringToRawPath(sloth);
  state.glassBottle.path = slothArrays;
  renderAnimals();
}

function slothReveal() {
  select('#sloth-button').on('mousedown', clicked);
}

export default slothReveal;
