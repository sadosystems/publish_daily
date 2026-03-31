export interface PRData {
  title: string;
  num: number;
  adds: number;
  dels: number;
  files: number;
  commits: number;
  merged: boolean;
  desc: string;
}

export interface PostData {
  title: string;
  body: string;
}

export interface DayEntry {
  painting: number;
  coding: number;
  writing: number;
  pr?: PRData;
  post?: PostData;
}

export const DEMO_SINGLE_CHIP = false;
export const DEMO_DENSE = true;

export function dateKey(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

const prData: PRData[] = [
  { title: "Fix calendar grid overflow on narrow viewports", num: 47, adds: 34, dels: 12, files: 2, commits: 1, merged: true, desc: "Cell size was unclamped, causing horizontal overflow under 900px." },
  { title: "Add additive RGB color blending for task layers", num: 42, adds: 156, dels: 23, files: 4, commits: 3, merged: true, desc: "Uses mix-blend-mode: screen on a black base to combine task color layers additively." },
  { title: "Implement feed card chip variants", num: 51, adds: 220, dels: 89, files: 3, commits: 5, merged: false, desc: "Adds three distinct chip types: polaroid images, mini PR cards, and editorial prose blocks." },
  { title: "Refactor week assignment logic for month boundaries", num: 44, adds: 67, dels: 91, files: 1, commits: 2, merged: true, desc: "Assigns each week to the month its Saturday falls in, eliminating duplicate boundary weeks." },
  { title: "Add rust WASM bindings for sketch engine", num: 18, adds: 412, dels: 3, files: 8, commits: 7, merged: false, desc: "Initial wasm-bindgen setup exposing draw_frame and the color palette to JS." },
  { title: "Dotfiles: add new tmux keybindings", num: 203, adds: 14, dels: 6, files: 1, commits: 1, merged: true, desc: "Adds prefix-a as a secondary prefix for quick pane switching." },
];

const writingPosts: PostData[] = [
  { title: "On the texture of daily practice", body: "There's something about showing up every day that changes the nature of the work itself. It stops being about any single output and becomes about the accumulated weight of attention. I've noticed that the days I least want to sit down are often the days that produce the most interesting results. Not because suffering is productive, but because resistance is a signal that you're pushing against the edge of what you know. The comfortable work is the work you've already mastered. The uncomfortable work is where growth lives. I don't think this means you should always be uncomfortable. But I think it means you should notice when you are, and lean into it a little before retreating to safety." },
  { title: "Tools shape the hand that holds them", body: "I switched from Procreate to oil paint last month and the difference isn't just tactile. The way I think about composition has changed. Digital tools let you undo, so you plan less. Oil forces commitment. Every stroke is a decision you have to live with or paint over, and painting over leaves a trace. There's a metaphor in there about how the tools we choose for thinking shape the thoughts we're capable of having. A word processor thinks in paragraphs. A typewriter thinks in pages. A pen thinks in sentences. I wonder what we lose when we optimize for ease of revision." },
  { title: "The color of Tuesday", body: "I've been tracking my creative output for six months now and I'm starting to see patterns I didn't expect. Tuesdays are almost always my most productive painting days. Thursdays are for writing. I can't explain it. There's no structural reason for this. My schedule is the same every day. But the data doesn't lie. Maybe there's some weekly rhythm in energy or attention that I'm not consciously aware of. Or maybe I just happened to have a few good Tuesdays early on and the pattern became self-reinforcing." },
  { title: "Against optimization", body: "Everyone wants to optimize their creative process. Wake up at 5am. Use the Pomodoro technique. Batch your tasks. Eliminate distractions. I've tried all of it and the thing that actually works is much simpler and much harder: care about what you're making. When I care, the hours disappear. When I don't, no amount of productivity theater will save the work. The hard part isn't finding the right system. The hard part is finding the right project. Everything else follows from genuine interest." },
  { title: "What the calendar shows", body: "Looking at a year of creative work compressed into colored squares is a strange experience. Some weeks are dense with activity, every cell lit up. Others are sparse. The temptation is to judge the sparse weeks as failures, but when I click into them I often find that those were the weeks I was thinking. Germinating. The work that followed was better for the pause. Not every gap is procrastination. Some gaps are preparation. The calendar can't tell you which is which. Only you know." },
  { title: "Additive color as creative metaphor", body: "The way this site blends red, green, and blue for painting, coding, and writing feels accidentally profound. When you do all three, the result isn't muddy. It's bright. Almost white. In subtractive color mixing, combining everything makes brown. In additive mixing, combining everything makes light. I like the idea that creative pursuits combine additively. Writing doesn't take away from painting. Coding doesn't diminish writing. They illuminate each other. The days I do all three feel like that. Not exhausting. Luminous." },
];

export function generateMockData(): Record<string, DayEntry> {
  const data: Record<string, DayEntry> = {};
  const today = new Date();

  if (DEMO_SINGLE_CHIP) {
    const key = dateKey(today);
    data[key] = { painting: 0, coding: 0, writing: 2, post: writingPosts[0] };
    return data;
  }

  if (DEMO_DENSE) {
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const progress = (364 - i) / 364;
      const taskChance = progress;
      const pick = () => {
        if (Math.random() > taskChance) return 0;
        return Math.random() < progress ? 2 : 1;
      };
      const painting = pick();
      const coding = pick();
      const writing = pick();
      if (!painting && !coding && !writing) continue;
      const entry: DayEntry = { painting, coding, writing };
      if (coding)  entry.pr = prData[Math.floor(Math.random() * prData.length)];
      if (writing) entry.post = writingPosts[Math.floor(Math.random() * writingPosts.length)];
      data[key] = entry;
    }
    return data;
  }

  let pPaint = 0.6 + Math.random() * 0.25;
  let pCode  = 0.6 + Math.random() * 0.25;
  let pWrite = 0.6 + Math.random() * 0.25;

  function drift(p: number) {
    p += (Math.random() - 0.5) * 0.08;
    return Math.max(0.3, Math.min(0.9, p));
  }

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);

    pPaint = drift(pPaint);
    pCode  = drift(pCode);
    pWrite = drift(pWrite);

    if (Math.random() < 0.03) pPaint = 0.3 + Math.random() * 0.55;
    if (Math.random() < 0.03) pCode  = 0.3 + Math.random() * 0.55;
    if (Math.random() < 0.03) pWrite = 0.3 + Math.random() * 0.55;

    const painting = Math.random() < pPaint ? Math.ceil(Math.random() * 2) : 0;
    const coding   = Math.random() < pCode  ? Math.ceil(Math.random() * 2) : 0;
    const writing  = Math.random() < pWrite ? Math.ceil(Math.random() * 2) : 0;

    if (!painting && !coding && !writing) continue;

    const entry: DayEntry = { painting, coding, writing };
    if (coding)  entry.pr = prData[Math.floor(Math.random() * prData.length)];
    if (writing) entry.post = writingPosts[Math.floor(Math.random() * writingPosts.length)];

    data[key] = entry;
  }
  return data;
}
