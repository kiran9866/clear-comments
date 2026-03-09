#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import {
  stripComments,
  findFiles,
  writeFileIfChanged,
  JS_EXTENSIONS,
} from "./index";
import { shouldIgnore } from "./ignore";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

interface CLIOptions {
  dir: string;
  all: boolean;
  indices: number[];
  dryRun: boolean;
  ignore: string[];
  help?: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2);
  const opts: CLIOptions = {
    dir: "src",
    all: false,
    indices: [],
    dryRun: false,
    ignore: [],
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      return opts;
    }
    if (arg === "--dir" || arg === "-d") {
      opts.dir = args[i + 1] || opts.dir;
      i += 1;
      continue;
    }
    if (arg === "--all") {
      opts.all = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--ignore") {
      const value = args[i + 1] || "";
      opts.ignore = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (/^\d+$/.test(arg)) {
      opts.indices.push(parseInt(arg, 10) - 1);
      continue;
    }
  }

  return opts;
}

function showHelp() {
  console.log(`Usage: remove-code-comments [options]

Options:
  --dir, -d <folder>      Folder to scan (default: src)
  --all                   Process all matching files automatically
  --dry-run               Don't write changes; just show what would change
  --ignore <pattern,...>  Comma-separated ignore patterns (supports * wildcard)
  --help, -h              Show this help message

Examples:
  remove-code-comments --dir src --all
  remove-code-comments --dir src --ignore "**/node_modules/**,**/*.test.ts"
  remove-code-comments --all 1 2 3
`);
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    showHelp();
    return;
  }

  const folder = opts.dir;
  const absolute = path.resolve(process.cwd(), folder);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    console.error(`Folder not found: ${absolute}`);
    process.exit(1);
  }

  let files = findFiles(absolute, JS_EXTENSIONS).filter(
    (f) => !shouldIgnore(f, process.cwd(), opts.ignore),
  );
  if (!files.length) {
    console.log("No JS/TS files found under that folder.");
    return;
  }

  if (!opts.all && !opts.indices.length) {
    console.log(`Found ${files.length} files:`);
    files.forEach((file, idx) =>
      console.log(`  ${idx + 1}. ${path.relative(process.cwd(), file)}`),
    );

    const selection = (
      await prompt(
        "Enter comma-separated indices to strip comments (or 'all'): ",
      )
    ).trim();
    if (selection.toLowerCase() === "all") {
      opts.all = true;
    } else {
      opts.indices = selection
        .split(/[\s,]+/)
        .map((v) => parseInt(v, 10) - 1)
        .filter((i) => Number.isInteger(i) && i >= 0 && i < files.length);
    }
  }

  const targets = opts.all
    ? files
    : opts.indices.map((i) => files[i]).filter(Boolean);

  if (!targets.length) {
    console.log("No files selected. Exiting.");
    return;
  }

  let changed = 0;
  for (const file of targets) {
    const input = fs.readFileSync(file, "utf8");
    const stripped = stripComments(input);
    if (input !== stripped) {
      changed += 1;
      if (!opts.dryRun) {
        writeFileIfChanged(file, stripped);
      }
    }
  }

  console.log(
    `Stripped comments from ${changed} file(s).${opts.dryRun ? " (dry run)" : ""}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
