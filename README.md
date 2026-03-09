# remove-code-comments

A lightweight tool to remove comments from JavaScript/TypeScript files while preserving strings, regex literals, and template literals. Works as both a CLI and a programmatic library.

## Features

✨ **Smart Comment Removal**
- Removes `//` line comments and `/* */` block comments
- Preserves comments inside strings, template literals, and regex patterns
- Handles edge cases like regex literals after `return`, `throw`, etc.
- Optional Rust native binding for performance (with automatic JS fallback)

## Install

```bash
npm install -g remove-code-comments
```

Or use via npx:

```bash
npx remove-code-comments --help
```

For programmatic usage:

```bash
npm install remove-code-comments
```

## CLI Usage

### Interactive Mode

```bash
remove-code-comments --dir src
```

This will scan the directory and let you select which files to process:

```
Found 4 files (2 with comments):

  ✓ 1. src/index.ts (272 chars)
  ○ 2. src/utils.ts
  ✓ 3. src/api.ts (145 chars)
  ○ 4. src/types.ts

Enter comma-separated indices to strip comments (or 'all'): 1,3
```

### Automatic Mode

Process all files automatically:

```bash
remove-code-comments --dir src --all
```

### Dry Run

Preview changes without modifying files:

```bash
remove-code-comments --dir src --all --dry-run
```

### Ignore Patterns

Skip specific files or directories:

```bash
remove-code-comments --dir src --all --ignore "**/*.test.ts,**/vendor/**"
```

### Options

- `--dir, -d <folder>`: Target directory (default: `src`)
- `--all`: Process all matching files automatically (no interactive prompt)
- `--dry-run`: Show what would change without writing files
- `--ignore <pattern,...>`: Comma-separated ignore patterns (supports `*` and `**`)

## Programmatic API

Use `remove-code-comments` as a library in your Node.js projects:

```javascript
const { stripComments } = require('remove-code-comments');

const code = `
  // This is a line comment
  const x = 5; /* block comment */
  const regex = /https?:\\/\\//; // URL regex
  const str = "// not a comment";
`;

const clean = stripComments(code);
console.log(clean);
```

**Output:**

```javascript

  
  const x = 5; 
  const regex = /https?:\\/\\//; 
  const str = "// not a comment";
```

### API Reference

#### `stripComments(code: string): string`

Removes all comments from the provided code string.

**Parameters:**
- `code` (string): JavaScript or TypeScript source code

**Returns:**
- (string): Code with comments removed

**Example:**

```javascript
const { stripComments } = require('remove-code-comments');

const result = stripComments('const x = 5; // comment');
// result: 'const x = 5; '
```

## Examples

### Example 1: Basic Comments

**Input:**

```javascript
// Single line comment
const greeting = "Hello"; /* inline block comment */

/*
 * Multi-line
 * block comment
 */
function sayHi() {
  return greeting; // return value
}
```

**Output:**

```javascript

const greeting = "Hello"; 

function sayHi() {
  return greeting; 
}
```

### Example 2: Preserving Strings and Regex

**Input:**

```javascript
const url = "https://example.com"; // URL string
const pattern = /\/\* not a comment \*\//; // regex literal
const msg = 'Use // for comments'; /* explanation */
```

**Output:**

```javascript
const url = "https://example.com"; 
const pattern = /\/\* not a comment \*\//; 
const msg = 'Use // for comments'; 
```

### Example 3: Template Literals

**Input:**

```javascript
const code = `
  // This looks like a comment
  /* but it's inside a template */
`;
const value = 42; // actual comment
```

**Output:**

```javascript
const code = `
  // This looks like a comment
  /* but it's inside a template */
`;
const value = 42; 
```

### Example 4: Complex Regex Context

**Input:**

```javascript
function test() {
  return /regex/gi; // regex after return
  throw /pattern/; // regex after throw
  const result = condition ? /yes/ : /no/; // ternary
  const arr = [/first/, /second/]; // array literal
}
```

**Output:**

```javascript
function test() {
  return /regex/gi; 
  throw /pattern/; 
  const result = condition ? /yes/ : /no/; 
  const arr = [/first/, /second/]; 
}
```

## Development

```bash
npm install
npm test
npm run build
```

### Build Native Module (Optional)

```bash
npm run build:native
```

Requires Rust toolchain (`cargo`) to be installed.

## License

MIT
