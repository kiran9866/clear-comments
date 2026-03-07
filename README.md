# clear-comments

A small CLI tool to remove comments from JavaScript/TypeScript files.

## Install

```bash
npm install -g clear-comments
```

(or use via npx)

```bash
npx clear-comments --help
```

## Usage

```bash
clear-comments --dir src --all
```

### Options

- `--dir, -d <folder>`: target directory (default `src`)
- `--all`: process all matching files automatically
- `--dry-run`: show what would change without writing files
- `--ignore <pattern,...>`: ignore patterns (supports `*` and `**`)

## Development

```bash
npm install
npm test
npm run build
```

## Publish

This project is configured to publish from GitHub Actions when a new Git tag is created.

Make sure `NPM_TOKEN` is configured in the repository secrets.
