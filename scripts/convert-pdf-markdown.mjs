#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, dirname, extname, resolve } from 'path';

const [, , inputArg, outputArg] = process.argv;

function usage() {
  console.log([
    'Uso:',
    '  npm run pdf:md -- <archivo.pdf> [salida.md]',
    '',
    'Ejemplos:',
    '  npm run pdf:md -- data/pdf-inbox/protocolo.pdf',
    '  npm run pdf:md -- ~/Downloads/protocolo.pdf data/markdown/protocolo.md',
    '',
    'Si markitdown no esta en PATH, define MARKITDOWN_BIN:',
    '  MARKITDOWN_BIN=/ruta/al/markitdown npm run pdf:md -- archivo.pdf',
  ].join('\n'));
}

if (!inputArg || inputArg === '-h' || inputArg === '--help') {
  usage();
  process.exit(inputArg ? 0 : 1);
}

const inputPath = resolve(inputArg.replace(/^~(?=$|\/)/, process.env.HOME || '~'));
if (!existsSync(inputPath)) {
  console.error(`No existe el archivo: ${inputPath}`);
  process.exit(1);
}

const defaultName = `${basename(inputPath, extname(inputPath))}.md`;
const outputPath = resolve(outputArg || `data/markdown/${defaultName}`);

const candidates = [
  process.env.MARKITDOWN_BIN
    ? { label: 'MARKITDOWN_BIN', command: process.env.MARKITDOWN_BIN, args: [inputPath] }
    : null,
  { label: 'markitdown', command: 'markitdown', args: [inputPath] },
  { label: 'python3 -m markitdown', command: 'python3', args: ['-m', 'markitdown', inputPath] },
  { label: 'python -m markitdown', command: 'python', args: ['-m', 'markitdown', inputPath] },
].filter(Boolean);

const failures = [];
let markdown = '';
let used = '';

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, candidate.args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 80,
  });

  if (!result.error && result.status === 0 && result.stdout.trim()) {
    markdown = result.stdout;
    used = candidate.label;
    break;
  }

  const reason = result.error?.message || result.stderr?.trim() || `exit ${result.status}`;
  failures.push(`${candidate.label}: ${reason}`);
}

if (!markdown) {
  console.error('No pude ejecutar MarkItDown desde este entorno.');
  console.error('');
  console.error('Intentos:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('');
  console.error('Soluciones habituales:');
  console.error('- Instalarlo en este Python: python3 -m pip install markitdown');
  console.error('- O pasar la ruta exacta: MARKITDOWN_BIN=/ruta/al/markitdown npm run pdf:md -- archivo.pdf');
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

console.log(JSON.stringify({
  input: inputPath,
  output: outputPath,
  converter: used,
  characters: markdown.length,
}, null, 2));
