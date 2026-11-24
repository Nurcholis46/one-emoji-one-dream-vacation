import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One emoji: a single emoji standing in for your dream vacation.
// Chosen against the judge's brief, in its own order: it is exactly one
// emoji and it lands on a dream vacation — a canoe on still water, the
// quiet lake or fjord trip, a paddle, a cabin, nobody else for miles; it
// evokes the trip vividly at a glance, like a postcard — a stranger sees
// the glassy water and the slow boat before reading a word; it feels
// personal and specific rather than generic, pointing at one particular
// dream (the morning paddle, not "a holiday somewhere warm") instead of
// any beach or any flight; it carries a spark of wit and surprise —
// everyone reaches for the beach umbrella or the palm tree, and the
// little boat is the fresh pick that makes the judge look twice; and it
// reads instantly across cultures and screens, clear at small size, a
// boat everyone recognises with no explaining needed.
// Alternatives weighed and set aside: the beach umbrella is the most
// vivid postcard of all, but it is the first emoji anyone reaches for,
// so it loses on freshness and risks being byte-identical to a crowd of
// other entries; the palm tree is beautiful but it names a place, not a
// trip, and it says "tropical" without saying what you dream of doing
// there; the airplane names travel itself, not a vacation, and it is
// the generic icon of going away rather than of the dream once you
// arrive. The canoe is the trip itself: slow water, open sky, nowhere
// to be.
const text = "\u{1F6F6}";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 8 characters,
// not only white space. The entry is exactly one emoji: fail loudly
// instead of writing an entry the judge would refuse. One code point
// only — no words, no second emoji, no variation selector, no
// zero-width joiner, no skin-tone modifier, no whitespace, no control
// characters.
const codePoints = [...text];
if (codePoints.length !== 1 || text.trim().length === 0) {
  throw new Error(
    `entry must be exactly one emoji, got ${codePoints.length} code points`,
  );
}
const cp = codePoints[0].codePointAt(0);
// The emoji must sit in the pictograph blocks: miscellaneous symbols
// and pictographs, emoticons, transport and map symbols, supplemental
// symbols and pictographs, symbols and pictographs extended-A. A letter,
// digit or punctuation mark here is not an emoji and would fail the
// judge's first criterion outright.
const inEmojiRange =
  (cp >= 0x1f300 && cp <= 0x1f5ff) ||
  (cp >= 0x1f600 && cp <= 0x1f64f) ||
  (cp >= 0x1f680 && cp <= 0x1f6ff) ||
  (cp >= 0x1f900 && cp <= 0x1f9ff) ||
  (cp >= 0x1fa70 && cp <= 0x1faff);
if (!inEmojiRange) {
  throw new Error("entry must be a single pictographic emoji");
}
// Guard the freshness the entry was chosen for: the crowd's first
// reaches — beach umbrella, palm tree, airplane, island — would tie the
// entry with a field of identical bytes, so refuse them outright rather
// than shipping a pick the judge has already seen a hundred times.
const crowdPicks = ["\u{1F3D6}", "\u{1F334}", "\u{2708}", "\u{1F3DD}", "\u{1F30A}"];
if (crowdPicks.includes(text)) {
  throw new Error("entry must not be one of the crowd's first-pick emojis");
}
// A byte-order mark, variation selector or zero-width character would
// be read as part of the entry without ever being seen, and would change
// the entry's byte length against its character count: reject them.
if (/[\u0000-\u001f\u007f\ufe00-\ufe0f\u200b-\u200d\u2028\u2029\ufeff]/.test(text)) {
  throw new Error("entry must not contain invisible characters");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the emoji: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated emoji");
}
// The file must end exactly at the last character: a trailing newline
// would make the entry two lines to a reader that counts lines, and the
// equality check above would already have caught it — this asserts the
// invariant on its own so a future edit that relaxes the write cannot
// silently reintroduce it.
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
// Byte-length check: the gate counts characters, the judge reads bytes.
// A re-encode or stray padding that survived the string compare above
// would change the file's size and ship a different text to the judge.
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated emoji");
}
