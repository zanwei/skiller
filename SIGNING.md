# macOS Code Signing & Notarization Guide

## ✅ Certificate Installed

Your Developer ID Application certificate has been successfully installed:
```
Developer ID Application: zanwei guo (Z9VQ8GY7PB)
```

## 🔧 Configure Signing Environment Variables

### Method 1: Temporary Setup (Current Terminal Session Only)

```bash
source signing-config.sh
```

### Method 2: Permanent Setup (Recommended)

Add the following to your `~/.zshrc`:

```bash
# Apple Code Signing
export APPLE_SIGNING_IDENTITY="Developer ID Application: zanwei guo (Z9VQ8GY7PB)"
```

Then reload:
```bash
source ~/.zshrc
```

## 🔐 Configure App Store Connect API Key (For Notarization)

Notarization allows users to open the app directly without right-clicking "Open".

### Steps:

1. **Visit App Store Connect**
   - Go to: https://appstoreconnect.apple.com/access/integrations/api

2. **Create API Key**
   - Click **"+"** to create a new Key
   - Name: `Skiller Notarization` (or any name)
   - Access Level: Select **"Developer"**
   - Click **"Generate"**

3. **Download and Save Key**
   - Download the `.p8` file (**Can only be downloaded once!**)
   - Save to a secure location, e.g.: `~/Library/Keys/AuthKey_XXXX.p8`
   - Record the **Key ID** and **Issuer ID**

4. **Set Environment Variables**
   
   Add to `~/.zshrc`:
   ```bash
   # App Store Connect API (for notarization)
   export APPLE_API_ISSUER="Your Issuer ID"
   export APPLE_API_KEY="Your Key ID"
   export APPLE_API_KEY_PATH="$HOME/Library/Keys/AuthKey_XXXX.p8"
   ```

   Reload:
   ```bash
   source ~/.zshrc
   ```

## 🚀 Build Signed Application

After configuring environment variables, run:

```bash
npm run tauri build
```

Tauri will automatically:
- ✅ Sign the app using `APPLE_SIGNING_IDENTITY`
- ✅ Submit for notarization using API Key (if configured)
- ✅ Wait for notarization and staple to DMG

## 📝 Verify Signature

After building, verify the signature:

```bash
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/Skiller.app
```

You should see:
```
Authority=Developer ID Application: zanwei guo (Z9VQ8GY7PB)
```

## ⚠️ Notes

1. **First notarization may take a few minutes**, Tauri will automatically wait for completion
2. **Without API Key configured**, the app will still be signed but users need to right-click "Open" once
3. **Notarized apps** can be opened directly by double-clicking, no additional steps needed

## 🔍 Troubleshooting

### Certificate Not Found
```bash
security find-identity -v -p codesigning | grep "Developer ID"
```

### View Signature Details
```bash
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/Skiller.app
```

### Verify Notarization Status
```bash
spctl -a -vv -t install src-tauri/target/release/bundle/macos/Skiller.app
```
