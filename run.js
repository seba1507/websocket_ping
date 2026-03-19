const { execSync } = require('child_process');
const phaseOut = execSync('node "C:\\Users\\seba\\.gemini\\antigravity\\get-shit-done\\bin\\gsd-tools.cjs" roadmap get-phase "1"');
require('fs').writeFileSync('phase_info3.json', phaseOut);
