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

const colorRegex = /([a-zA-Z0-9\-:]+)-(neutral|gray|slate|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(450|455|550|555)(\/\d+)?/g;

let suggestions = [];

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.html') && !filePath.endsWith('.css')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  
  // We need to find all matches on a per-file basis
  let fileReplacements = [];
  
  // Use a fresh regex copy or reset index
  colorRegex.lastIndex = 0;
  while ((match = colorRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const prefix = match[1]; // e.g. text, bg, hover:bg, etc.
    const color = match[2];  // e.g. neutral, indigo
    const shade = match[3];  // e.g. 450, 455, 550, 555
    const opacity = match[4] || ''; // e.g. /10
    
    let newShade = '400';
    if (shade === '450' || shade === '455') {
      newShade = '400';
    } else if (shade === '550' || shade === '555') {
      // If it's a hover background or a direct background without opacity, we can map to 600
      if ((prefix.includes('bg') || prefix.includes('hover:bg')) && !opacity) {
        // Check if there is an existing bg-XXX-600 or hover:bg-XXX-600
        if (prefix.includes('hover')) {
          newShade = '600';
        } else {
          newShade = '500';
        }
      } else {
        newShade = '500';
      }
    }
    
    const replacement = `${prefix}-${color}-${newShade}${opacity}`;
    const lines = content.substring(0, match.index).split('\n');
    const lineNum = lines.length;
    const lineContent = content.split('\n')[lineNum - 1];
    
    fileReplacements.push({
      line: lineNum,
      original: fullMatch,
      replacement: replacement,
      context: lineContent.trim()
    });
  }
  
  if (fileReplacements.length > 0) {
    suggestions.push({
      file: filePath,
      replacements: fileReplacements
    });
  }
});

fs.writeFileSync(
  'c:\\Users\\Ramesh Sahu\\antigravity\\Note-IT-AI\\scratch\\color_replacements.json',
  JSON.stringify(suggestions, null, 2),
  'utf8'
);

console.log(`Saved ${suggestions.reduce((acc, f) => acc + f.replacements.length, 0)} suggestion(s) across ${suggestions.length} file(s).`);
