// Fuente geométrica original. Regenera SVG y PNG sin servicios externos.
const fs = require('fs');
const { PNG } = require('pngjs');
fs.mkdirSync('assets/brand', { recursive: true });
const navy = [18, 52, 77], teal = [13, 148, 136];
const angle = -35 * Math.PI / 180;
function ring(x, y, cx) {
  const dx = x - cx, dy = y - 512;
  const px = Math.cos(angle) * dx + Math.sin(angle) * dy;
  const py = -Math.sin(angle) * dx + Math.cos(angle) * dy;
  // Distancia al borde de un rectángulo de 330 x 210, radio 105.
  const qx = Math.abs(px) - 60, qy = Math.abs(py);
  const sdf = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 105;
  return Math.abs(sdf) <= 30;
}
function raster(file, size, background = null, mono = false, scale = 1) {
  const png = new PNG({ width: size, height: size });
  const samples = 3;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let rgba = [0, 0, 0, 0];
    for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
      const px = (((x + (sx + .5) / samples) / size * 1024) - 512) / scale + 512;
      const py = (((y + (sy + .5) / samples) / size * 1024) - 512) / scale + 512;
      let color = background;
      if (ring(px, py, 410)) color = mono ? [255, 255, 255] : navy;
      if (ring(px, py, 614)) color = mono ? [255, 255, 255] : teal;
      if (color) { for (let c = 0; c < 3; c++) rgba[c] += color[c]; rgba[3]++; }
    }
    const i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) png.data[i + c] = rgba[3] ? Math.round(rgba[c] / rgba[3]) : 0;
    png.data[i + 3] = Math.round(rgba[3] / (samples * samples) * 255);
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}
const shapes = '<rect x="245" y="407" width="330" height="210" rx="105" transform="rotate(-35 410 512)" fill="none" stroke="#12344D" stroke-width="60"/><rect x="449" y="407" width="330" height="210" rx="105" transform="rotate(-35 614 512)" fill="none" stroke="#0D9488" stroke-width="60"/>';
fs.writeFileSync('assets/brand/symbol.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">' + shapes + '</svg>');
fs.writeFileSync('assets/brand/logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 420"><g transform="translate(-30 -5) scale(.42)">' + shapes + '</g><text x="390" y="228" font-family="Arial,sans-serif" font-size="103" font-weight="700" fill="#12344D">Connecta<tspan fill="#0D9488">Oficios</tspan></text><text x="395" y="280" font-family="Arial,sans-serif" font-size="27" letter-spacing="4" fill="#667085">CONEXIÓN QUE GENERA CONFIANZA</text></svg>');
raster('assets/brand/symbol.png', 1024);
raster('assets/brand/app-icon.png', 1024, [255, 255, 255]);
raster('assets/brand/adaptive-foreground.png', 1024, null, false, .8);
raster('assets/brand/adaptive-monochrome.png', 1024, null, true, .8);
raster('assets/brand/splash.png', 1024);
raster('assets/brand/favicon.png', 64, [255, 255, 255]);
console.log('Branding generado: 2 SVG y 6 PNG.');
