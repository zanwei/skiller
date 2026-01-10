#!/bin/bash
# Automated release script for Skiller
# Usage: ./scripts/release.sh [patch|minor|major]
#   patch: 1.0.3 -> 1.0.4 (default)
#   minor: 1.0.3 -> 1.1.0
#   major: 1.0.3 -> 2.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version bump type (default: patch)
BUMP_TYPE=${1:-patch}

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case $BUMP_TYPE in
  major)
    NEW_VERSION="$((MAJOR + 1)).0.0"
    ;;
  minor)
    NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
    ;;
  patch)
    NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
    ;;
  *)
    echo -e "${RED}Invalid bump type: $BUMP_TYPE${NC}"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
    ;;
esac

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Confirm
read -p "Proceed with release v${NEW_VERSION}? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# Update version in all files
echo -e "${YELLOW}Updating version in package.json...${NC}"
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json

echo -e "${YELLOW}Updating version in src-tauri/tauri.conf.json...${NC}"
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json

echo -e "${YELLOW}Updating version in src-tauri/Cargo.toml...${NC}"
sed -i '' "s/version = \"${CURRENT_VERSION}\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml

# Update Cargo.lock
echo -e "${YELLOW}Updating Cargo.lock...${NC}"
cd src-tauri && cargo check --quiet 2>/dev/null || true && cd ..

# Git operations
echo -e "${YELLOW}Committing changes...${NC}"
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "chore: bump version to ${NEW_VERSION}"

echo -e "${YELLOW}Pushing to main...${NC}"
git push origin main

echo -e "${YELLOW}Creating tag v${NEW_VERSION}...${NC}"
git tag "v${NEW_VERSION}"
git push origin "v${NEW_VERSION}"

echo ""
echo -e "${GREEN}✅ Release v${NEW_VERSION} triggered!${NC}"
echo ""
echo "CI will automatically:"
echo "  - Build for all platforms (Linux, macOS, Windows)"
echo "  - Create a draft release with all assets"
echo ""
echo "Monitor progress at:"
echo "  https://github.com/zanwei/skiller/actions"
echo ""
echo "Once complete, review and publish the draft release at:"
echo "  https://github.com/zanwei/skiller/releases"
