const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\Ramesh Sahu\\antigravity\\Note-IT-AI\\src';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const colorRegex = /(bg|text|border|hover|focus|active|from|via|to|shadow|placeholder|selection|stroke|fill)-(neutral|gray|slate|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(450|455|550|555)(?:\/\d+)?/g;

console.log('Scanning files for invalid colors...');

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.html') && !filePath.endsWith('.css')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  let matches = [];
  while ((match = colorRegex.exec(content)) !== null) {
    // Get line number
    const lines = content.substring(0, match.index).split('\n');
    const lineNum = lines.length;
    matches.push({
      line: lineNum,
      match: match[0],
      fullLine: content.split('\n')[lineNum - 1].trim()
    });
  }
  if (matches.length > 0) {
    console.log(`\nFile: ${filePath}`);
    matches.forEach(m => {
      console.log(`  Line ${m.line}: "${m.match}" in: ${m.fullLine}`);
    });
  }
});
