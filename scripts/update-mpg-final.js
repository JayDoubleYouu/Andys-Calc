const fs = require('fs');

// Read the vehicles file
const filePath = 'lib/vehicles.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Update MPG values:
// - Renault Master: 35 -> 33
// - Ford Transit: 32 -> 23

// Update Renault Master vehicles from 35 to 33
content = content.replace(
  /("make":\s*"Renault",\s*"model":\s*"Master",[^}]*"mpg":\s*)35/g,
  '$133'
);

// Update Ford Transit vehicles from 32 to 23
content = content.replace(
  /("make":\s*"Ford",\s*"model":\s*"Transit",[^}]*"mpg":\s*)32/g,
  '$123'
);

// Update the comment at the top
content = content.replace(
  /\/\/ MPG values: Fiat Ducato=27, MAN TGE=35, Renault Master=35, Ford Transit=32/,
  '// MPG values: Fiat Ducato=27, MAN TGE=35, Renault Master=33, Ford Transit=23'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Updated MPG values:');
console.log('- Renault Master: 35 -> 33');
console.log('- Ford Transit: 32 -> 23');
console.log('- Comment updated');
