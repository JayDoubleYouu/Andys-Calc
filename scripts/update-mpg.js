const fs = require('fs');

// Read the vehicles file
const filePath = 'lib/vehicles.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Update MPG values:
// - MAN TGE: 40 -> 35
// - Fiat Ducato: 30 -> 27

// Update TGE vehicles from 40 to 35
content = content.replace(
  /("make":\s*"MAN",\s*"model":\s*"TGE",[^}]*"mpg":\s*)40/g,
  '$135'
);

// Update Ducato vehicles from 30 to 27
content = content.replace(
  /("make":\s*"Fiat",\s*"model":\s*"Ducato",[^}]*"mpg":\s*)30/g,
  '$127'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Updated MPG values:');
console.log('- MAN TGE: 40 -> 35');
console.log('- Fiat Ducato: 30 -> 27');
