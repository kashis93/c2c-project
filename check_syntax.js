const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = [
  ...getAllFiles(path.resolve(__dirname, 'alunet93/src')),
  ...getAllFiles(path.resolve(__dirname, 'backend/src'))
];

let errors = 0;
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties']
    });
  } catch (e) {
    console.error(`Syntax error in ${file}: ${e.message}`);
    errors++;
  }
});

if (errors === 0) {
  console.log('No syntax errors found!');
} else {
  console.log(`Found ${errors} syntax errors.`);
  process.exit(1);
}
