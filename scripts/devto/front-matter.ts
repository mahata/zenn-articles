const FRONT_MATTER_FENCE = "---";
const TITLE_KEY = "title:";

export function extractFrontMatterTitle(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== FRONT_MATTER_FENCE) {
    throw new Error("The article must start with YAML front matter delimited by ---");
  }

  const closingFenceIndex = lines.indexOf(FRONT_MATTER_FENCE, 1);
  if (closingFenceIndex === -1) {
    throw new Error("The front matter is not closed with ---");
  }

  const titleLine = lines.slice(1, closingFenceIndex).find((line) => line.startsWith(TITLE_KEY));
  if (titleLine === undefined) {
    throw new Error("The front matter has no title");
  }

  const title = parseTitleScalar(titleLine.slice(TITLE_KEY.length).trim());
  if (title === "") {
    throw new Error("The front matter title is empty");
  }
  return title;
}

function parseTitleScalar(rawValue: string): string {
  if (rawValue.startsWith('"')) {
    return parseDoubleQuotedTitle(rawValue);
  }
  if (rawValue.startsWith("'")) {
    return parseSingleQuotedTitle(rawValue);
  }
  if (rawValue.startsWith(">") || rawValue.startsWith("|")) {
    throw new Error("Block scalar titles are not supported; write the title on a single line");
  }
  return parsePlainTitle(rawValue);
}

function parsePlainTitle(rawValue: string): string {
  const titleQuotedLikeDevto = `"${rawValue.replace(/(?<!\\)"/g, '\\"')}"`;
  try {
    return parseDoubleQuotedTitle(titleQuotedLikeDevto);
  } catch {
    throw new Error(
      `dev.to cannot read the backslash escapes in the front matter title: ${rawValue}. Put the title in single quotes to keep backslashes as they are.`,
    );
  }
}

function parseDoubleQuotedTitle(rawValue: string): string {
  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (typeof parsedValue === "string") {
      return parsedValue;
    }
  } catch {}
  throw new Error(`The front matter title is not a valid double-quoted string: ${rawValue}`);
}

function parseSingleQuotedTitle(rawValue: string): string {
  if (rawValue.length < 2 || !rawValue.endsWith("'")) {
    throw new Error(`The front matter title is not a valid single-quoted string: ${rawValue}`);
  }
  return rawValue.slice(1, -1).replaceAll("''", "'");
}
