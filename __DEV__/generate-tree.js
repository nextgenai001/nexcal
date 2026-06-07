const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, 'project-tree.txt');

// Directories to ignore completely
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'out',
  'build',
  '.agents',
  '__DEV__'
]);

// Specific files to ignore
const IGNORE_FILES = new Set([
  'package-lock.json',
  'tsconfig.tsbuildinfo',
  '.env',
  '.env.production'
]);

function generateTreeString(dir, prefix = '') {
  let result = '';
  const items = fs.readdirSync(dir)
    .filter(item => {
      if (IGNORE_DIRS.has(item) || IGNORE_FILES.has(item)) return false;
      return true;
    })
    .sort((a, b) => {
      // Directories first, then files
      const aPath = path.join(dir, a);
      const bPath = path.join(dir, b);
      const aIsDir = fs.statSync(aPath).isDirectory();
      const bIsDir = fs.statSync(bPath).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();
    const isLast = index === items.length - 1;
    const marker = isLast ? '└── ' : '├── ';

    result += `${prefix}${marker}${item}\n`;

    if (isDir) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      result += generateTreeString(fullPath, nextPrefix);
    }
  });

  return result;
}

function writeTreeToFile() {
  const treeContent = generateTreeString(ROOT_DIR);
  fs.writeFileSync(OUTPUT_FILE, treeContent, 'utf8');
  console.log(`Successfully saved project tree to ${OUTPUT_FILE}`);
}

writeTreeToFile();
