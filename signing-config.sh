#!/bin/bash
# Apple Code Signing Configuration
# Run this script or add its contents to ~/.zshrc

# Developer ID Application certificate name
export APPLE_SIGNING_IDENTITY="Developer ID Application: zanwei guo (Z9VQ8GY7PB)"

# App Store Connect API Key (for notarization)
# Get it from: https://appstoreconnect.apple.com/access/integrations/api
# Uncomment the lines below and fill in your information:
# export APPLE_API_ISSUER="Your Issuer ID"
# export APPLE_API_KEY="Your Key ID"
# export APPLE_API_KEY_PATH="/path/to/AuthKey_XXXX.p8"

echo "✅ Signing configuration loaded"
echo "Signing Identity: $APPLE_SIGNING_IDENTITY"
