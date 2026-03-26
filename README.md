> [!CAUTION]
>
> **DISCLAIMER:** This prototype project was developed for educational, moderation, and automation experiments. It is provided **"as is"** without warranties. The developer assumes no responsibility for account restrictions, group moderation disputes, data loss, or misuse of the software. Use at your own risk.

# Messenger Bot: Group Attendance & Moderation Assistant

> [!NOTE]
>
> This project serves as a functional prototype and study guide for understanding how a **Facebook Messenger bot** can combine **attendance tracking**, **moderation rules**, **persistent JSON storage**, and **group automation** into one command-driven system.

Welcome to the **MESSENGER-BOT** repository. This project is a Node.js-powered Messenger bot built to help manage group chats through attendance tools, warnings, bans, greetings, member approval workflows, and utility commands.

---

## Features

- [x] **Attendance Tracking** (`.present`, `.attendance`, `.attendancelist`)
- [x] **Automatic Daily Reset Logic** with consecutive absence tracking
- [x] **Escalating Warning & Ban System** (including timed and permanent penalties)
- [x] **Custom Welcome Greetings** for new group members
- [x] **Group Admin Management** with protected developer/super-admin roles
- [x] **Keyword-Based Auto-Warning Moderation**
- [x] **Pending Member Approval Workflow** (`.pendinglist`, `.approve`)
- [x] **Unsent Message / Image Tracking** for moderation visibility
- [x] **YouTube Audio Playback Utility** (`.play <link>`)
- [x] **Persistent Storage Layer** powered by local JSON files through `dataManager.js`

---

## Architecture Overview

This project works as an **event-driven Messenger moderation bot**.

- **The Messenger Login Layer:** Uses `@dongdev/fca-unofficial` with `appstate.json` for persistent login.
- **The Bot Runtime:** `bot.js` listens for messages, replies, unsends, joins, and admin actions.
- **The Data Layer:** `dataManager.js` stores attendance, bans, warnings, excluded members, server info, admins, and pending members in JSON files.
- **The Moderation Engine:** Applies warnings, tracks offenses, escalates bans, and supports admin-only commands.
- **The Utility Layer:** Handles audio download requests, greeting setup, server info storage, and unsent-image repost logic.

---

## Core Educational Concepts

If you are studying this codebase, these are the most important system ideas:

> [!IMPORTANT]
> **What is Persistent Bot State?**  
> A bot becomes more useful when it remembers what happened before. This project keeps attendance logs, warning counts, ban records, and group settings inside JSON files so that information survives bot restarts.

> [!IMPORTANT]
> **What is Moderation Automation?**  
> Moderation automation means the bot can enforce rules consistently. Instead of relying only on manual admin actions, the bot can count warnings, detect repeated offenses, and apply escalation rules such as timed bans.

> [!IMPORTANT]
> **Why Separate Data Logic from Bot Logic?**  
> The bot behavior lives in `bot.js`, while the storage logic lives in `dataManager.js`. This separation makes the project easier to maintain, debug, and expand.

### Message Processing Flow

1. A message event is received from Messenger.
2. The bot checks whether it is a command starting with `.`.
3. The correct command handler is selected.
4. Data is read or updated through `dataManager.js`.
5. The bot sends the result back into the group chat.

---

## ⚙️ Installation & Setup

> [!WARNING]
> This project requires **Node.js 18+**, a valid Facebook session, and working dependencies for login, media handling, and HTTP requests.

**1. Clone the repository:**

```bash
git clone <your-repository-url>
cd MESSENGER-BOT-main
```

**2. Install dependencies:**

```bash
npm install
npm install axios ytdl-core
```

**3. Prepare login credentials or session state:**

Choose one of the following:

- Put a valid `appstate.json` file in the project root, or
- Run the helper login script:

```bash
node login-with-credentials.js
```

If your session file needs formatting fixes, run:

```bash
node fix-appstate.js
```

**4. Start the bot:**

```bash
npm start
```

---

## Command Reference

### General Commands

- `.help [page]` - View available commands by page
- `.present` - Mark yourself present
- `.attendance` - View the daily attendance list
- `.attendancelist` - View members who missed attendance
- `.warninglist` - View warning standings
- `.unsent` - Repost the last unsent image
- `.play <YouTube link>` - Send audio from a YouTube URL

### Admin Commands

- `.pendinglist` - View pending group requests
- `.approve <UID/Name>` - Approve a pending member
- `.attendancereset` - Reset attendance for the group
- `.resetatt @user` - Reset one user's consecutive absence count
- `.attendanceexl @user` - Exclude a user from attendance tracking
- `.attendanceback @user` - Add an excluded user back into attendance
- `.setgreeting [text]` - Set a custom welcome greeting
- `.serverinfo [ip:port]` - Save server information for the group
- `.addwarning [word1, word2]` - Add warning keywords
- `.removeword [word1, word2]` - Remove warning keywords
- `.warning @user [reason]` - Warn a user manually
- `.unwarning @user` - Remove one warning from a user
- `.kick @user [reason]` - Kick a member from the group
- `.ban @user [reason]` - Ban and remove a member
- `.unban [Ban ID]` - Lift a ban
- `.shutdown` - Stop the bot

### Developer / Super Admin Commands

- `.addmin @user` - Promote a user as group admin
- `.removeadmin @user` - Remove a group admin
- `.banall` - Ban all members in a group
- `.removeallbans` - Reset all ban records
- `.removeallwarnings` - Clear warning records

---

## Project Structure

```text
MESSENGER-BOT-main/
|- bot.js
|- dataManager.js
|- appstate.json
|- login-with-credentials.js
|- fix-appstate.js
|- HOW_TO_GET_APPSTATE.md
|- offlineMessages.json
|- pendingMembers.json
|- data/
|  |- attendance.json
|  |- warnings.json
|  |- banned.json
|  |- greetings.json
|  |- admins.json
|  |- serverInfo.json
```

---

## Why This Project Matters

This repository is useful for studying:

- event-driven bot development
- moderation workflow design
- attendance automation
- JSON-based persistence
- command permission systems
- user-state escalation rules

---

## Final Note

This bot is best viewed as a **multi-purpose Messenger management assistant**. It demonstrates how one chat automation project can combine moderation, attendance, member management, and utility tools inside a single Node.js codebase.
