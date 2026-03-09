import fs from "fs";
import path from "path";

type NativeApi = {
  stripComments: (code: string) => string;
};

let nativeStripComments: ((code: string) => string) | null = null;

try {
  // dist/index.js -> ../native/index.js
  const native = require("../native") as NativeApi;
  if (native && typeof native.stripComments === "function") {
    nativeStripComments = native.stripComments;
  }
} catch {
  // Native module is optional. JS fallback remains the default path.
}

export const JS_EXTENSIONS: readonly string[] = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
];

export function stripComments(code: string): string {
  if (nativeStripComments) {
    try {
      return nativeStripComments(code);
    } catch {
      // Fall through to JS implementation if native call fails.
    }
  }

  return stripCommentsJs(code);
}

function stripCommentsJs(code: string): string {
  const len = code.length;
  const parts: string[] = [];
  let keepFrom = 0;
  let i = 0;
  let changed = false;
  let prevSig = "";
  let prevWord = "";

  const dropRange = (start: number, end: number) => {
    if (start > keepFrom) {
      parts.push(code.slice(keepFrom, start));
    }
    keepFrom = end;
    changed = true;
  };

  while (i < len) {
    const ch = code.charCodeAt(i);
    const nxt = i + 1 < len ? code.charCodeAt(i + 1) : 0;

    // Strings and template literals.
    if (ch === 34 || ch === 39 || ch === 96) {
      const quote = ch;
      i += 1;
      while (i < len) {
        const c = code.charCodeAt(i);
        if (c === 92) {
          i += 2;
          continue;
        }
        i += 1;
        if (c === quote) {
          break;
        }
      }
      prevSig = quote === 96 ? "`" : "q";
      prevWord = "";
      continue;
    }

    // Identifier/keyword token.
    if (isIdentStart(ch)) {
      const start = i;
      i += 1;
      while (i < len && isIdentContinue(code.charCodeAt(i))) {
        i += 1;
      }
      prevWord = code.slice(start, i);
      prevSig = "w";
      continue;
    }

    // Number token.
    if (isDigit(ch)) {
      i += 1;
      while (i < len) {
        const c = code.charCodeAt(i);
        if (!isDigit(c) && c !== 46 && c !== 95) {
          break;
        }
        i += 1;
      }
      prevSig = "n";
      prevWord = "";
      continue;
    }

    // Comment or regex or division.
    if (ch === 47) {
      if (nxt === 47) {
        const start = i;
        i += 2;
        while (i < len && code.charCodeAt(i) !== 10) {
          i += 1;
        }
        dropRange(start, i);
        prevWord = "";
        continue;
      }

      if (nxt === 42) {
        const start = i;
        i += 2;
        while (i + 1 < len) {
          if (code.charCodeAt(i) === 42 && code.charCodeAt(i + 1) === 47) {
            i += 2;
            break;
          }
          i += 1;
        }
        if (i >= len) {
          i = len;
        }
        dropRange(start, i);
        prevWord = "";
        continue;
      }

      if (isRegexStart(prevSig, prevWord)) {
        i += 1;
        let inClass = false;
        while (i < len) {
          const c = code.charCodeAt(i);
          if (c === 92) {
            i += 2;
            continue;
          }
          if (c === 91) {
            inClass = true;
            i += 1;
            continue;
          }
          if (c === 93) {
            inClass = false;
            i += 1;
            continue;
          }
          if (c === 47 && !inClass) {
            i += 1;
            while (i < len && isIdentContinue(code.charCodeAt(i))) {
              i += 1;
            }
            break;
          }
          i += 1;
        }
        prevSig = "r";
        prevWord = "";
        continue;
      }

      prevSig = "/";
      prevWord = "";
      i += 1;
      continue;
    }

    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }

    prevSig = String.fromCharCode(ch);
    prevWord = "";
    i += 1;
  }

  if (!changed) {
    return code;
  }

  if (keepFrom < len) {
    parts.push(code.slice(keepFrom));
  }

  return parts.join("");
}

function isWhitespace(ch: number): boolean {
  return ch === 9 || ch === 10 || ch === 13 || ch === 32;
}

function isDigit(ch: number): boolean {
  return ch >= 48 && ch <= 57;
}

function isIdentStart(ch: number): boolean {
  return (
    (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 95 || ch === 36
  );
}

function isIdentContinue(ch: number): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

function isRegexStart(prevSig: string, prevWord: string): boolean {
  if (!prevSig) {
    return true;
  }

  if (prevSig === "w") {
    return (
      prevWord === "return" ||
      prevWord === "throw" ||
      prevWord === "case" ||
      prevWord === "delete" ||
      prevWord === "void" ||
      prevWord === "typeof" ||
      prevWord === "yield" ||
      prevWord === "await" ||
      prevWord === "in" ||
      prevWord === "of" ||
      prevWord === "new"
    );
  }

  return (
    prevSig === "(" ||
    prevSig === "{" ||
    prevSig === "[" ||
    prevSig === "," ||
    prevSig === ";" ||
    prevSig === ":" ||
    prevSig === "=" ||
    prevSig === "!" ||
    prevSig === "?" ||
    prevSig === "~" ||
    prevSig === "&" ||
    prevSig === "|" ||
    prevSig === "^" ||
    prevSig === "+" ||
    prevSig === "-" ||
    prevSig === "*" ||
    prevSig === "%" ||
    prevSig === "<" ||
    prevSig === ">"
  );
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
