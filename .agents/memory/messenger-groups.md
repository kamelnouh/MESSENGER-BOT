---
name: Messenger group support
description: Product constraint for the Messenger bot's group-chat operation and dependency choices.
---

The bot is intended to operate in Messenger group chats. Keep libraries that support its group-chat behavior; do not replace them with official Messenger Page APIs that cannot provide that behavior.

**Why:** the user said the bot works in groups and asked to keep group-capable libraries rather than switch to official Messenger libraries.

**How to apply:** preserve group compatibility when changing Messenger clients or integrations. If a package firewall blocks a dependency, do not bypass the firewall or silently change to a Page-only API; explain the installation and runtime limitation first.
