# How to Get Your Facebook Appstate (Cookies)

The bot needs fresh Facebook session cookies to work. Follow these step-by-step instructions:

## Method 1: Using Email/Password Login (EASIEST - Recommended)

**⚠️ Note:** This is the most reliable method for fresh sessions.

### Steps:

1. Make sure you can login to Facebook with email/password (disable 2FA temporarily if needed)

2. Run the login script:
```bash
node login-with-credentials.js
```

3. Enter your Facebook email and password when prompted

4. The script will automatically create `appstate.json` with fresh cookies

5. Start the bot:
```bash
npm start
```

**Advantages:**
- Most reliable - generates proper session cookies
- No manual cookie extraction needed
- Facebook less likely to flag the session

**If you have 2FA enabled:**
- You'll need to approve the login on your phone
- Or temporarily disable 2FA
- Or use Method 2 below instead

---

## Method 2: Using Browser Extension

### Step 1: Install Cookie Extension

Choose one based on your browser:

**Chrome/Edge:**
- [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
- [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)

**Firefox:**
- [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### Step 2: Login to Facebook

1. Open your browser
2. Go to https://www.facebook.com
3. Login with the account you want to use for the bot
4. Make sure you're fully logged in (can see your news feed)

### Step 3: Export Cookies

**Using EditThisCookie:**
1. Click the EditThisCookie extension icon
2. Click the "Export" button (looks like a download icon)
3. The cookies are now copied to your clipboard

**Using Cookie-Editor:**
1. Click the Cookie-Editor extension icon
2. Click "Export" at the bottom
3. Choose "JSON" format
4. Click "Copy to clipboard"

### Step 4: Create appstate.json

1. In this Replit project, create a new file called `appstate.json`
2. Paste the cookies you copied
3. Save the file

The file should look like this:
```json
[
  {
    "key": "datr",
    "value": "abc123...",
    "domain": ".facebook.com",
    ...
  },
  ...
]
```

### Step 5: Restart the Bot

The bot will automatically restart and use your fresh cookies!

---

## Method 2: Using c3c-fbstate Tool (Advanced)

If you want an automated tool:

1. Install: `npm install -g c3c-fbstate`
2. Run: `c3c-fbstate`
3. Follow the prompts to login
4. It will generate `appstate.json` automatically

---

## Troubleshooting

### "Not logged in" error even with fresh cookies

**Possible causes:**
1. **Cookies expired too quickly** - Facebook might be flagging the account
2. **2FA/Security check** - Login to Facebook manually and complete any security checks
3. **Account checkpoint** - Your account might be restricted

**Solutions:**
- Login to facebook.com in your browser and approve any security alerts
- Complete any verification challenges (phone, email, etc.)
- Use a dedicated Facebook account for the bot
- Try using Firefox instead of Chrome (sometimes works better)

### Cookies keep expiring

- Make sure you're exporting cookies IMMEDIATELY after logging in
- Don't logout of Facebook after exporting
- Keep the browser session active
- The bot auto-refreshes cookies every 60 minutes to help prevent this

### Extension doesn't show cookies

- Make sure you're on the Facebook website when clicking the extension
- Refresh the Facebook page and try again
- Try a different cookie extension

---

## Important Notes

⚠️ **Security Warning:**
- Never share your `appstate.json` file - it gives full access to your Facebook account
- Use a dedicated Facebook account for the bot (not your personal account)
- Add `appstate.json` to `.gitignore` (already done in this project)

✅ **Best Practices:**
- Get fresh cookies every time you restart the bot for the first time
- If the bot has been running successfully, the cookies auto-refresh
- Firefox cookies tend to last longer than Chrome
- Use the bot account regularly to avoid Facebook flagging it as suspicious

---

## Still Having Issues?

1. Make sure you completed all Facebook security checks
2. Try using the bot with a different Facebook account
3. Check if your IP is blocked by Facebook
4. Verify the cookies are in valid JSON format
5. Make sure you copied ALL the cookies, not just some
