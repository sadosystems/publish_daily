import { getTheme } from './theme-config';
import type { DayEntry } from './mock-data';

function parseRgb(s: string): [number, number, number] {
  const m = s.match(/(\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
}

export function taskColorForLevel(task: string, level: number): string {
  const t = getTheme();
  const key = task as keyof typeof t.taskColors;
  return level >= 2 ? t.taskColorsL2[key] : t.taskColorsL1[key];
}

export function taskColor(entry: DayEntry): string | null {
  if (!entry) return null;
  return getTheme().compositeColor(entry);
}

export function addCellLayers(cell: HTMLElement, entry: DayEntry | undefined): void {
  if (!entry) return;
  const tasks = (['painting', 'coding', 'writing'] as const).filter(t => entry[t]);
  if (tasks.length === 0) return;

  const theme = getTheme();

  if (tasks.length === 1) {
    const level = entry[tasks[0]];
    const t = level === 1 ? 0.75 : 1;
    const [cr, cg, cb] = parseRgb(taskColorForLevel(tasks[0], level));
    const [br, bg, bb] = theme.lerpBase;
    const r = Math.round(br + (cr - br) * t);
    const g = Math.round(bg + (cg - bg) * t);
    const b = Math.round(bb + (cb - bb) * t);
    cell.style.background = `rgb(${r}, ${g}, ${b})`;
    return;
  }

  cell.style.background = theme.multiCellBg;
  tasks.forEach(t => {
    const level = entry[t];
    const layer = document.createElement('div');
    layer.className = 'cell-layer';
    layer.style.background = taskColorForLevel(t, level);
    layer.style.opacity = (level === 1 ? 0.75 : 1).toFixed(2);
    const dx = (Math.random() - 0.5) * 3;
    const dy = (Math.random() - 0.5) * 3;
    layer.style.transform = `translate(${dx}px, ${dy}px)`;
    cell.appendChild(layer);
  });

  if (theme.veil && tasks.length >= 2) {
    const veil = document.createElement('div');
    veil.className = 'cell-layer';
    veil.style.background = '#fff';
    veil.style.mixBlendMode = 'screen';
    veil.style.opacity = String(theme.veil.opacity);
    veil.style.transform = 'none';
    cell.appendChild(veil);
  }
}

export function recolorCell(cell: HTMLElement, entry: DayEntry | undefined): void {
  if (!entry) return;
  const tasks = (['painting', 'coding', 'writing'] as const).filter(t => entry[t]);
  if (tasks.length === 0) return;

  const theme = getTheme();

  // Remove old layers
  cell.querySelectorAll('.cell-layer').forEach(l => l.remove());

  if (tasks.length === 1) {
    const level = entry[tasks[0]];
    const t = level === 1 ? 0.75 : 1;
    const [cr, cg, cb] = parseRgb(taskColorForLevel(tasks[0], level));
    const [br, bg, bb] = theme.lerpBase;
    const r = Math.round(br + (cr - br) * t);
    const g = Math.round(bg + (cg - bg) * t);
    const b = Math.round(bb + (cb - bb) * t);
    cell.style.background = `rgb(${r}, ${g}, ${b})`;
    return;
  }

  cell.style.background = theme.multiCellBg;
  tasks.forEach(t => {
    const level = entry[t];
    const layer = document.createElement('div');
    layer.className = 'cell-layer';
    layer.style.background = taskColorForLevel(t, level);
    layer.style.opacity = (level === 1 ? 0.75 : 1).toFixed(2);
    // Use deterministic offsets from the cell's existing layers (already random from initial render)
    const dx = (Math.random() - 0.5) * 3;
    const dy = (Math.random() - 0.5) * 3;
    layer.style.transform = `translate(${dx}px, ${dy}px)`;
    cell.appendChild(layer);
  });

  if (theme.veil && tasks.length >= 2) {
    const veil = document.createElement('div');
    veil.className = 'cell-layer';
    veil.style.background = '#fff';
    veil.style.mixBlendMode = 'screen';
    veil.style.opacity = String(theme.veil.opacity);
    veil.style.transform = 'none';
    cell.appendChild(veil);
  }
}

export function tipDot(task: string, entry: DayEntry | undefined): string {
  const level = entry ? ((entry as any)[task] || 0) : 0;
  let bg: string;
  if (level === 0) {
    bg = 'var(--cell-empty)';
  } else {
    const theme = getTheme();
    const [cr, cg, cb] = parseRgb(theme.taskColors[task as keyof typeof theme.taskColors]);
    const [br, bgc, bb] = theme.lerpBase;
    const t = level / 2;
    const r = Math.round(br + (cr - br) * t);
    const g = Math.round(bgc + (cg - bgc) * t);
    const b = Math.round(bb + (cb - bb) * t);
    bg = `rgb(${r},${g},${b})`;
  }
  return `<span class="tip-dot" style="background:${bg}">${level}</span>`;
}

export function sepDotColor(task: string, level: number): string {
  const theme = getTheme();
  const [cr, cg, cb] = parseRgb(taskColorForLevel(task, level));
  const [br, bg, bb] = theme.lerpBase;
  const t = level === 1 ? 0.75 : 1;
  const r = Math.round(br + (cr - br) * t);
  const g = Math.round(bg + (cg - bg) * t);
  const b = Math.round(bb + (cb - bb) * t);
  return `rgb(${r},${g},${b})`;
}
