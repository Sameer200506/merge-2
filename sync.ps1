# Sync with upstream: Eaglefang1107/super-spork
Write-Host "Syncing with upstream..." -ForegroundColor Cyan

# Add upstream remote if not already added
git remote add upstream https://github.com/Eaglefang1107/super-spork.git 2>$null

# Fetch latest from upstream
Write-Host "Fetching upstream..." -ForegroundColor Yellow
git fetch upstream main

# Merge upstream into local main (prefer upstream on conflicts)
Write-Host "Merging upstream/main..." -ForegroundColor Yellow
git merge upstream/main -m "auto-merge: sync with upstream/main" --allow-unrelated-histories

# Auto-resolve any conflicts by preferring upstream (theirs)
$conflicts = git diff --name-only --diff-filter=U
if ($conflicts) {
    Write-Host "Resolving conflicts (keeping upstream version)..." -ForegroundColor Magenta
    git checkout --theirs .
    git add .
    git commit -m "merge: auto-resolve conflicts, prefer upstream"
}

# Push to your GitHub repo
Write-Host "Pushing to origin..." -ForegroundColor Yellow
git push origin main

Write-Host "Sync complete!" -ForegroundColor Green
