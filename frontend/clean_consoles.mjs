import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

walk('./src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content.replace(/console\.(log|error|warn)\(.*?(\);?|\n)/g, '');
    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log(`Cleaned ${filepath}`);
    }
  }
});
