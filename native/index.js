const fs = require("fs");
const path = require("path");

const candidates = [
  "index.node",
  "remove_code_comments_native.node",
  "remove-code-comments-native.node",
];

let lastErr;
for (const file of candidates) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) {
    continue;
  }

  try {
    module.exports = require(full);
    return;
  } catch (err) {
    lastErr = err;
  }
}

if (lastErr) {
  throw lastErr;
}

throw new Error(
  "Native binding not found. Run `npm run build:native` to compile native module.",
);
