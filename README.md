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
```

**3. Prepare a cookie session as JSON:**

```bash
node login-with-credentials.js
```

This helper only validates an existing `appstate.json`; it does not request a password or print cookie values. The session must be a non-empty JSON cookie array. To create a normalized copy without changing the original, run:

```bash
node fix-appstate.js
```

Use `node fix-appstate.js --replace` only when you intend to replace the session file; the script first creates a timestamped backup. Keep all session files private.

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
|- commands/
|  |- registry.js
|  |- marriage.js
|  |- divorce.js
|  |- love.js
|  |- khotba.js
|  |- kizb.js
|  |- README.md
|- tests/
|  |- dataManager.test.js
|  |- groupEvent.test.js
|  |- commandRegistry.test.js
|- scripts/
|  |- post-merge.sh
|- package.json
|- package-lock.json
|- .replit
|- appstate.json
|- login-with-credentials.js
|- fix-appstate.js
|- HOW_TO_GET_APPSTATE.md
|- offlineMessages.json
|- pendingMembers.json
|- data/
|  |- (JSON state files are created and managed by dataManager.js)
```

## File Responsibilities and Messenger Wiring

| File or folder | Purpose |
| --- | --- |
| `package.json` | Declares npm dependencies and the `start` and `test` scripts. |
| `package-lock.json` | Records exact npm dependency versions. npm generates this file; do not add comments to it. |
| `.replit` | Selects Node.js 20 and points post-merge checks at `scripts/post-merge.sh`. |
| `.gitignore` | Excludes local cookie-session files and temporary cache output from new Git changes. It does not untrack files already committed. |
| `bot.js` | Starts the existing group-capable Messenger client, handles incoming group events, and routes built-in and modular commands. |
| `appstateManager.js` | Parses, validates, normalizes, and safely writes cookie-session JSON without logging its values. |
| `appstate.json` | Local Messenger cookie-session JSON. Treat it as a credential: do not publish, paste, or share it. |
| `commands/registry.js` | Maps command text such as `.زواج` and `.love` to a command module and loads that module only when invoked. |
| `commands/marriage.js` | Implements `.زواج` / `.marriage`. |
| `commands/divorce.js` | Implements `.طلاق` / `.divorce`. |
| `commands/love.js` | Implements `.حب` / `.love`. |
| `commands/khotba.js` | Implements `.خطبة` / `.khotba`. |
| `commands/kizb.js` | Implements `.كذب` / `.kizb`. |
| `commands/README.md` | Documents command names, the module interface, and how the registry connects commands to `bot.js`. |
| `dataManager.js` | Reads and writes group state as JSON under `data/` (attendance, greetings, warnings, bans, admins, and pending members). |
| `data/attendance.json` | Daily attendance and member presence. |
| `data/greetings.json` | Per-group welcome message templates. |
| `data/warnings.json` | Member warning counts and records. |
| `data/warningKeywords.json` | Group and global keyword moderation settings. |
| `data/banned.json` | Group ban records. |
| `data/excluded.json` | Members excluded from attendance tracking. |
| `data/admins.json` / `data/globalAdmins.json` | Group-level and global admin records. |
| `data/serverInfo.json` | Optional server details saved per group. |
| `data/warExtreme.json` / `data/banCount.json` | Group mode state and ban counters. |
| `data/pendingMembers.json` | Pending group-member approval records. |
| `tests/` | Offline tests for data handling, group-event behavior, and command registration. Tests do not log in to Messenger. |
| `scripts/post-merge.sh` | Runs local tests and JavaScript syntax checks after a merge. It currently does not install dependencies because the package security firewall blocks the existing dependency tree. |
| `fix-appstate.js` | Validates and creates a normalized copy; it only replaces the original when explicitly passed `--replace`, after preserving a backup. |
| `login-with-credentials.js` | Compatibility helper that validates cookie JSON without asking for an account password. |
| `HOW_TO_GET_APPSTATE.md` | Explains the JSON session-file format and safe handling. |
| `fca-config.json` | Legacy client configuration file; the current runtime does not reference it. |
| `offlineMessages.json` | Legacy JSON file; the current runtime does not reference it. |
| `pendingMembers.json` | Legacy root-level file; active pending-member state is stored under `data/` by `dataManager.js`. |
| `.upm/store.json` | Replit-managed package metadata; normally generated by the environment. |

### How commands connect

The existing group-capable Messenger client is declared as a dependency in `package.json` and loaded by `initializeBot()` in `bot.js`. It receives the parsed cookie array from `appstateManager.js`, supplies the `api` object and group events, and returns refreshed cookie data that is saved back as JSON. `bot.js` parses the command after the dot, asks `commands/registry.js` for the matching module, and passes the API, event, sender, group, data manager, and message sender into that module's `execute()` function. Command files do not create a separate login or session.

`appstate.json` is expected to contain a non-empty JSON array of cookies. The reader also accepts an object with an `appState` or `cookies` array and normalizes common browser fields (`name` to `key`, `expirationDate` to `expires`, and `httpOnly` to `httponly`) while preserving other fields. Invalid JSON or incomplete cookie entries stop startup with a generic error; cookie contents are never written to logs. Session saves use an atomic temporary file with restrictive permissions.

The five modular commands are `.زواج`, `.طلاق`, `.حب`, `.خطبة`, and `.كذب`. They use a profile thumbnail returned by the Messenger client when available. Image rendering is optional: if the `canvas` package or an avatar is unavailable, the command sends its text fallback. `canvas` is not currently declared in `package.json`, so generated image cards are not enabled by the current dependency manifest.

JSON and lock files do not support comments. Their purpose is documented here instead of inserting text that would make them invalid.

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
