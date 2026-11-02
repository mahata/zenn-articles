const CHARACTERS_DEVTO_REMOVES_FROM_TITLES =
  /[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc}\p{Join_Control}\p{White_Space}\p{P}$+<=>^`|~\p{Sc}\u00a9\u00ae\u061c\u180e\u200c\u200d\u200e-\u200f\u202c-\u202e\u2066-\u2069\u20e3\u2122\u2139\u2194-\u2199\u21a9-\u21aa\u231a\u231b\u2328\u23cf\u23e9-\u23f3\u23f8-\u23fa\u24c2\u25aa\u25ab\u25b6\u25c0\u25fb-\u25fe\u2600-\u273f\u2744\u2747\u274c\u274e\u2753-\u2755\u2757\u2763-\u2764\u2795-\u2797\u27a1\u27b0\u27bf\u2934\u2935\u2b00-\u2bff\u3030\u303d\u3297\u3299\u{1f000}-\u{1ffff}]+/gu;
const ASCII_WHITESPACE_RUN = /[ \t\n\v\f\r]+/g;
const ASCII_WHITESPACE_AT_EDGES = /^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g;

export function normalizeDevtoTitle(title: string): string {
  return title
    .replace(CHARACTERS_DEVTO_REMOVES_FROM_TITLES, " ")
    .replace(ASCII_WHITESPACE_RUN, " ")
    .replace(ASCII_WHITESPACE_AT_EDGES, "");
}
