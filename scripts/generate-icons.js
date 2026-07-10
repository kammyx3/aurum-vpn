const sharp = require("sharp");
const toIco = require("to-ico");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "..", "public", "icons", "icon.svg");
const iconDir = path.join(__dirname, "..", "public", "icons");
const pngPath = path.join(iconDir, "icon.png");
const icoPath = path.join(iconDir, "icon.ico");

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    pngBuffers.push(buf);
  }

  fs.writeFileSync(pngPath, await sharp(svgBuffer).resize(256, 256).png().toBuffer());

  const icoBuffer = await toIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);

  console.log(`Generated icon.png (${fs.statSync(pngPath).size} bytes) and icon.ico (${fs.statSync(icoPath).size} bytes)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
