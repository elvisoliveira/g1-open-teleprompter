# G1 OpenTeleprompter

An open-source companion app for Even Realities G1 smart glasses that lets you send text messages to display on your glasses.

## Before You Start

**You need the official Even Realities app first!**

1. Install the official Even Realities app from Google Play
2. Pair your Even G1 glasses with the official app
3. Make sure everything works properly with the official app
4. Then you can use this companion app for extra features

## What This App Does

- Send text messages to your Even G1 glasses
- Connect both glasses (left and right) at the same time
- Keep message history - see what you've sent before
- Resend old messages quickly
- Remember your glasses - automatically connects next time

## How to Use It

### First Time Setup
1. Open the app
2. Select your left Even G1 glass from the list
3. Select your right Even G1 glass from the list
4. That's it! The app will remember your glasses

### Sending Messages
1. Type your message in the text box
2. Tap "Send to Both Devices" (or whichever glasses are connected)
3. Your message appears on your glasses instantly
4. Use "Dashboard" to return glasses to the main screen

### Managing Messages
- Tap "History" to see messages you've sent before
- Tap any old message to send it again
- Delete messages you don't need anymore

## What You Need

- Android phone or tablet (Android-only app - iOS/iPhone not supported)
- Even G1 smart glasses paired with the official Even Realities app
- Bluetooth enabled on your device

## Development

To run the app for development:

```bash
npx expo run:android
```

## Troubleshooting

**Can't find my glasses?**
- Make sure they're paired with the official Even Realities app first
- Check that Bluetooth is on
- Restart the official Even Realities app

**Connection problems?**
- Keep your phone close to the glasses
- Make sure nothing is blocking the Bluetooth signal
- Try restarting both apps

**App won't connect?**
- Grant all Bluetooth permissions when asked
- Make sure location permission is enabled (required for Bluetooth scanning)

## Technical Information

**Development Environment:**
- Node.js: v21.0.8
- Java: OpenJDK 21