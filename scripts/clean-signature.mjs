// Deterministic background cleanup authorized by the asset owner.
// Original stays untouched; black strokes retain their original alpha and position.
import { decode, encode } from 'fast-png';
import { readFileSync, writeFileSync } from 'node:fs';
const source = decode(readFileSync(new URL('../public/firma-alvarado.png', import.meta.url)));
if (source.channels !== 4 || source.depth !== 8) throw new Error('Expected 8-bit RGBA source');
const data = new Uint8Array(source.data.length);
for (let i = 0; i < data.length; i += 4) {
  const luminance = (source.data[i] + source.data[i + 1] + source.data[i + 2]) / 3;
  // Remove white paper and faint scanner edges; retain anti-aliased dark ink.
  const ink = luminance >= 225 ? 0 : 1 - luminance / 255;
  data[i + 3] = Math.round(source.data[i + 3] * ink);
}
writeFileSync(new URL('../public/firma-alvarado-limpia.png', import.meta.url), encode({ width: source.width, height: source.height, channels: 4, data }));
