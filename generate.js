const fs = require('fs');
const { fetchAllData } = require('./src/api');
const { generateSvg, generateStatsSvg } = require('./src/svg/generator');

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: node generate.js <leetcode-username>');
    process.exit(1);
  }

  console.log(`\n🔍 Fetching LeetCode data for: ${username}...`);
  try {
    const data = await fetchAllData(username, null);
    
    console.log('🎨 Rendering SVGs...');
    const gridSvg = generateSvg(data);
    const statsSvg = generateStatsSvg(data);

    const gridFilename = `${username}-grid.svg`;
    const statsFilename = `${username}-stats.svg`;

    fs.writeFileSync(gridFilename, gridSvg, 'utf8');
    console.log(`✅ Saved compact grid to: ${gridFilename} (${gridSvg.length} bytes)`);

    fs.writeFileSync(statsFilename, statsSvg, 'utf8');
    console.log(`✅ Saved stats card to:  ${statsFilename} (${statsSvg.length} bytes)`);

    console.log('\n🎉 Generation completed successfully!\n');
  } catch (err) {
    console.error(`❌ Error generating SVGs: ${err.message}`);
    process.exit(1);
  }
}

main();
