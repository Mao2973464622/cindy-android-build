// CI 辅助：校验 out/*.apk —— 必须内置 JS bundle（否则离线打不开），并打印元数据
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const outDir = path.join(__dirname, '..', 'out');
const files = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((f) => f.endsWith('.apk')) : [];

if (!files.length) {
  console.error('::error::没有产出任何 APK');
  process.exit(1);
}
if (files.length > 1) console.warn(`::warning::发现 ${files.length} 个 APK: ${files.join(', ')}`);

// 用 Python 读 zip 条目（APK 即 zip），避免依赖 unzip/aapt2
const py = `
import sys, zipfile, json
res = {}
for p in sys.argv[1:]:
    z = zipfile.ZipFile(p)
    n = z.namelist()
    res[p] = {
        'entries': len(n),
        'bundle': [x for x in n if 'index.android.bundle' in x],
        'fingerprint': [x for x in n if x.endswith('fingerprint')],
        'abis': sorted({x.split('/')[1] for x in n if x.startswith('lib/') and len(x.split('/'))>2}),
        'dex': len([x for x in n if x.endswith('.dex')]),
        'size': __import__('os').path.getsize(p),
    }
print(json.dumps(res))
`;
const apkPaths = files.map((f) => path.join(outDir, f));
const info = JSON.parse(execFileSync('python3', ['-c', py, ...apkPaths], { encoding: 'utf8' }));

let failed = false;
for (const [p, m] of Object.entries(info)) {
  const name = path.basename(p);
  console.log(`\n### ${name} (${(m.size / 1048576).toFixed(1)} MB)`);
  console.log(`- entries=${m.entries}, dex=${m.dex}, ABIs=${m.abis.join('+') || 'none'}`);
  console.log(`- fingerprint 条目: ${m.fingerprint.join(', ') || '缺失'}`);
  if (!m.bundle.length) {
    console.error(`::error::${name} 内没有 JS bundle —— 这种包离线打不开，拒绝发布`);
    failed = true;
  } else {
    console.log(`- JS bundle: ${m.bundle.join(', ')}`);
  }
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    fs.appendFileSync(
      summary,
      `| ${name} | ${(m.size / 1048576).toFixed(1)} MB | ${m.abis.join('+')} | ${m.bundle.length ? '内置 bundle ✅' : '无 bundle ❌'} |\n`,
    );
  }
}

// 把校验到的实际文件名写回 env，供后续发布步骤使用
if (!failed) {
  fs.appendFileSync(process.env.GITHUB_ENV, `APK_FILE=${path.join(outDir, files[0])}\n`);
  console.log(`\nAPK 校验通过: ${files[0]}`);
}
process.exit(failed ? 1 : 0);