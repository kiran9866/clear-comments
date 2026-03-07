import path from "path";

export function globToRegExp(pattern: string): RegExp {
  let escaped = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === "*") {
      escaped += "__GLOB_STAR__";
      continue;
    }
    escaped += ch.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  }

  escaped = escaped
    .replace(/__GLOB_STAR____GLOB_STAR__/g, ".*")
    .replace(/__GLOB_STAR__/g, "[^/]*");

  return new RegExp(`^${escaped}$`);
}

export function shouldIgnore(
  file: string,
  cwd: string,
  patterns: string[],
): boolean {
  if (!patterns.length) return false;
  const rel = path.relative(cwd, file).replace(/\\/g, "/");
  return patterns.some((p) => {
    const re = globToRegExp(p);
    return re.test(rel);
  });
}
