export interface TaskColors {
  painting: string;
  coding: string;
  writing: string;
}

export interface ThemePalette {
  taskColors: TaskColors;
  taskColorsL1: TaskColors;
  taskColorsL2: TaskColors;
  lerpBase: [number, number, number];
  multiCellBg: string;
  veil: { opacity: number } | null;
  highlightColor: string;
  compositeColor: (entry: Record<string, number>) => string | null;
}

const DARK: ThemePalette = {
  taskColors:   { painting: 'rgb(171, 35, 18)',  coding: 'rgb(45, 56, 155)',  writing: 'rgb(40, 140, 35)' },
  taskColorsL1: { painting: 'rgb(171, 35, 18)',  coding: 'rgb(48, 52, 158)',  writing: 'rgb(35, 140, 42)' },
  taskColorsL2: { painting: 'rgb(180, 50, 12)',  coding: 'rgb(40, 72, 165)',  writing: 'rgb(48, 144, 30)' },
  lerpBase: [37, 44, 53],
  multiCellBg: '#000',
  veil: null,
  highlightColor: 'rgba(255,255,255,0.5)',
  compositeColor(entry) {
    let r = 0, g = 0, b = 0;
    const s = (level: number) => level / 2;
    if (entry.painting) { const k = s(entry.painting); r += 171*k; g += 35*k;  b += 18*k;  }
    if (entry.writing)  { const k = s(entry.writing);  r += 40*k;  g += 140*k; b += 35*k;  }
    if (entry.coding)   { const k = s(entry.coding);   r += 45*k;  g += 56*k;  b += 155*k; }
    return `rgb(${Math.min(Math.round(r),255)}, ${Math.min(Math.round(g),255)}, ${Math.min(Math.round(b),255)})`;
  },
};

const LIGHT: ThemePalette = {
  taskColors:   { painting: 'rgb(230, 65, 148)', coding: 'rgb(55, 170, 228)', writing: 'rgb(250, 210, 55)' },
  taskColorsL1: { painting: 'rgb(230, 65, 148)', coding: 'rgb(55, 170, 228)', writing: 'rgb(250, 210, 55)' },
  taskColorsL2: { painting: 'rgb(218, 48, 158)', coding: 'rgb(40, 155, 220)', writing: 'rgb(240, 198, 42)' },
  lerpBase: [245, 240, 232],
  multiCellBg: '#f5f0e8',
  veil: { opacity: 0.13 },
  highlightColor: 'rgba(0,0,0,0.4)',
  compositeColor(entry) {
    let r = 1, g = 1, b = 1;
    const s = (level: number) => level / 2;
    if (entry.painting) { const k = s(entry.painting); r *= 1 - k * (1 - 230/255); g *= 1 - k * (1 - 65/255);  b *= 1 - k * (1 - 148/255); }
    if (entry.writing)  { const k = s(entry.writing);  r *= 1 - k * (1 - 250/255); g *= 1 - k * (1 - 210/255); b *= 1 - k * (1 - 55/255);  }
    if (entry.coding)   { const k = s(entry.coding);   r *= 1 - k * (1 - 55/255);  g *= 1 - k * (1 - 170/255); b *= 1 - k * (1 - 228/255); }
    return `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
  },
};

export function getTheme(): ThemePalette {
  return document.documentElement.dataset.theme === 'light' ? LIGHT : DARK;
}

export function isDark(): boolean {
  return document.documentElement.dataset.theme !== 'light';
}
