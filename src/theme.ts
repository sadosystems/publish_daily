// Reads base colors from global.css at build time and derives
// the blended cell colors via lerp. Only generates the
// --color-*-cell-l1 and --color-*-cell-l2 vars.

import fs from 'node:fs';
import path from 'node:path';

const CSS_PATH = path.resolve(process.cwd(), 'src/styles/global.css');

function parseRgb(s: string): [number, number, number] {
  const m = s.match(/(\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
}

function rgb(c: [number, number, number]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function lerp(base: [number, number, number], color: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(base[0] + (color[0] - base[0]) * t),
    Math.round(base[1] + (color[1] - base[1]) * t),
    Math.round(base[2] + (color[2] - base[2]) * t),
  ];
}

interface ThemeVars {
  painting: [number, number, number];
  paintingL2: [number, number, number];
  coding: [number, number, number];
  codingL2: [number, number, number];
  writing: [number, number, number];
  writingL2: [number, number, number];
  lerpBase: [number, number, number];
}

function extractBlock(css: string, selector: string): string {
  const idx = css.indexOf(selector);
  if (idx === -1) return '';
  const start = css.indexOf('{', idx);
  let depth = 1;
  let i = start + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(start + 1, i - 1);
}

function getVar(block: string, name: string): string {
  const re = new RegExp(`${name}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function parseThemeBlock(block: string): ThemeVars {
  return {
    painting: parseRgb(getVar(block, '--color-painting')),
    paintingL2: parseRgb(getVar(block, '--color-painting-l2')),
    coding: parseRgb(getVar(block, '--color-coding')),
    codingL2: parseRgb(getVar(block, '--color-coding-l2')),
    writing: parseRgb(getVar(block, '--color-writing')),
    writingL2: parseRgb(getVar(block, '--color-writing-l2')),
    lerpBase: parseRgb(getVar(block, '--cell-lerp-base')),
  };
}

function deriveCellVars(vars: ThemeVars): string {
  const L1_STRENGTH = 0.75;
  return [
    `  --color-painting-cell-l1: ${rgb(lerp(vars.lerpBase, vars.painting, L1_STRENGTH))};`,
    `  --color-painting-cell-l2: ${rgb(vars.paintingL2)};`,
    `  --color-coding-cell-l1: ${rgb(lerp(vars.lerpBase, vars.coding, L1_STRENGTH))};`,
    `  --color-coding-cell-l2: ${rgb(vars.codingL2)};`,
    `  --color-writing-cell-l1: ${rgb(lerp(vars.lerpBase, vars.writing, L1_STRENGTH))};`,
    `  --color-writing-cell-l2: ${rgb(vars.writingL2)};`,
  ].join('\n');
}

export function generateDerivedCSS(): string {
  const css = fs.readFileSync(CSS_PATH, 'utf-8');

  const darkBlock = extractBlock(css, '[data-theme="dark"]');
  const lightBlock = extractBlock(css, '[data-theme="light"]');

  const darkVars = parseThemeBlock(darkBlock);
  const lightVars = parseThemeBlock(lightBlock);

  return [
    '/* Auto-generated at build time from base colors in global.css */',
    `[data-theme="dark"] {`,
    deriveCellVars(darkVars),
    `}`,
    `[data-theme="light"] {`,
    deriveCellVars(lightVars),
    `}`,
  ].join('\n');
}
