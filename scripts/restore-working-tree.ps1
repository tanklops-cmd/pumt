# Restore working tree to last committed state
# WARNING: This will discard uncommitted changes and remove untracked files.
# Run this in the repository root where git is available.

Write-Host "Checking git availability..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not in PATH. Install git and re-run this script."
  exit 1
}

Write-Host "Current branch and latest commit:"
git rev-parse --abbrev-ref HEAD
git log -n 1 --pretty=oneline

Write-Host "Resetting working tree to HEAD (hard) and removing untracked files..."
git reset --hard HEAD
if ($LASTEXITCODE -ne 0) { Write-Error "git reset failed"; exit 2 }

git clean -fd
if ($LASTEXITCODE -ne 0) { Write-Error "git clean failed"; exit 3 }

Write-Host "Done. Current status:"
git status --porcelain

Write-Host "If you need to restore to a specific commit, run:\n  git reset --hard <commit-hash>\n  git clean -fd"