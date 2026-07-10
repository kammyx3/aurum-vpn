const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const REPO = "kammyx3/aurum-vpn";
const DIST = path.join(__dirname, "..", "dist-electron");

if (!GH_TOKEN) {
  console.error("GH_TOKEN not set");
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: path.join(__dirname, ".."), stdio: "inherit", ...opts });
}

// 1. Build Next.js app (needed for Vercel deploy)
console.log("\n=== Building Next.js app ===");
run("npx next build");

// 2. Get version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
const version = pkg.version;
const tag = `v${version}`;

// 3. Build Electron app
console.log("\n=== Building Electron app ===");
run("npx electron-builder --win --publish never");

// 4. Compute hashes and sizes
function computeSha512(filePath) {
  const crypto = require("crypto");
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha512").update(data).digest("base64");
}

const setupName = `AURUM VPN Setup ${version}.exe`;
const portableName = `AURUM VPN ${version}.exe`;
const blockmapName = `AURUM VPN Setup ${version}.exe.blockmap`;

const setupPath = path.join(DIST, setupName);
const portablePath = path.join(DIST, portableName);

if (!fs.existsSync(setupPath)) {
  console.error(`Setup file not found: ${setupPath}`);
  process.exit(1);
}

const setupSha512 = computeSha512(setupPath);
const setupSize = fs.statSync(setupPath).size;
const portableSha512 = fs.existsSync(portablePath) ? computeSha512(portablePath) : null;
const portableSize = fs.existsSync(portablePath) ? fs.statSync(portablePath).size : 0;

// Copy files with hyphenated names for GitHub
const ghSetupName = `AURUM-VPN-Setup-${version}.exe`;
const ghPortableName = `AURUM-VPN-${version}.exe`;
const ghBlockmapName = `AURUM-VPN-Setup-${version}.exe.blockmap`;

fs.copyFileSync(setupPath, path.join(DIST, ghSetupName));
if (fs.existsSync(portablePath)) {
  fs.copyFileSync(portablePath, path.join(DIST, ghPortableName));
}
fs.copyFileSync(path.join(DIST, blockmapName), path.join(DIST, ghBlockmapName));

// 5. Create GitHub release and upload files
console.log("\n=== Creating GitHub release ===");
run(`gh release create ${tag} --repo ${REPO} --title "${version}" --generate-notes`, {
  env: { ...process.env, GH_TOKEN },
});

console.log("\n=== Uploading files to GitHub ===");
run(
  `gh release upload ${tag} --repo ${REPO} "${path.join(DIST, ghSetupName)}" "${path.join(DIST, ghPortableName)}" "${path.join(DIST, ghBlockmapName)}" "${path.join(DIST, "latest.yml")}" --clobber`,
  { env: { ...process.env, GH_TOKEN } }
);

const downloadUrl = `https://github.com/${REPO}/releases/download/${tag}/${ghSetupName}`;
const portableUrl = `https://github.com/${REPO}/releases/download/${tag}/${ghPortableName}`;

// 6. Register release in database
console.log("\n=== Registering release in database ===");
const registerScript = `
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.updateRelease.create({
    data: {
      version: "${version}",
      fileUrl: "${downloadUrl}",
      fileSha512: "${setupSha512}",
      fileSize: BigInt(${setupSize}),
      portableUrl: "${portableUrl}",
      notes: "",
      releaseDate: new Date(),
    },
  });
  console.log("Release registered:", "${version}");
  await prisma.\$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
`;
fs.writeFileSync(path.join(DIST, "_register.js"), registerScript);
run(`npx tsx "${path.join(DIST, "_register.js")}"`);
fs.unlinkSync(path.join(DIST, "_register.js"));

// 7. Cleanup copied files
fs.unlinkSync(path.join(DIST, ghSetupName));
fs.unlinkSync(path.join(DIST, ghBlockmapName));
if (fs.existsSync(path.join(DIST, ghPortableName))) {
  fs.unlinkSync(path.join(DIST, ghPortableName));
}

console.log(`\n=== Published v${version} ===`);
console.log(`Download URL: ${downloadUrl}`);
