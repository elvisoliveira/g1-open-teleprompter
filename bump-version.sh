#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Usage: $0 <new_version> [--auto-version-code]${NC}"
    echo -e "${BLUE}       $0 patch|minor|major [--auto-version-code]${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 1.0.9                   # Set specific version"
    echo -e "  $0 patch                   # Bump patch version (1.0.8 -> 1.0.9)"
    echo -e "  $0 minor                   # Bump minor version (1.0.8 -> 1.1.0)" 
    echo -e "  $0 major                   # Bump major version (1.0.8 -> 2.0.0)"
    echo -e "  $0 1.2.0 --auto-version-code  # Also auto-increment versionCode"
    echo ""
    echo -e "${YELLOW}Files updated:${NC}"
    echo -e "  • package.json"
    echo -e "  • package-lock.json"
    echo -e "  • app.json"
    echo -e "  • android/app/build.gradle (versionName + optionally versionCode)"
}

# Function to validate semantic version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${RED}Error: Invalid version format. Use semantic versioning (e.g., 1.0.9)${NC}"
        exit 1
    fi
}

# Function to get current version from package.json
get_current_version() {
    grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4
}

# Function to increment version
increment_version() {
    local current_version=$1
    local bump_type=$2
    
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}
    
    case $bump_type in
        "patch")
            patch=$((patch + 1))
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        *)
            echo -e "${RED}Error: Invalid bump type. Use: patch, minor, or major${NC}"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to get current versionCode
get_current_version_code() {
    grep -o 'versionCode [0-9]*' android/app/build.gradle | cut -d' ' -f2
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "app.json" ] || [ ! -f "android/app/build.gradle" ]; then
    echo -e "${RED}Error: This script must be run from the project root directory${NC}"
    echo -e "${RED}Missing required files: package.json, app.json, or android/app/build.gradle${NC}"
    exit 1
fi

# Parse arguments
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

NEW_VERSION=""
AUTO_VERSION_CODE=false

for arg in "$@"; do
    case $arg in
        --auto-version-code)
            AUTO_VERSION_CODE=true
            ;;
        patch|minor|major)
            if [ -n "$NEW_VERSION" ]; then
                echo -e "${RED}Error: Cannot specify both version and bump type${NC}"
                exit 1
            fi
            CURRENT_VERSION=$(get_current_version)
            NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$arg")
            echo -e "${BLUE}Bumping $arg version: $CURRENT_VERSION -> $NEW_VERSION${NC}"
            ;;
        *)
            if [ -n "$NEW_VERSION" ]; then
                echo -e "${RED}Error: Multiple versions specified${NC}"
                exit 1
            fi
            NEW_VERSION="$arg"
            ;;
    esac
done

# Validate the new version
validate_version "$NEW_VERSION"

# Get current values
CURRENT_VERSION=$(get_current_version)
CURRENT_VERSION_CODE=$(get_current_version_code)

# Calculate new versionCode if auto-increment is enabled
NEW_VERSION_CODE=$CURRENT_VERSION_CODE
if [ "$AUTO_VERSION_CODE" = true ]; then
    NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
fi

echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"
echo -e "${YELLOW}New version: $NEW_VERSION${NC}"
echo -e "${YELLOW}Current versionCode: $CURRENT_VERSION_CODE${NC}"
echo -e "${YELLOW}New versionCode: $NEW_VERSION_CODE${NC}"
echo ""

# Confirm before proceeding
read -p "$(echo -e ${BLUE}Do you want to proceed? [y/N]: ${NC})" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Version bump cancelled${NC}"
    exit 0
fi

echo -e "${GREEN}Updating version files...${NC}"

# Update package.json
echo -e "  • Updating package.json..."
sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json && rm package.json.bak

# Update package-lock.json using npm
if [ -f "package-lock.json" ]; then
    echo -e "  • Updating package-lock.json using npm..."
    npm i --package-lock-only
else
    echo -e "  • package-lock.json not found, skipping..."
fi

# Update app.json
echo -e "  • Updating app.json..."
sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" app.json && rm app.json.bak

# Update android/app/build.gradle
echo -e "  • Updating android/app/build.gradle..."
sed -i.bak "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle && rm android/app/build.gradle.bak

# Update versionCode if auto-increment is enabled
if [ "$AUTO_VERSION_CODE" = true ]; then
    sed -i.bak "s/versionCode [0-9]*/versionCode $NEW_VERSION_CODE/" android/app/build.gradle && rm android/app/build.gradle.bak
fi

echo ""
echo -e "${GREEN}✅ Version bump completed successfully!${NC}"
echo -e "${GREEN}Updated files:${NC}"
echo -e "  • package.json: $CURRENT_VERSION -> $NEW_VERSION"
if [ -f "package-lock.json" ]; then
    echo -e "  • package-lock.json: $CURRENT_VERSION -> $NEW_VERSION"
fi
echo -e "  • app.json: $CURRENT_VERSION -> $NEW_VERSION"
echo -e "  • android/app/build.gradle versionName: $CURRENT_VERSION -> $NEW_VERSION"
if [ "$AUTO_VERSION_CODE" = true ]; then
    echo -e "  • android/app/build.gradle versionCode: $CURRENT_VERSION_CODE -> $NEW_VERSION_CODE"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review changes: git diff"
echo -e "  2. Commit changes: git add . && git commit -m \"Bump version to $NEW_VERSION\""
echo -e "  3. Create tag: git tag v$NEW_VERSION"
echo -e "  4. Push changes: git push && git push --tags"
