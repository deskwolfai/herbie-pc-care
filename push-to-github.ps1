# push-to-github.ps1
#
# One-shot helper to wire this folder up to a fresh empty GitHub repo and
# push the initial commit. Run from inside this folder:
#
#   .\push-to-github.ps1
#
# It will:
#   1. Ask for your GitHub username and the repo name (defaults to herbie-pc-care)
#   2. Add the remote, rename the branch to main, and push
#   3. Open the new repo + Vercel import URL in your browser
#
# Pre-reqs:
#   - You've already created an EMPTY repo at github.com/<you>/<repo>
#     (no README, no .gitignore, no license — checkboxes UNticked)
#   - You're signed in to GitHub in a browser. The first push will trigger
#     Git Credential Manager to authorize Git. Click through.

$ErrorActionPreference = "Stop"

# Sanity — must be inside the herbie-pc-care git repo
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: no .git folder here. Run this from inside Outputs\herbie-pc-care." -ForegroundColor Red
    exit 1
}

# Verify there's a commit to push
$commitCount = (git rev-list --count HEAD 2>$null)
if (-not $commitCount -or [int]$commitCount -lt 1) {
    Write-Host "ERROR: no commits in this repo yet. Make a commit first." -ForegroundColor Red
    exit 1
}

# Check whether a remote is already set
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote 'origin' already points to: $existingRemote" -ForegroundColor Yellow
    $reuse = Read-Host "Push to that remote? (y/N)"
    if ($reuse -eq 'y' -or $reuse -eq 'Y') {
        $repoUrl = $existingRemote
    } else {
        Write-Host "Removing old remote..." -ForegroundColor Cyan
        git remote remove origin
        $repoUrl = $null
    }
}

if (-not $repoUrl) {
    $username = Read-Host "GitHub username"
    if ([string]::IsNullOrWhiteSpace($username)) {
        Write-Host "Username required. Aborting." -ForegroundColor Red
        exit 1
    }
    $repoNameDefault = "herbie-pc-care"
    $repoName = Read-Host "Repository name [$repoNameDefault]"
    if ([string]::IsNullOrWhiteSpace($repoName)) { $repoName = $repoNameDefault }

    $repoUrl = "https://github.com/$username/$repoName.git"
    Write-Host ""
    Write-Host "Adding remote: $repoUrl" -ForegroundColor Cyan
    git remote add origin $repoUrl
}

# Make sure we're on main
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch '$currentBranch' to 'main'..." -ForegroundColor Cyan
    git branch -M main
}

Write-Host ""
Write-Host "Pushing to GitHub. If prompted, authorize Git Credential Manager." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Common causes:" -ForegroundColor Red
    Write-Host "  - Repo doesn't exist yet on GitHub. Create it first at https://github.com/new (empty, no README)." -ForegroundColor Red
    Write-Host "  - Auth was denied. Re-run after signing in." -ForegroundColor Red
    Write-Host "  - The repo isn't empty (push rejected). Recreate it without checkboxes ticked." -ForegroundColor Red
    exit 1
}

# Done
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " Pushed to GitHub" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Compute web URLs
$webUrl = $repoUrl -replace "\.git$", "" -replace "^git@github.com:", "https://github.com/"
$vercelImportUrl = "https://vercel.com/new"

Write-Host ""
Write-Host "Repo:    $webUrl"
Write-Host "Vercel:  $vercelImportUrl  (sign in with GitHub, then Import this repo)"
Write-Host ""

$open = Read-Host "Open both in your browser now? (Y/n)"
if ($open -ne 'n' -and $open -ne 'N') {
    Start-Process $webUrl
    Start-Sleep -Milliseconds 500
    Start-Process $vercelImportUrl
}

Write-Host ""
Write-Host "Next: in Vercel, click 'Import' next to the herbie-pc-care repo."
Write-Host "Leave all build settings empty. Click Deploy. Done in ~30 seconds." -ForegroundColor Cyan
