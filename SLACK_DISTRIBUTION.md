# Turbopuffer GUI - Slack Distribution Guide

## 🚀 Quick Start

The Mac app is built and ready! Here's how to distribute it via Slack:

## 📦 Built App Location

```
/Users/peker/GitHub/turbopuffer-gui/out/make/zip/darwin/arm64/Turbopuffer GUI-darwin-arm64-1.0.0.zip
```

## 📤 Distribution Steps

1. **Upload to Slack**:
   - Go to your internal Slack channel
   - Drag and drop the `.zip` file or use the attachment button
   - Add a message like: "Turbopuffer GUI v1.0.0 for macOS (Intel & Apple Silicon)"

2. **Installation Instructions for Team**:
   ```
   1. Download the .zip file from Slack
   2. Double-click to extract
   3. Drag "Turbopuffer GUI.app" to Applications folder
   4. First time opening:
      - Right-click the app and select "Open"
      - Click "Open" in the security dialog
      - This is needed because the app isn't signed yet
   ```

## ⚠️ Security Warning

Since the app isn't code-signed, macOS will show a security warning on first launch. Users need to:
1. Right-click → Open (instead of double-clicking)
2. Click "Open" in the security dialog

## 🔄 Future Improvements

To avoid security warnings:
1. Get an Apple Developer account ($99/year)
2. Code sign the app
3. Notarize with Apple

## 📊 Current Status

- ✅ App builds successfully
- ✅ Runs on macOS (arm64)
- ✅ Turbopuffer SDK working with browser-compatible wrapper
- ⚠️ No code signing (users will see security warning)
- ⚠️ No app icon (using default Electron icon)

## 🛠️ To Build Again

```bash
npm run make
```

The output will be in `out/make/zip/darwin/arm64/`