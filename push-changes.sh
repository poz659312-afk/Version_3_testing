#!/bin/bash

# Exit on error except for git checks
set -e

# 1. Ask for commit message
echo -n "Enter a description for your changes (commit message): "
read -r commitMessage

if [ -z "$commitMessage" ]; then
    commitMessage="update: modifications to frontend"
fi

# Detect current branch dynamically
branch=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ -z "$branch" ]; then
    branch=$(git rev-parse --abbrev-ref HEAD)
fi

if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
    echo -e "\e[31mError: Could not detect the active Git branch. Are you in a detached HEAD state?\e[0m"
    echo -n "Press Enter to exit"
    read -r
    exit 1
fi

echo -e "\e[33mActive Git branch detected: $branch\e[0m"

# 2. Stage all changes in the repository
echo -e "\e[36mStaging changes...\e[0m"
git add -A

# 3. Commit changes (only if there are staged changes)
status=$(git status --porcelain)
if [ -n "$status" ]; then
    echo -e "\e[36mCommitting changes...\e[0m"
    git commit -m "$commitMessage"
else
    echo -e "\e[33mNo changes to commit, checking remote sync...\e[0m"
fi

# 4. Pull remote changes to avoid non-fast-forward errors
echo -e "\e[36mPulling remote changes from GitHub (branch: $branch)...\e[0m"
git pull origin "$branch" --rebase

# 5. Push to branch
echo -e "\e[36mPushing changes to GitHub (branch: $branch)...\e[0m"
git push origin "$branch"

echo -e "\e[32mDone! Your changes are safely uploaded to GitHub.\e[0m"
echo -n "Press Enter to exit"
read -r
