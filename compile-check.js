const { execSync } = require('child_process');
const path = require('path');
const tscPath = path.join(__dirname, 'node_modules', 'typescript', 'lib', 'tsc.js');
try {
  execSync(`node "${tscPath}" --noEmit --project apps/api/tsconfig.app.json`, { cwd: __dirname, stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
