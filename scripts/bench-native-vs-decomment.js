const fs = require("fs");
const path = require("path");
const pkg = require("../dist/index.js");
const native = require("../native");
const decomment = require("decomment");

function walk(dir, exts, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(ent.name))) out.push(full);
  }
  return out;
}

const srcFiles = walk(path.join(process.cwd(), "src"), [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);
const corpus = srcFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n\n");

const samples = [
  {
    name: "small",
    code: 'const a = 1; // a\\nconst re = /https?:\\\\/\\\\/x/; /* b */ const s = "//str";\\n',
  },
  {
    name: "medium",
    code: Array(400)
      .fill(
        "function x(){/*blk*/ const a='//x'; return /foo\\\\/\\\\/bar/.test('x'); //line\\n}",
      )
      .join(""),
  },
  { name: "project-corpus", code: corpus },
];

function bench(fn, code, loops) {
  for (let i = 0; i < 20; i += 1) fn(code);
  const t0 = process.hrtime.bigint();
  let out = "";
  for (let i = 0; i < loops; i += 1) out = fn(code);
  const t1 = process.hrtime.bigint();
  return { ms: Number(t1 - t0) / 1e6, out };
}

for (const s of samples) {
  const loops = s.code.length < 5000 ? 4000 : s.code.length < 500000 ? 400 : 60;
  const nativeRes = bench(
    (input) => native.stripComments(input),
    s.code,
    loops,
  );
  const pkgRes = bench((input) => pkg.stripComments(input), s.code, loops);
  const decRes = bench((input) => decomment.text(input), s.code, loops);

  console.log(`\n[${s.name}] size=${s.code.length} chars, loops=${loops}`);
  console.log(
    `native:                  ${nativeRes.ms.toFixed(2)} ms (${(nativeRes.ms / loops).toFixed(4)} ms/op)`,
  );
  console.log(
    `package(stripComments):  ${pkgRes.ms.toFixed(2)} ms (${(pkgRes.ms / loops).toFixed(4)} ms/op)`,
  );
  console.log(
    `decomment:               ${decRes.ms.toFixed(2)} ms (${(decRes.ms / loops).toFixed(4)} ms/op)`,
  );

  console.log(`native output == decomment: ${nativeRes.out === decRes.out}`);
  console.log(`package output == decomment: ${pkgRes.out === decRes.out}`);
}
