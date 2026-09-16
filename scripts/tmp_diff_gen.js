const { execSync } = require('child_process');
const path = require('path');

const oldDir = '/tmp/gen_old';
const newDir = path.join(__dirname, '..', 'src', 'gen');

try {
  const out = execSync(`diff -rq "${oldDir}" "${newDir}"`, { maxBuffer: 1024 * 1024 * 50 });
  console.log(out.toString());
} catch (e) {
  console.log(e.stdout ? e.stdout.toString() : e.message);
}
