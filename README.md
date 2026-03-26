# Facebook Messenger Bot (Tensura)

A Facebook Messenger bot for tracking daily attendance, AI interaction, and automated moderation in group chats.

## Features

- ✅ **Automatic Login**: Uses `appstate.json` for persistent authentication
- 🧠 **Gemini AI**: Integrated Google Gemini AI for smart conversation (`.chat`)
- 📋 **Daily Attendance**: Track who's present each day with automatic reset
- 👁️ **Unsent Detector**: Automatically catches and reposts deleted images
- 🛡️ **Advanced Moderation**: Detects hidden vulgarity (using Unicode normalization) and spam
- 👋 **Custom Greetings**: Welcome new members with personalized messages
- 💾 **Persistent Storage**: Data saved via `dataManager.js` and JSON files

## Setup Instructions

### Step 1: Configuration

**⚠️ IMPORTANT:** You must configure the bot before running it.

1. Open `index.js` in your code editor.
2. **Gemini API**: Insert your key in the line: `const GEMINI_API_KEY = "..."`
3. **Admin IDs**: Update `DEVELOPER_ID` and `SUPER_ADMIN_ID` with your Facebook User ID.

### Step 2: Get Your Facebook Appstate

**⚠️ IMPORTANT:** You need **FRESH** Facebook session cookies for the bot to work properly.

**Quick Steps:**

1. **Install a browser extension** to extract cookies (e.g., "EditThisCookie" or "Cokie-Editor").
2. **Login to Facebook** in your browser with the bot account.
3. **Export the cookies** (Copy to clipboard).
4. **Create appstate.json**:
   - Create a file named `appstate.json` in the project root.
   - Paste your cookies into it (must be a JSON array).

**💡 Tip:** Use Firefox/Chrome and get cookies immediately after logging in.

### Step 3: Run the Bot

Once you have `appstate.json` and `index.js` configured:

```bash
npm install
npm start
