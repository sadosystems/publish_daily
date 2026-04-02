declare global {
  interface Window {
    __CALENDAR_DATA__: Record<string, { painting: number; coding: number; writing: number }>;
  }
}

const CALENDAR_DATA = window.__CALENDAR_DATA__;

function dateKey(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const calendarFlow = document.getElementById('calendar-flow')!;
const feedSection = document.getElementById('feed-section')!;
const tooltip = document.getElementById('tooltip')!;
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Color helpers (all CSS var references, no math) ─────────────
type Task = 'painting' | 'coding' | 'writing';
const TASKS: Task[] = ['painting', 'coding', 'writing'];

function cellColor(task: Task, level: number): string {
  return `var(--color-${task}-cell-${level >= 2 ? 'l2' : 'l1'})`;
}

function layerColor(task: Task, level: number): string {
  return level >= 2 ? `var(--color-${task}-l2)` : `var(--color-${task})`;
}

function paintCell(cell: HTMLElement, entry: { painting: number; coding: number; writing: number } | undefined): void {
  if (!entry) return;
  const tasks = TASKS.filter(t => entry[t]);
  if (tasks.length === 0) return;

  if (tasks.length === 1) {
    cell.style.background = cellColor(tasks[0], entry[tasks[0]]);
    return;
  }

  cell.style.background = 'var(--cell-multi-bg)';
  tasks.forEach(t => {
    const level = entry[t];
    const layer = document.createElement('div');
    layer.className = 'cell-layer';
    layer.style.background = layerColor(t, level);
    layer.style.opacity = (level === 1 ? 0.75 : 1).toFixed(2);
    const dx = (Math.random() - 0.5) * 3;
    const dy = (Math.random() - 0.5) * 3;
    layer.style.transform = `translate(${dx}px, ${dy}px)`;
    cell.appendChild(layer);
  });

  const vo = parseFloat(cssVar('--cell-veil-opacity')) || 0;
  if (vo > 0) {
    const veil = document.createElement('div');
    veil.className = 'cell-layer';
    veil.style.background = '#fff';
    veil.style.mixBlendMode = 'screen';
    veil.style.opacity = String(vo);
    veil.style.transform = 'none';
    cell.appendChild(veil);
  }
}

function recolorCell(cell: HTMLElement, entry: { painting: number; coding: number; writing: number } | undefined): void {
  cell.querySelectorAll('.cell-layer').forEach(l => l.remove());
  cell.style.background = '';
  paintCell(cell, entry);
}

function tipDot(task: Task, entry: { painting: number; coding: number; writing: number } | undefined): string {
  const level = entry ? (entry[task] || 0) : 0;
  const bg = level === 0 ? 'var(--cell-empty)' : cellColor(task, level);
  return `<span class="tip-dot" style="background:${bg}">${level}</span>`;
}

// ── Calendar Weeks ──────────────────────────────────────────────
const startMonth = new Date(today.getFullYear() - 1, today.getMonth() + 1, 1);
const startDay = new Date(startMonth);
startDay.setDate(startDay.getDate() - startDay.getDay());

const allWeeks: Date[] = [];
{
  const c = new Date(startDay);
  while (c <= today) {
    allWeeks.push(new Date(c));
    c.setDate(c.getDate() + 7);
  }
}

// ── Calendar Layout ─────────────────────────────────────────────
function calcSplits(): number[] {
  const cellPx = calendarFlow.querySelector('.row-grid .cell')?.clientWidth || 16;
  const gapPx = 5;
  const dayLabelW = 32;
  const available = calendarFlow.parentElement!.clientWidth - 40;
  const colW = cellPx + gapPx;
  const maxCols = Math.floor((available - dayLabelW) / colW);
  if (maxCols >= allWeeks.length) return [allWeeks.length];
  const numRows = Math.ceil(allWeeks.length / maxCols);
  const perRow = Math.ceil(allWeeks.length / numRows);
  const splits: number[] = [];
  for (let i = 0; i < allWeeks.length; i += perRow) {
    splits.push(Math.min(perRow, allWeeks.length - i));
  }
  return splits;
}

function highlightDayEl(el: HTMLElement): void {
  el.style.outline = '2px solid ' + cssVar('--highlight-color');
  setTimeout(() => { el.style.outline = 'none'; }, 1500);
}

function buildCalendar(): void {
  calendarFlow.innerHTML = '';
  const splits = calendarFlow.dataset.measured ? calcSplits() : [allWeeks.length];

  let weekOffset = 0;
  let lastMonthKey = '';
  splits.forEach((rowWeekCount) => {
    const rowWeeks = allWeeks.slice(weekOffset, weekOffset + rowWeekCount);
    weekOffset += rowWeekCount;

    const rowContainer = document.createElement('div');
    rowContainer.className = 'calendar-row';

    const monthBar = document.createElement('div');
    monthBar.className = 'row-months cal-label';
    const labelData: { month: number; year: number; col: number }[] = [];
    rowWeeks.forEach((sunday, colIdx) => {
      const thu = new Date(sunday);
      thu.setDate(thu.getDate() + 3);
      const m = thu.getMonth();
      const y = thu.getFullYear();
      const key = `${y}-${m}`;
      if (key !== lastMonthKey) {
        labelData.push({ month: m, year: y, col: colIdx });
        lastMonthKey = key;
      }
    });

    let isFirstLabel = (weekOffset - rowWeekCount === 0);
    labelData.forEach((ld, i) => {
      const span = document.createElement('span');
      const nextCol = (i < labelData.length - 1) ? labelData[i + 1].col : rowWeekCount;
      const cols = nextCol - ld.col;
      const skip = isFirstLabel && i === 0 && labelData.length > 1 && cols < 3;
      span.textContent = skip ? '' : monthNames[ld.month];
      span.dataset.cols = String(cols);
      monthBar.appendChild(span);
    });

    rowContainer.appendChild(monthBar);

    const body = document.createElement('div');
    body.className = 'row-body';

    const dl = document.createElement('div');
    dl.className = 'day-labels cal-label';
    for (let i = 0; i < 7; i++) {
      const span = document.createElement('span');
      span.textContent = dayNames[i];
      dl.appendChild(span);
    }
    body.appendChild(dl);

    const grid = document.createElement('div');
    grid.className = 'row-grid';

    rowWeeks.forEach(sunday => {
      for (let d = 0; d < 7; d++) {
        const day = new Date(sunday);
        day.setDate(day.getDate() + d);
        const key = dateKey(day);
        const entry = CALENDAR_DATA[key];
        const isFuture = day > today;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.date = key;

        if (isFuture) {
          cell.classList.add('future');
        } else {
          paintCell(cell, entry);

          cell.addEventListener('mouseenter', () => {
            const ent = CALENDAR_DATA[cell.dataset.date!];
            const dateStr = formatDateNice(cell.dataset.date!);
            tooltip.innerHTML = '<span class="tip-date">' + dateStr + '</span>' +
              '<span class="tip-dots">' + tipDot('painting', ent) + tipDot('coding', ent) + tipDot('writing', ent) + '</span>';
            tooltip.classList.add('visible');
          });
          cell.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top = (e.clientY - 32) + 'px';
          });
          cell.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
          });
          cell.addEventListener('click', () => {
            const target = document.getElementById('day-' + cell.dataset.date);
            if (target) {
              const dist = Math.abs(target.getBoundingClientRect().top);
              const chipHeight = 200;
              const behavior = dist > chipHeight * 4 ? 'instant' : 'smooth';
              target.scrollIntoView({ behavior, block: 'start' });
            }
          });
        }

        grid.appendChild(cell);
      }
    });

    body.appendChild(grid);
    rowContainer.appendChild(body);
    calendarFlow.appendChild(rowContainer);
  });

  const firstCell = calendarFlow.querySelector('.row-grid .cell') as HTMLElement | null;
  if (firstCell) {
    const cellW = firstCell.offsetWidth + 5;
    calendarFlow.querySelectorAll('.row-months').forEach(bar => {
      bar.querySelectorAll('span').forEach(span => {
        (span as HTMLElement).style.width = (parseInt((span as HTMLElement).dataset.cols!) * cellW) + 'px';
      });
    });

    if (!calendarFlow.dataset.measured) {
      calendarFlow.dataset.measured = '1';
      buildCalendar();
      return;
    }
  }
}

// ── Separator side-mode ─────────────────────────────────────────
function updateSeparatorMode(): void {
  const seps = feedSection.querySelectorAll('.day-separator');
  if (!seps.length) return;
  const feedRect = feedSection.getBoundingClientRect();
  const needsSide = feedRect.left > 200;
  seps.forEach(s => s.classList.toggle('side-mode', needsSide));
}

// ── Helpers ─────────────────────────────────────────────────────
function formatDateNice(key: string): string {
  const [y, m, d] = key.split('-');
  const dt = new Date(+y, +m - 1, +d);
  return weekdays[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + +d;
}

// ── Init ────────────────────────────────────────────────────────
buildCalendar();
updateSeparatorMode();

// Hash navigation
if (window.location.hash) {
  const el = document.getElementById(window.location.hash.slice(1));
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
}

let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    calendarFlow.dataset.measured = '1';
    buildCalendar();
    updateSeparatorMode();
  }, 200);
});

// ── Theme Toggle ────────────────────────────────────────────────
// The toggle click is handled by ThemeToggle.astro.
// Recolor multi-task calendar cells when the theme attribute changes.
new MutationObserver(() => {
  calendarFlow.querySelectorAll('.cell').forEach(cell => {
    const el = cell as HTMLElement;
    if (el.querySelector('.cell-layer')) {
      recolorCell(el, CALENDAR_DATA[el.dataset.date!]);
    }
  });
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
