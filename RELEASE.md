# Release Guide

## Pre-Release Checklist

- [ ] Update version numbers in `package.json` and `tauri.conf.json`
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Test the build locally
- [ ] Commit all changes
- [ ] Create and push git tag

## Release Steps

### 1. Update Version Numbers

Already updated to `1.0.1` in:
- `package.json`
- `src-tauri/tauri.conf.json`

### 2. Build Signed Application

```bash
# Load signing configuration
source signing-config.sh

# Build for production
npm run tauri build
```

### 3. Commit Changes

```bash
git add .
git commit -m "chore: add code signing support for macOS (v1.0.1)"
```

### 4. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.1 -m "Release v1.0.1: Code signing support"

# Push tag to remote
git push origin v1.0.1

# Push commits
git push origin main  # or master, depending on your default branch
```

### 5. Create GitHub Release

1. Go to: https://github.com/skiller-dev/skiller/releases/new
2. **Tag**: Select `v1.0.1`
3. **Title**: `v1.0.1 - Code Signing Support`
4. **Description**:

```markdown
## What's New

### Security
- ✅ macOS app is now signed with Developer ID Application certificate
- ✅ Users can install and run without security warnings (after first right-click "Open")
- ✅ DMG installer is also signed for secure distribution

## Installation

Download the DMG file below and drag `Skiller.app` to your Applications folder.

**Note**: On first launch, you may need to right-click the app and select "Open" once. After that, you can launch it normally.

## Files

- `Skiller_1.0.1_aarch64.dmg` - macOS installer (Apple Silicon)
```

5. **Attach Files**: Upload the DMG file from:
   ```
   src-tauri/target/release/bundle/dmg/Skiller_1.0.1_aarch64.dmg
   ```

6. Click **"Publish release"**

## Post-Release

- [ ] Update `CHANGELOG.md` links
- [ ] Announce on social media/community (if applicable)
- [ ] Monitor for any issues

## Future: Automated Releases

Consider setting up GitHub Actions to automate:
- Building for all platforms
- Code signing and notarization
- Creating releases
- Uploading artifacts

See `.github/workflows/` for CI/CD configuration.
