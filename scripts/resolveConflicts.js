const fs = require('fs').promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const skipDirs = ['node_modules', '.git'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skipDirs.includes(e.name)) continue;
      files.push(...await walk(full));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function resolveConflict(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let i = 0;
  let changed = false;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('<<<<<<<')) {
      changed = true;
      // skip until =======
      i++;
      while (i < lines.length && !lines[i].startsWith('=======')) i++;
      // skip '======='
      i++;
      // collect incoming until >>>>>>>
      while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
        out.push(lines[i]);
        i++;
      }
      // skip >>>>>>>
      while (i < lines.length && lines[i].startsWith('>>>>>>>')) i++;
    } else {
      out.push(line);
      i++;
    }
  }
  return { text: out.join('\n'), changed };
}

(async () => {
  try {
    const files = await walk(root);
    let processed = 0;
    for (const file of files) {
      // skip binary-ish and large files by extension
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.wasm', '.exe', '.dll', '.bin', '.zip'].includes(ext)) continue;
      if (file.endsWith('.orig')) continue;
      const content = await fs.readFile(file, 'utf8');
      if (content.indexOf('<<<<<<<') === -1) continue;
      const backup = file + '.orig';
      await fs.copyFile(file, backup);
      const { text, changed } = resolveConflict(content);
      if (changed) {
        await fs.writeFile(file, text, 'utf8');
        console.log('Resolved:', path.relative(root, file));
        processed++;
      }
    }
    console.log('Done. Files processed:', processed);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(2);
  }
})();
