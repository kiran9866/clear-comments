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
