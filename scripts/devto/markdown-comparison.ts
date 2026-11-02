const FENCED_CODE_BLOCK =
  /(?<leading>^|\n)(?<indent> {0,3})(?<fence>`{3,}|~{3,})(?<info>[^\n]*)\n(?<code>.*?)\n\k<indent>\k<fence>(?<closingWhitespace>[ \t]*)(?=\n|$)/gs;
const BLANK_INFO = /^[\p{White_Space}\0]*$/u;
const CODE_BLOCK_LANGUAGE = /^[^\s`~]+$/;

export function hasSameMarkdown(localMarkdown: string, remoteMarkdown: string): boolean {
  const normalizedLocalMarkdown = normalizeMarkdown(localMarkdown);
  const localLines = normalizedLocalMarkdown.split("\n");
  const remoteLines = normalizeMarkdown(remoteMarkdown).split("\n");
  if (localLines.length !== remoteLines.length) {
    return false;
  }

  const unlabeledFenceOpeningsByLineIndex = findUnlabeledFenceOpenings(normalizedLocalMarkdown);
  return localLines.every((localLine, lineIndex) => {
    const remoteLine = remoteLines[lineIndex] ?? "";
    if (localLine === remoteLine) {
      return true;
    }
    const unlabeledFenceOpening = unlabeledFenceOpeningsByLineIndex.get(lineIndex);
    return (
      unlabeledFenceOpening !== undefined &&
      remoteLine.startsWith(unlabeledFenceOpening) &&
      CODE_BLOCK_LANGUAGE.test(remoteLine.slice(unlabeledFenceOpening.length))
    );
  });
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replaceAll("\r\n", "\n").trimEnd();
}

function findUnlabeledFenceOpenings(markdown: string): Map<number, string> {
  const unlabeledFenceOpeningsByLineIndex = new Map<number, string>();
  for (const codeBlock of markdown.matchAll(FENCED_CODE_BLOCK)) {
    const { leading = "", indent = "", fence = "", info = "" } = codeBlock.groups ?? {};
    if (!BLANK_INFO.test(info)) {
      continue;
    }
    const openingLineStart = codeBlock.index + leading.length;
    const openingLineIndex = markdown.slice(0, openingLineStart).split("\n").length - 1;
    unlabeledFenceOpeningsByLineIndex.set(openingLineIndex, `${indent}${fence}`);
  }
  return unlabeledFenceOpeningsByLineIndex;
}
