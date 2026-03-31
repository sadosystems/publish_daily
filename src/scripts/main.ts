import { generateMockData, dateKey } from './mock-data';
import type { DayEntry } from './mock-data';
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const MOCK_DATA = generateMockData();

const today = new Date();
today.setHours(0, 0, 0, 0);

const calendarFlow = document.getElementById('calendar-flow')!;
const tooltip = document.getElementById('tooltip')!;
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Color helpers (all read from CSS vars, no runtime math) ─────
type Task = 'painting' | 'coding' | 'writing';
const TASKS: Task[] = ['painting', 'coding', 'writing'];

function cellColor(task: Task, level: number): string {
  const suffix = level >= 2 ? 'l2' : 'l1';
  return `var(--color-${task}-cell-${suffix})`;
}

function layerColor(task: Task, level: number): string {
  return level >= 2 ? `var(--color-${task}-l2)` : `var(--color-${task})`;
}

function paintCell(cell: HTMLElement, entry: DayEntry | undefined): void {
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

function recolorCell(cell: HTMLElement, entry: DayEntry | undefined): void {
  cell.querySelectorAll('.cell-layer').forEach(l => l.remove());
  cell.style.background = '';
  paintCell(cell, entry);
}

function tipDot(task: Task, entry: DayEntry | undefined): string {
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

function buildCalendar(): void {
  calendarFlow.innerHTML = '';
  const splits = calendarFlow.dataset.measured ? calcSplits() : [allWeeks.length];

  let weekOffset = 0;
  splits.forEach((rowWeekCount) => {
    const rowWeeks = allWeeks.slice(weekOffset, weekOffset + rowWeekCount);
    weekOffset += rowWeekCount;

    const rowContainer = document.createElement('div');
    rowContainer.className = 'calendar-row';

    const monthBar = document.createElement('div');
    monthBar.className = 'row-months cal-label';

    let lastMonth = -1;
    const labelData: { month: number; year: number; col: number }[] = [];
    rowWeeks.forEach((sunday, colIdx) => {
      const thu = new Date(sunday);
      thu.setDate(thu.getDate() + 3);
      const m = thu.getMonth();
      const y = thu.getFullYear();
      if (m !== lastMonth) {
        labelData.push({ month: m, year: y, col: colIdx });
        lastMonth = m;
      }
    });

    labelData.forEach((ld, i) => {
      const span = document.createElement('span');
      span.textContent = monthNames[ld.month];
      const nextCol = (i < labelData.length - 1) ? labelData[i + 1].col : rowWeekCount;
      span.dataset.cols = String(nextCol - ld.col);
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
        const entry = MOCK_DATA[key];
        const isFuture = day > today;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.date = key;

        if (isFuture) {
          cell.classList.add('future');
        } else {
          paintCell(cell, entry);

          cell.addEventListener('mouseenter', () => {
            const ent = MOCK_DATA[cell.dataset.date!];
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
            const key = cell.dataset.date!;
            if (VirtualFeed.initialized) {
              VirtualFeed.goToDay(key);
            } else {
              const target = document.getElementById('day-' + key);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightDayEl(target);
              }
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

// ── Feed ────────────────────────────────────────────────────────
const feedSection = document.getElementById('feed-section')!;

function highlightDayEl(el: HTMLElement): void {
  el.style.outline = '2px solid ' + cssVar('--highlight-color');
  setTimeout(() => { el.style.outline = 'none'; }, 1500);
}

const activeDays: string[] = [];
for (let i = 0; i < 365; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const key = dateKey(d);
  if (MOCK_DATA[key]) activeDays.push(key);
}

function seededRandom(key: string): () => number {
  let h = 0;
  for (let i = 0; i < key.length; i++) { h = ((h << 5) - h + key.charCodeAt(i)) | 0; }
  return function() { h = (h * 16807 + 0) & 0x7fffffff; return (h & 0xffff) / 0x10000; };
}

function renderDay(key: string): HTMLElement | null {
  const entry = MOCK_DATA[key];
  if (!entry) return null;
  const rng = seededRandom(key);
  const d = new Date(key + 'T12:00:00');

  const group = document.createElement('div');
  group.className = 'day-group';
  group.dataset.key = key;

  const sep = document.createElement('div');
  sep.className = 'day-separator';
  sep.id = 'day-' + key;

  const dotWrap = document.createElement('div');
  dotWrap.className = 'sep-dot-wrap';
  const activeTasks = TASKS.filter(t => entry[t]);
  if (activeTasks.length === 1) {
    dotWrap.style.borderRadius = '50%';
    dotWrap.style.background = cellColor(activeTasks[0], entry[activeTasks[0]]);
  } else {
    dotWrap.style.borderRadius = '50%';
    activeTasks.forEach(task => {
      const layer = document.createElement('div');
      layer.className = 'sep-layer';
      layer.style.background = layerColor(task, entry[task]);
      layer.style.opacity = (entry[task] === 1 ? 0.75 : 1).toFixed(2);
      const dx = (rng() - 0.5) * 5.5;
      const dy = (rng() - 0.5) * 5.5;
      layer.style.transform = `translate(${dx}px, ${dy}px)`;
      dotWrap.appendChild(layer);
    });
  }

  sep.appendChild(dotWrap.cloneNode(true));
  sep.insertAdjacentHTML('beforeend', `
    <span>${key} &middot; ${weekdays[d.getDay()]}</span>
    <div class="sep-line"></div>
  `);

  const sideInfo = document.createElement('div');
  sideInfo.className = 'sep-info';
  sideInfo.appendChild(dotWrap);
  sideInfo.insertAdjacentHTML('beforeend', `<span>${key} &middot; ${weekdays[d.getDay()]}</span>`);
  sep.appendChild(sideInfo);
  group.appendChild(sep);

  if (entry.painting) {
    const chip = document.createElement('div');
    chip.className = 'chip-painting';
    chip.id = 'chip-' + key + '-painting';
    const paintImgs = ['publish_daily_1.png', 'publish_daily_2.png', 'logo_card.png'];
    const paintSrc = paintImgs[Math.floor(rng() * paintImgs.length)];
    chip.innerHTML = `<div class="img-wrap"><img src="/${paintSrc}" alt="painting" loading="lazy"></div>`;
    group.appendChild(chip);
  }

  if (entry.coding) {
    const pr = entry.pr!;
    const chip = document.createElement('div');
    chip.className = 'chip-coding';
    chip.id = 'chip-' + key + '-coding';
    const mIcon = pr.merged
      ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="#a371f7"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 4a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path></svg>`
      : `<svg width="16" height="16" viewBox="0 0 16 16" fill="#3fb950"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>`;
    const mBadge = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="${pr.merged ? 'M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 4a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z' : 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z'}"></path></svg>`;
    const tot = pr.adds + pr.dels;
    const aB = tot > 0 ? Math.round((pr.adds / tot) * 5) : 0;
    const dB = tot > 0 ? Math.round((pr.dels / tot) * 5) : 0;
    const nB = Math.max(0, 5 - aB - dB);
    let bar = '';
    for (let b = 0; b < aB; b++) bar += '<span class="b-add"></span>';
    for (let b = 0; b < dB; b++) bar += '<span class="b-del"></span>';
    for (let b = 0; b < nB; b++) bar += '<span class="b-neu"></span>';
    chip.innerHTML = `
      <div class="pr-title-row">${mIcon}<span class="pr-title">${pr.title} <span class="pr-num">#${pr.num}</span></span></div>
      <div class="pr-meta-line">
        <span class="badge ${pr.merged ? 'merged' : 'open'}">${mBadge} ${pr.merged ? 'Merged' : 'Open'}</span>
        <span class="sep">&middot;</span>
        <span>${pr.files} file${pr.files > 1 ? 's' : ''}</span>
        <span class="sep">&middot;</span>
        <span>${pr.commits} commit${pr.commits > 1 ? 's' : ''}</span>
        <span class="sep">&middot;</span>
        <span class="additions">+${pr.adds}</span>
        <span class="deletions">&minus;${pr.dels}</span>
        <span class="diffbar">${bar}</span>
      </div>
      <div class="pr-desc">${pr.desc}</div>
    `;
    group.appendChild(chip);
  }

  if (entry.writing) {
    const chip = document.createElement('div');
    chip.className = 'chip-writing';
    chip.id = 'chip-' + key + '-writing';
    chip.innerHTML = `
      <h3>${entry.post!.title}</h3>
      <div class="prose">${entry.post!.body}</div>
      <div class="prose-fade">continue reading &rarr;</div>
    `;
    group.appendChild(chip);
  }

  return group;
}

// ── Virtual Feed Controller ─────────────────────────────────────
const VirtualFeed = {
  WINDOW_SIZE: 30,
  BUFFER: 10,
  startIdx: 0,
  endIdx: 0,
  heightRegistry: {} as Record<string, number>,
  avgDayHeight: 200,
  spacerTop: null as HTMLElement | null,
  spacerBottom: null as HTMLElement | null,
  sentinelTop: null as HTMLElement | null,
  sentinelBottom: null as HTMLElement | null,
  window: null as HTMLElement | null,
  observer: null as IntersectionObserver | null,
  initialized: false,

  init() {
    this.spacerTop = document.createElement('div');
    this.spacerTop.id = 'feed-spacer-top';
    this.sentinelTop = document.createElement('div');
    this.sentinelTop.id = 'feed-sentinel-top';
    this.window = document.createElement('div');
    this.window.id = 'feed-window';
    this.sentinelBottom = document.createElement('div');
    this.sentinelBottom.id = 'feed-sentinel-bottom';
    this.spacerBottom = document.createElement('div');
    this.spacerBottom.id = 'feed-spacer-bottom';

    feedSection.appendChild(this.spacerTop);
    feedSection.appendChild(this.sentinelTop);
    feedSection.appendChild(this.window);
    feedSection.appendChild(this.sentinelBottom);
    feedSection.appendChild(this.spacerBottom);

    this.endIdx = Math.min(this.WINDOW_SIZE, activeDays.length);
    this.renderWindow();
    this.initialized = true;

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (entry.target === this.sentinelTop) this.extendTop();
        if (entry.target === this.sentinelBottom) this.extendBottom();
      }
    }, { rootMargin: '300px 0px', threshold: 0 });

    this.observer.observe(this.sentinelTop);
    this.observer.observe(this.sentinelBottom);

    if (window.location.hash) this.handleHash();
    window.addEventListener('hashchange', () => this.handleHash());
  },

  renderWindow() {
    this.window!.innerHTML = '';
    for (let i = this.startIdx; i < this.endIdx; i++) {
      const el = renderDay(activeDays[i]);
      if (el) this.window!.appendChild(el);
    }
    this.measureRendered();
    this.updateSpacers();
    updateSeparatorMode();
  },

  measureRendered() {
    const groups = this.window!.querySelectorAll('.day-group');
    let totalMeasured = 0;
    let count = 0;
    groups.forEach(g => {
      const h = (g as HTMLElement).offsetHeight;
      this.heightRegistry[(g as HTMLElement).dataset.key!] = h;
      totalMeasured += h;
      count++;
    });
    if (count > 0) this.avgDayHeight = totalMeasured / count;
  },

  heightFor(idx: number): number {
    return this.heightRegistry[activeDays[idx]] || this.avgDayHeight;
  },

  updateSpacers() {
    let topH = 0;
    for (let i = 0; i < this.startIdx; i++) topH += this.heightFor(i);
    let bottomH = 0;
    for (let i = this.endIdx; i < activeDays.length; i++) bottomH += this.heightFor(i);
    this.spacerTop!.style.height = topH + 'px';
    this.spacerBottom!.style.height = bottomH + 'px';
  },

  extendTop() {
    if (this.startIdx <= 0) return;
    const oldStart = this.startIdx;
    this.startIdx = Math.max(0, this.startIdx - this.BUFFER);

    const frag = document.createDocumentFragment();
    for (let i = this.startIdx; i < oldStart; i++) {
      const el = renderDay(activeDays[i]);
      if (el) frag.appendChild(el);
    }

    const heightBefore = this.window!.offsetHeight;
    this.window!.insertBefore(frag, this.window!.firstChild);
    const heightAfter = this.window!.offsetHeight;
    window.scrollBy(0, heightAfter - heightBefore);

    if (this.endIdx - this.startIdx > this.WINDOW_SIZE + this.BUFFER) {
      const trimCount = (this.endIdx - this.startIdx) - this.WINDOW_SIZE;
      for (let i = 0; i < trimCount; i++) {
        const last = this.window!.lastElementChild;
        if (last) last.remove();
      }
      this.endIdx -= trimCount;
    }

    this.measureRendered();
    this.updateSpacers();
    updateSeparatorMode();
  },

  extendBottom() {
    if (this.endIdx >= activeDays.length) return;
    const oldEnd = this.endIdx;
    this.endIdx = Math.min(activeDays.length, this.endIdx + this.BUFFER);

    for (let i = oldEnd; i < this.endIdx; i++) {
      const el = renderDay(activeDays[i]);
      if (el) this.window!.appendChild(el);
    }

    if (this.endIdx - this.startIdx > this.WINDOW_SIZE + this.BUFFER) {
      const trimCount = (this.endIdx - this.startIdx) - this.WINDOW_SIZE;
      for (let i = 0; i < trimCount; i++) {
        const first = this.window!.firstElementChild;
        if (first) first.remove();
      }
      this.startIdx += trimCount;
    }

    this.measureRendered();
    this.updateSpacers();
    updateSeparatorMode();
  },

  goToDay(key: string) {
    const idx = activeDays.indexOf(key);
    if (idx === -1) return;

    const existing = document.getElementById('day-' + key);
    if (existing) {
      const rect = existing.getBoundingClientRect();
      const dist = Math.abs(rect.top - window.innerHeight / 2);
      if (dist < window.innerHeight * 2) {
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightDayEl(existing);
        history.replaceState(null, '', '#day-' + key);
        return;
      }
    }

    const half = Math.floor(this.WINDOW_SIZE / 2);
    this.startIdx = Math.max(0, idx - half);
    this.endIdx = Math.min(activeDays.length, this.startIdx + this.WINDOW_SIZE);
    this.startIdx = Math.max(0, this.endIdx - this.WINDOW_SIZE);

    this.renderWindow();

    requestAnimationFrame(() => {
      const el = document.getElementById('day-' + key);
      if (el) {
        el.scrollIntoView({ block: 'center' });
        highlightDayEl(el);
      }
      history.replaceState(null, '', '#day-' + key);
    });
  },

  handleHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const match = hash.match(/^(?:day|chip)-([\d-]+)/);
    if (!match) return;
    const key = match[1];
    const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return;
    this.goToDay(dateMatch[1]);
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ block: 'center' });
    });
  }
};

// ── Separator Mode ──────────────────────────────────────────────
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
VirtualFeed.init();
updateSeparatorMode();

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
// Since colors use var() references, single-task cells and separator dots
// update automatically when the theme changes. Only multi-task cells need
// recoloring because they have layer divs with the veil overlay.
function recolorMultiCells(): void {
  calendarFlow.querySelectorAll('.cell').forEach(cell => {
    const el = cell as HTMLElement;
    if (el.querySelector('.cell-layer')) {
      recolorCell(el, MOCK_DATA[el.dataset.date!]);
    }
  });

  const feedWindow = document.getElementById('feed-window');
  if (!feedWindow) return;
  feedWindow.querySelectorAll('.sep-dot-wrap').forEach(dot => {
    const el = dot as HTMLElement;
    if (!el.querySelector('.sep-layer')) return;
    const group = el.closest('.day-group') as HTMLElement | null;
    if (!group) return;
    const entry = MOCK_DATA[group.dataset.key!];
    if (!entry) return;
    // Multi-task dots: rebuild layers for new blend mode
    el.querySelectorAll('.sep-layer').forEach(l => l.remove());
    const activeTasks = TASKS.filter(t => entry[t]);
    activeTasks.forEach(task => {
      const layer = document.createElement('div');
      layer.className = 'sep-layer';
      layer.style.background = layerColor(task, entry[task]);
      layer.style.opacity = (entry[task] === 1 ? 0.75 : 1).toFixed(2);
      el.appendChild(layer);
    });
  });
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const html = document.documentElement;
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  localStorage.setItem('theme', next);
  recolorMultiCells();
});
