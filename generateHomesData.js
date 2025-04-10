// generateHomesData.js
const fs = require('fs');
const path = require('path');

const jsonDir = path.join(__dirname, 'src/data/json');
const outputFile = path.join(__dirname, 'src/data/homesData.js');

// Read all JSON files and build homes array
const homes = [];
for (let i = 1; i <= 100; i++) {
  const filePath = path.join(jsonDir, `${i}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    homes.push({
      ...data,
      image: `home${i}`, // Reference to imported image
      price: data.attributes[0].value.toString(), // Purchase Price as string
      isListed: Math.random() > 0.5, // Random for now; adjust later if needed
    });
  } catch (error) {
    console.error(`Error reading ${i}.json:`, error);
  }
}

// Generate import statements for images
const imports = Array.from(
  { length: 100 },
  (_, i) => `import home${i + 1} from '../assets/homes/${i + 1}.png';`
).join('\n');

// Generate the file content
const fileContent = `${imports}\n\nexport const homesData = ${JSON.stringify(homes, null, 2).replace(/"home(\d+)"/g, 'home$1')};`;

// Write to file
fs.writeFileSync(outputFile, fileContent, 'utf8');
console.log('homesData.js generated successfully!');
