# TestFlight Deployment Guide - Sweet Dill

## ✅ What's Been Done

1. **Capacitor iOS Setup** - Web app is now wrapped in a native iOS container
2. **Mobile Viewport** - App constrained to iPhone dimensions (390×844)
3. **Safe Area Handling** - Proper notch/home indicator spacing
4. **Build Scripts** - Added npm scripts for iOS workflow

## 📱 Prerequisites

You need:
- **Mac** with Xcode installed (required for iOS builds)
- **Apple Developer Account** ($99/year)
- **Provisioning Profile** and **Signing Certificate** configured in Xcode

## 🚀 Deployment Steps

### 1. Open Xcode Project

```bash
cd poc-shopper-assist
npm run cap:open:ios
```

This opens `ios/App/App.xcworkspace` in Xcode.

### 2. Configure App Settings in Xcode

**Target: App**

1. **General Tab:**
   - **Display Name:** `Sweet Dill`
   - **Bundle Identifier:** `ai.sweetdill.shopper` (or your preferred reverse-domain)
   - **Version:** `1.0.0`
   - **Build:** `1`
   - **Deployment Target:** iOS 13.0+ (or latest)

2. **Signing & Capabilities Tab:**
   - ✅ **Automatically manage signing** (recommended)
   - **Team:** Select your Apple Developer team
   - Xcode will auto-generate provisioning profiles

3. **Info Tab:**
   - Verify `CFBundleName`, `CFBundleDisplayName` are set to "Sweet Dill"

### 3. Update App Icons (Optional)

Replace placeholder icons in:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

Use a tool like [appicon.co](https://www.appicon.co/) to generate all required sizes.

### 4. Build & Archive

1. Select **Any iOS Device (arm64)** as build target (top toolbar)
2. Menu: **Product → Archive**
3. Wait for build (~2-5 min first time)
4. Xcode Organizer window opens when done

### 5. Upload to App Store Connect

In the Xcode Organizer:

1. Select your archive
2. Click **Distribute App**
3. Choose **App Store Connect**
4. Click **Upload**
5. Select **Automatically manage signing** (recommended)
6. Review summary → **Upload**

### 6. Submit to TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **My Apps → Sweet Dill** (or create new app if first time)
3. Go to **TestFlight** tab
4. Your build appears under **iOS Builds** (may take 5-10 min to process)
5. Add **Testing Information:**
   - Beta App Description
   - Feedback Email
   - Privacy Policy URL (if needed)
6. Click **Provide Export Compliance** → Answer questions
7. Enable **External Testing** (or Internal for team-only)
8. Add testers (email addresses)
9. Submit for Beta Review (if external testing)

Testers receive TestFlight invite via email within 24-48h.

## 🔄 Updating the App

When you make changes:

```bash
# 1. Make your code changes
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npm run cap:open:ios

# 4. Increment Build number in Xcode (General tab)
# 5. Archive & upload (repeat steps 4-6 above)
```

## 🛠️ Helpful npm Scripts

```bash
npm run build              # Build web app
npm run cap:sync          # Build + sync to iOS/Android
npm run cap:open:ios      # Open iOS project in Xcode
npm run ios:build         # Build + sync + open (all-in-one)
```

## 🐛 Troubleshooting

### "No provisioning profiles found"
- Xcode → Preferences → Accounts → Download Manual Profiles
- Or enable "Automatically manage signing"

### "Failed to register bundle identifier"
- Change bundle ID in Xcode (must be unique)
- Format: `com.yourcompany.sweetdill`

### "Code signing error"
- Ensure you're logged into Xcode with Apple Developer account
- Check that your team is selected in Signing & Capabilities

### Build fails with TypeScript errors
- Run `npm run build` first to verify web app builds
- Fix any TypeScript errors before opening Xcode

### App doesn't match iOS dimensions
- The `MobileContainer` component handles this
- On real iOS device: full screen with safe areas
- On web/simulator: centered iPhone mockup

## 📝 App Store Connect Setup (First Time Only)

If this is your first app:

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps → + (plus icon)**
3. Select **New App**
4. Fill in:
   - **Platforms:** iOS
   - **Name:** Sweet Dill
   - **Primary Language:** English
   - **Bundle ID:** `ai.sweetdill.shopper` (must match Xcode)
   - **SKU:** `sweetdill-001` (any unique ID)
5. Click **Create**

Then proceed with TestFlight steps above.

## 🎯 Quick Summary

For fast iteration:
1. Make code changes
2. `npm run ios:build` (builds + syncs + opens Xcode)
3. Increment build number
4. Product → Archive
5. Distribute to TestFlight

---

**Need help?** DM me or check:
- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [TestFlight Guide](https://developer.apple.com/testflight/)
