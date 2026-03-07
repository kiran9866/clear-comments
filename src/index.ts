import fs from "fs";
import path from "path";

export const JS_EXTENSIONS: readonly string[] = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
];

export function stripComments(code: string): string {
  let out = "";
  let i = 0;
  const len = code.length;
  let state: "normal" | "line-comment" | "block-comment" | "string" = "normal";
  let stringQuote = "";
  let prev = "";

  while (i < len) {
    const ch = code[i];
    const nxt = code[i + 1];

    if (state === "normal") {
      if (ch === "/" && nxt === "/") {
        state = "line-comment";
        i += 2;
        continue;
      }

      if (ch === "/" && nxt === "*") {
        state = "block-comment";
        i += 2;
        continue;
      }

      if ((ch === '"' || ch === "'" || ch === "`") && prev !== "\\") {
        stringQuote = ch;
        state = "string";
        out += ch;
        i += 1;
        continue;
      }

      out += ch;
      prev = ch;
      i += 1;
      continue;
    }

    if (state === "line-comment") {
      if (ch === "\n") {
        state = "normal";
        out += ch;
      }
      i += 1;
      continue;
    }

    if (state === "block-comment") {
      if (ch === "*" && nxt === "/") {
        state = "normal";
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "string") {
      out += ch;

      if (ch === "`" && stringQuote === "`") {
        if (prev === "\\") {
          // escaped backtick
        } else {
          state = "normal";
        }
        prev = ch;
        i += 1;
        continue;
      }

      if (ch === stringQuote && prev !== "\\") {
        state = "normal";
        stringQuote = "";
        prev = ch;
        i += 1;
        continue;
      }

      if (ch === "\\" && prev === "\\") {
        prev = "";
      } else {
        prev = ch;
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  return out;
}

export function findFiles(rootDir: string, exts = JS_EXTENSIONS): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, exts));
      continue;
    }
    if (exts.includes(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

export function writeFileIfChanged(file: string, content: string): boolean {
  const existing = fs.readFileSync(file, "utf8");
  if (existing !== content) {
    fs.writeFileSync(file, content, "utf8");
    return true;
  }
  return false;
}
