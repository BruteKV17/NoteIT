const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\Ramesh Sahu\\antigravity\\Note-IT-AI\\src';

const colors = [
  'neutral', 'gray', 'slate', 'zinc', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose'
];

const colorRegex = new RegExp(`([a-zA-Z0-9\\-:]+)-(${colors.join('|')})-(\\d+)(\\/\\d+)?`, 'g');

const standardShades = new Set(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']);

function fixColorShade(match, prefix, color, shade, opacity) {
  opacity = opacity || '';
  let newShade;
  switch (shade) {
    case '505':
      newShade = '500';
      break;
    case '150':
      newShade = '200';
      break;
    case '305':
      newShade = '300';
      break;
    case '350':
      newShade = '300';
      break;
    case '450':
    case '455':
      newShade = '400';
      break;
    case '550':
    case '555':
      if (prefix.includes('bg') && !opacity) {
        if (prefix.includes('hover')) {
          if (color === 'indigo') {
            newShade = '700';
          } else {
            newShade = '600';
          }
        } else {
          newShade = '600';
        }
      } else {
        newShade = '500';
      }
      break;
    case '650':
    case '655':
      newShade = '600';
      break;
    case '750':
    case '755':
      newShade = '700';
      break;
    case '850':
      newShade = '800';
      break;
    case '955':
      newShade = '950';
      break;
    default:
      return match;
  }
  return `${prefix}-${color}-${newShade}${opacity}`;
}

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

let dryRunLog = [];

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.html') && !filePath.endsWith('.css')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fileChanges = [];

  lines.forEach((line, idx) => {
    let replacedLine = line;
    let lineMatches = [];
    
    // We run the regex check on each line
    let match;
    colorRegex.lastIndex = 0;
    while ((match = colorRegex.exec(line)) !== null) {
      const fullMatch = match[0];
      const prefix = match[1];
      const color = match[2];
      const shade = match[3];
      const opacity = match[4];
      
      if (!standardShades.has(shade)) {
        const replacement = fixColorShade(fullMatch, prefix, color, shade, opacity);
        lineMatches.push({ original: fullMatch, replacement });
      }
    }
    
    if (lineMatches.length > 0) {
      // Apply replacements to the line
      lineMatches.forEach(lm => {
        replacedLine = replacedLine.replace(lm.original, lm.replacement);
      });
      fileChanges.push({
        lineNum: idx + 1,
        originalLine: line.trim(),
        replacedLine: replacedLine.trim(),
        replacements: lineMatches
      });
    }
  });

  if (fileChanges.length > 0) {
    dryRunLog.push({ file: filePath, changes: fileChanges });
  }
});

fs.writeFileSync(
  'c:\\Users\\Ramesh Sahu\\antigravity\\Note-IT-AI\\scratch\\dry_run_results.json',
  JSON.stringify(dryRunLog, null, 2),
  'utf8'
);

console.log(`Dry run complete. Logged changes for ${dryRunLog.length} files to dry_run_results.json`);
dryRunLog.forEach(f => {
  console.log(`\nFile: ${f.file}`);
  f.changes.forEach(c => {
    console.log(`  Line ${c.lineNum}:`);
    console.log(`    - ${c.originalLine}`);
    console.log(`    + ${c.replacedLine}`);
  });
});
