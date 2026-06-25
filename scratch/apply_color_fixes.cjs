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
    case '55':
      newShade = '50';
      break;
    case '150':
      newShade = '200';
      break;
    case '250':
      if (color === 'emerald') newShade = '300';
      else newShade = '200';
      break;
    case '305':
      newShade = '300';
      break;
    case '350':
      newShade = '300';
      break;
    case '405':
      newShade = '400';
      break;
    case '450':
    case '455':
      newShade = '400';
      break;
    case '505':
      newShade = '500';
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
    case '605':
      newShade = '600';
      break;
    case '650':
    case '655':
      newShade = '600';
      break;
    case '705':
      newShade = '700';
      break;
    case '750':
    case '755':
      newShade = '700';
      break;
    case '805':
      newShade = '800';
      break;
    case '850':
    case '855':
      newShade = '800';
      break;
    case '905':
      newShade = '900';
      break;
    case '955':
      newShade = '950';
      break;
    default:
      // Fallback: parse as integer and find closest standard shade
      const num = parseInt(shade, 10);
      if (!isNaN(num)) {
        const standardArr = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        let closest = standardArr[0];
        let minDiff = Math.abs(num - closest);
        for (let i = 1; i < standardArr.length; i++) {
          const diff = Math.abs(num - standardArr[i]);
          if (diff < minDiff) {
            minDiff = diff;
            closest = standardArr[i];
          }
        }
        newShade = String(closest);
      } else {
        return match;
      }
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

console.log('Applying improved color fixes...');

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.html') && !filePath.endsWith('.css')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Perform general regex replacements line by line
  const lines = content.split('\n');
  const modifiedLines = lines.map((line) => {
    let replacedLine = line;
    let lineMatches = [];
    
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
      lineMatches.forEach(lm => {
        replacedLine = replacedLine.replace(lm.original, lm.replacement);
      });
    }
    return replacedLine;
  });

  const finalContent = modifiedLines.join('\n');
  if (finalContent !== originalContent) {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
});

console.log('Improved color fixes completed.');
