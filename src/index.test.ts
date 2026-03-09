import { describe, expect, it } from "vitest";
import { stripComments } from "./index";
import { globToRegExp, shouldIgnore } from "./ignore";

describe("stripComments", () => {
  it("removes line comments", () => {
    const code = "const a = 1; // comment\nconst b = 2;";
    expect(stripComments(code)).toBe("const a = 1; \nconst b = 2;");
  });

  it("removes block comments", () => {
    const code = "const a = 1; /* comment */ const b = 2;";
    expect(stripComments(code)).toBe("const a = 1;  const b = 2;");
  });

  it("keeps comments inside strings", () => {
    const code = 'const s = "// not a comment";';
    expect(stripComments(code)).toBe(code);
  });

  it("keeps regex literals intact while removing trailing comments", () => {
    const code =
      "const re = /https?:\\/\\/example\\.com\\/path/; // trailing\n";
    expect(stripComments(code)).toBe(
      "const re = /https?:\\/\\/example\\.com\\/path/; \n",
    );
  });

  it("keeps template literal content that looks like comments", () => {
    const code = "const t = `url // still text`; /* drop */ const n = 1;";
    expect(stripComments(code)).toBe(
      "const t = `url // still text`;  const n = 1;",
    );
  });

  it("falls back for malformed input and still strips obvious comments", () => {
    const code = 'const x = 1; // remove\nconst y = "unterminated';
    expect(stripComments(code)).toBe('const x = 1; \nconst y = "unterminated');
  });
});

describe("ignore patterns", () => {
  it("matches simple glob patterns", () => {
    const re = globToRegExp("**/ui/**");
    expect(re.test("src/components/ui/button.tsx")).toBe(true);
  });

  it("respects ignore lists", () => {
    expect(
      shouldIgnore("src/components/ui/button.tsx", process.cwd(), ["**/ui/**"]),
    ).toBe(true);
  });
});
