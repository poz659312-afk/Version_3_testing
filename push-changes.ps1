# 1. Ask for commit message
$commitMessage = Read-Host -Prompt "Enter a description for your changes (commit message)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "update: modifications to frontend"
}

# Detect current branch dynamically
$branch = (git symbolic-ref --short HEAD 2>$null)
if (-not $branch) {
    $branch = (git rev-parse --abbrev-ref HEAD)
}

if (-not $branch -or $branch -eq "HEAD") {
    Write-Host "Error: Could not detect the active Git branch. Are you in a detached HEAD state?" -ForegroundColor Red
    Read-Host -Prompt "Press Enter to exit"
    exit 1
}

Write-Host "Active Git branch detected: $branch" -ForegroundColor Yellow

# 2. Stage all changes in the repository
Write-Host "Staging changes..." -ForegroundColor Cyan
git add -A

# 3. Commit changes (only if there are staged changes)
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m $commitMessage
} else {
    Write-Host "No changes to commit, checking remote sync..." -ForegroundColor Yellow
}

# 4. Pull remote changes to avoid non-fast-forward errors
Write-Host "Pulling remote changes from GitHub (branch: $branch)..." -ForegroundColor Cyan
git pull origin "$branch" --rebase

# 5. Push to branch
Write-Host "Pushing changes to GitHub (branch: $branch)..." -ForegroundColor Cyan
git push origin "$branch"

Write-Host "Done! Your changes are safely uploaded to GitHub." -ForegroundColor Green
Read-Host -Prompt "Press Enter to exit"
