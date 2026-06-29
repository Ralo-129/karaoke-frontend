import { describe, it, expect } from "vitest";
import { parseLrc } from "../../app/lib/lrc";

describe("parseLrc", () => {
  it("returns empty array for empty input", () => {
    expect(parseLrc("")).toEqual([]);
    expect(parseLrc("   ")).toEqual([]);
  });

  it("parses a simple LRC line with timestamp", () => {
    const result = parseLrc("[01:23.45] Hello world");
    expect(result).toHaveLength(1);
    expect(result[0].time).toBeCloseTo(83.45);
    expect(result[0].text).toBe("Hello world");
  });

  it("parses multiple lines and sorts by time", () => {
    const lrc = "[00:10.00] Second\n[00:05.00] First";
    const result = parseLrc(lrc);
    expect(result[0].text).toBe("First");
    expect(result[1].text).toBe("Second");
  });

  it("sets endTime of a line to start of next line", () => {
    const lrc = "[00:05.00] Line one\n[00:10.00] Line two";
    const result = parseLrc(lrc);
    expect(result[0].endTime).toBeCloseTo(10);
    expect(result[1].endTime).toBeCloseTo(15); // last line gets +5s default
  });

  it("parses word timestamps with <MM:SS.CC> syntax", () => {
    const lrc = "[00:05.00] <00:05.00>Hello <00:05.50>world";
    const result = parseLrc(lrc);
    expect(result[0].words).toHaveLength(2);
    expect(result[0].words[0].text).toBe("Hello");
    expect(result[0].words[0].startTime).toBeCloseTo(5.0);
    expect(result[0].words[0].endTime).toBeCloseTo(5.5);
    expect(result[0].words[1].text).toBe("world");
    expect(result[0].words[1].startTime).toBeCloseTo(5.5);
  });

  it("strips word timestamp markers from text field", () => {
    const lrc = "[00:05.00] <00:05.00>Hello <00:05.50>world";
    const result = parseLrc(lrc);
    expect(result[0].text).toBe("Hello world");
  });

  it("falls back to uniform word distribution when no word timestamps", () => {
    const lrc = "[00:00.00] one two three\n[00:06.00] next";
    const result = parseLrc(lrc);
    expect(result[0].words).toHaveLength(3);
    expect(result[0].words[0].text).toBe("one");
    expect(result[0].words[0].startTime).toBeCloseTo(0);
    expect(result[0].words[0].endTime).toBeCloseTo(2);
    expect(result[0].words[1].startTime).toBeCloseTo(2);
    expect(result[0].words[2].endTime).toBeCloseTo(6);
  });

  it("handles line without timestamp as plain text", () => {
    const result = parseLrc("just a plain line");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("just a plain line");
  });

  it("produces at least one word per non-empty line", () => {
    const lrc = "[00:00.00] sing along";
    const result = parseLrc(lrc);
    expect(result[0].words.length).toBeGreaterThan(0);
  });
});
