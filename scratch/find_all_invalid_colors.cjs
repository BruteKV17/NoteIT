const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\Ramesh Sahu\\antigravity\\Note-IT-AI\\src';

const standardShades = new Set(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);
const colorsList = [
  'neutral', 'gray', 'slate', 'zinc', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
];
const colorPattern = new RegExp(`-(${colorsList.join('|')})-(\\d+)(?:\\/\\d+)?`, 'g');

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

console.log('Scanning for all non-standard Tailwind colors...');

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.html') && !filePath.endsWith('.css')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  let matches = [];
  
  colorPattern.lastIndex = 0;
  while ((match = colorPattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const color = match[1];
    const shade = match[2];
    
    if (!standardShades.has(shade)) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNum = lines.length;
      matches.push({
        line: lineNum,
        colorClass: fullMatch,
        color,
        shade,
        context: content.split('\n')[lineNum - 1].trim()
      });
    }
  }
  
  if (matches.length > 0) {
    console.log(`\nFile: ${filePath}`);
    matches.forEach(m => {
      console.log(`  Line ${m.line}: "${m.colorClass}" -> color: ${m.color}, shade: ${m.shade} in: ${m.context}`);
    });
  }
});
