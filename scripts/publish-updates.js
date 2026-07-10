const { execSync } = require("child_process");

console.log("Deploying web app to Vercel...");

try {
  execSync("vercel deploy --yes --prod", {
    cwd: __dirname + "/..",
    stdio: "inherit",
  });
  console.log("\nDeployed! Web app: https://aurum-vpn.vercel.app");
} catch (err) {
  console.error("Vercel deploy failed:", err.message);
  process.exit(1);
}
