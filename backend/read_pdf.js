const fs = require('fs');
const pdf = require('pdf-parse');

const files = [
  'C:/Users/YASHWANTH D/.gemini/antigravity-ide/brain/dfdbb1dd-da91-40a9-9e59-b33c3de14cd2/media__1786451201073.pdf',
  'C:/Users/YASHWANTH D/.gemini/antigravity-ide/brain/dfdbb1dd-da91-40a9-9e59-b33c3de14cd2/media__1786451201094.pdf',
  'C:/Users/YASHWANTH D/.gemini/antigravity-ide/brain/dfdbb1dd-da91-40a9-9e59-b33c3de14cd2/media__1786451517767.pdf'
];

async function parseAll() {
  for (const file of files) {
    if (fs.existsSync(file)) {
      const dataBuffer = fs.readFileSync(file);
      const data = await pdf(dataBuffer);
      console.log(`\n\n--- FILE: ${file} ---`);
      
      const lines = data.text.split('\n');
      for(let i=0; i<lines.length; i++) {
         if (lines[i].toLowerCase().includes('dashboard') || lines[i].toLowerCase().includes('summary')) {
             console.log(`Match at line ${i}:`);
             console.log(lines.slice(Math.max(0, i-2), i+3).join('\n'));
             console.log('---');
         }
      }
    }
  }
}
parseAll();
