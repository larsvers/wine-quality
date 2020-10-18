import { mean } from 'd3-array';
import gsap from 'gsap';
import state from '../app/state';

let position = {};

// Control the marker funcx.
function startWaveMarkers() {
  gsap.ticker.add(makeWaveMarkers);
}

function stopWaveMarkers() {
  gsap.ticker.remove(makeWaveMarkers);
}

function drawWaveMarkers(ctx, t, path) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.scale(t.scale, t.scale);

  // Existing content.
  ctx.beginPath();
  ctx.arc(position.x + 20, position.y, 2, 0, 2 * Math.PI);
  ctx.fill();

  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(position.x / 2, position.y);
  ctx.lineTo(position.x + 20, position.y);
  ctx.stroke();

  // New content.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.translate(5, 0);
  ctx.fill(path);

  ctx.restore();
}

function renderWaveMarkers() {
  state.ctx.chart.clearRect(0, 0, state.width, state.height);
  requestAnimationFrame(() => {
    drawWaveMarkers(
      state.ctx.chart,
      state.transform.shape,
      state.bottleWave.bottlePath
    );
  });
}

function makeWaveMarkers() {
  const wave = state.bottleWave;
  if (!wave.wavePoints || !wave.wavePoints.length) return;

  const h = state.glassBottle.bottleBox.height;
  let y = mean(wave.wavePoints, d => d[1]);
  if (y > h * 0.98) y = h * 0.98;
  if (y < h * 0.005) y = h * 0.005;

  position = {
    x: wave.wavePoints[wave.n - 1][0],
    // y: mean(wave.wavePoints, d => d[1]),
    y,
  };
  renderWaveMarkers();
}

export { startWaveMarkers, stopWaveMarkers };
