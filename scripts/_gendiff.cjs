#!/usr/bin/env node
// Scratch script: compares two directory trees of generated proto files.
// Not part of the project; delete after use.
const fs = require('fs');
const path = require('path');

const [, , oldDir, newDir] = process.argv;

function walk(dir) {
  const out = new Set();
  function rec(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) rec(full);
      else out.add(path.relative(dir, full));
    }
  }
  if (fs.existsSync(dir)) rec(dir);
  return out;
}

const oldFiles = walk(oldDir);
const newFiles = walk(newDir);

const added = [...newFiles].filter((f) => !oldFiles.has(f)).sort();
const removed = [...oldFiles].filter((f) => !newFiles.has(f)).sort();
const common = [...newFiles].filter((f) => oldFiles.has(f)).sort();

const changed = [];
for (const f of common) {
  const a = fs.readFileSync(path.join(oldDir, f), 'utf8');
  const b = fs.readFileSync(path.join(newDir, f), 'utf8');
  if (a !== b) changed.push(f);
}

console.log('=== ADDED FILES ===');
console.log(added.join('\n'));
console.log('=== REMOVED FILES ===');
console.log(removed.join('\n'));
console.log('=== CHANGED FILES ===');
console.log(changed.join('\n'));
