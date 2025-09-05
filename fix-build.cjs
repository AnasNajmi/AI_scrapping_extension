const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');

// Find the CSS file name (it has a hash)
const assetsDir = path.join(distPath, 'assets');
const cssFile = fs.readdirSync(assetsDir).find(file => file.endsWith('.css'));
const jsFile = fs.readdirSync(assetsDir).find(file => file.startsWith('index-') && file.endsWith('.js'));

console.log('Found CSS file:', cssFile);
console.log('Found JS file:', jsFile);

// Fix index.html
const indexPath = path.join(distPath, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace script src
indexContent = indexContent.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  `<script type="module" src="./popup.js"></script>`
);

// Add CSS link if not present
if (!indexContent.includes('.css')) {
  indexContent = indexContent.replace(
    '<link rel="icon" type="image/svg+xml" href="vite.svg" />',
    `<link rel="icon" type="image/svg+xml" href="vite.svg" />
    <link rel="stylesheet" href="./assets/${cssFile}" />`
  );
}

fs.writeFileSync(indexPath, indexContent);

// Fix sidepanel.html
const sidepanelPath = path.join(distPath, 'sidepanel.html');
let sidepanelContent = fs.readFileSync(sidepanelPath, 'utf8');

// Replace script src
sidepanelContent = sidepanelContent.replace(
  '<script type="module" src="../src/sidepanel/sidepanel.tsx"></script>',
  `<script type="module" src="./sidepanel.js"></script>`
);

// Add CSS link if not present
if (!sidepanelContent.includes('.css')) {
  sidepanelContent = sidepanelContent.replace(
    '<title>Agentic AI Web Scraper - Side Panel</title>',
    `<title>Agentic AI Web Scraper - Side Panel</title>
    <link rel="stylesheet" href="./assets/${cssFile}" />`
  );
}

fs.writeFileSync(sidepanelPath, sidepanelContent);

console.log('✅ Post-build fixes applied successfully!');
console.log('📁 Files fixed: index.html, sidepanel.html');
