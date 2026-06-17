const { execSync } = require("child_process");

try {
  console.log("------------------------------------------");
  console.log("🔄 Starting Upstream Sync...");
  console.log("------------------------------------------");

  // 1. Add upstream remote (ignore error if it already exists and update it)
  console.log("🔹 Configuring upstream remote...");
  try {
    execSync("git remote add upstream https://github.com/kokkushivank05-tech/shiny-doodle.git", { stdio: "ignore" });
    console.log("✅ Upstream remote configured successfully.");
  } catch (e) {
    try {
      execSync("git remote set-url upstream https://github.com/kokkushivank05-tech/shiny-doodle.git", { stdio: "ignore" });
      console.log("✅ Upstream remote URL updated.");
    } catch (err) {
      console.log("ℹ️ Upstream remote already configured.");
    }
  }

  // 2. Fetch upstream main branch
  console.log("\n🔹 Fetching latest updates from upstream/main...");
  execSync("git fetch upstream main", { stdio: "inherit" });

  // 3. Merge upstream/main into local main branch
  console.log("\n🔹 Merging upstream/main changes into local main...");
  execSync('git merge upstream/main --allow-unrelated-histories -m "auto-merge: sync with upstream/main"', { stdio: "inherit" });

  // 4. Push local changes to origin main
  console.log("\n🔹 Pushing merged changes to your GitHub repository (origin/main)...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("\n------------------------------------------");
  console.log("🎉 Sync completed successfully!");
  console.log("------------------------------------------");
} catch (error) {
  console.error("\n❌ Sync failed with the following error:");
  console.error(error.message);
  process.exit(1);
}
