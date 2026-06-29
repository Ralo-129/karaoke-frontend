import { LRC_DEFAULT_LINE_DURATION_S } from "./constants";

export type LrcWord = {
  text: string;
  startTime: number;
  endTime: number;
};

export type LrcLine = {
  time: number;
  endTime: number;
  text: string;
  words: LrcWord[];
};

export function parseLrc(raw: string): LrcLine[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rawEntries: { time: number; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/);
    if (!match) {
      rawEntries.push({ time: rawEntries.length, text: line });
      continue;
    }

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const centiseconds = Number(match[3] ?? "0");
    const text = match[4]?.trim() ?? "";

    const time = minutes * 60 + seconds + centiseconds / 100;
    rawEntries.push({ time, text });
  }

  rawEntries.sort((a, b) => a.time - b.time);

  const entries: LrcLine[] = [];

  for (let i = 0; i < rawEntries.length; i++) {
    const current = rawEntries[i];
    const next = rawEntries[i + 1];

    const lineEndTime = next ? next.time : current.time + LRC_DEFAULT_LINE_DURATION_S;
    const duration = lineEndTime - current.time;

    const words: LrcWord[] = [];
    const wordMatches = [...current.text.matchAll(/<(\d{2}):(\d{2})\.(\d{2})>([^<]*)/g)];

    if (wordMatches.length > 0) {
      for (const m of wordMatches) {
        const wTime = Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 100;
        const wText = m[4].trim();
        if (!wText) continue;
        if (words.length > 0) {
          words[words.length - 1].endTime = wTime;
        }
        words.push({ text: wText, startTime: wTime, endTime: lineEndTime });
      }
    } else {
      const realWords = current.text.split(/\s+/).filter((w) => w.length > 0);
      const perWord = duration / (realWords.length || 1);
      realWords.forEach((w, idx) => {
        words.push({
          text: w,
          startTime: current.time + idx * perWord,
          endTime: current.time + (idx + 1) * perWord,
        });
      });
    }

    entries.push({
      time: current.time,
      endTime: lineEndTime,
      text: current.text.replace(/<\d{2}:\d{2}\.\d{2}>/g, ""),
      words,
    });
  }

  return entries;
}
