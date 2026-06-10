# 🌹 GalaxyBot — Telegram Group Management Bot

A powerful, feature-rich Telegram group management bot inspired by Rose Bot,
built with Python and `python-telegram-bot` v20.

---

## ✨ Features

| Category        | Commands |
|-----------------|----------|
| 🛡 Moderation   | ban, unban, kick, mute, unmute, tmute, tban, purge, del, pin |
| ⚠️ Warns        | warn, unwarn, warns, resetwarns, warnlimit, warnmode |
| 📌 Notes        | save, get, notes, clear, clearall + #shortcut |
| 🔍 Filters      | filter, stop, stopall, filters |
| 🚫 Blacklist    | blacklist, addblacklist, rmblacklist, blacklistmode |
| 👋 Welcome      | setwelcome, resetwelcome, goodbye, setgoodbye, cleanwelcome, welcomemute |
| 📜 Rules        | rules, setrules, clearrules |
| 👮 Admin        | promote, demote, title, admins, invitelink |
| ℹ️ Info         | id, info, chatinfo |
| 🎲 Fun          | slap, hug, roll, flip, shrug |
| 🌐 Language     | language, setlang |
| ⚙️ Settings     | settings (interactive inline buttons) |
| 🔒 Privacy      | privacypolicy |

---

## 🌐 Supported Languages

| Code | Language          |
|------|-------------------|
| `en` | 🇬🇧 English       |
| `tl` | 🇵🇭 Filipino      |
| `es` | 🇪🇸 Español       |
| `id` | 🇮🇩 Bahasa Indonesia |

Use `/setlang [code]` or tap the 🌐 Language button to switch.

---

## 🚀 Setup

### 1. Get a Bot Token
1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the token you receive

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure
Open `bot.py` and replace:
```python
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
BOT_USERNAME = "YourGalaxyBot"
```

Or set an environment variable:
```bash
export BOT_TOKEN="your_token_here"
python bot.py
```

### 4. Enable Bot Permissions in BotFather
Send `/mybots` → Your bot → Bot Settings → Group Privacy → **Turn off**

This allows the bot to read all messages for filters and blacklist.

### 5. Run
```bash
python bot.py
```

---

## ⚙️ Configuration for Groups

After adding to your group:

| Task | Command |
|------|---------|
| Set language | `/setlang en` |
| Set rules | `/setrules No spam. Be respectful.` |
| Set welcome | `/setwelcome Welcome {mention}!` |
| Set warn limit | `/warnlimit 3` |
| Set warn action | `/warnmode ban` |
| Add filter | `/filter hello Hi there!` |
| Blacklist word | `/addblacklist spam` |

---

## 📝 Welcome Message Variables

| Variable | Replaced With |
|----------|---------------|
| `{first}` | User's first name |
| `{last}` | User's last name |
| `{fullname}` | Full name |
| `{username}` | @username |
| `{mention}` | Clickable mention |
| `{chatname}` | Group name |

---

## 🛡 Safety & Legal

- This bot complies with [Telegram's Terms of Service](https://telegram.org/tos)
- This bot complies with GDPR data principles
- No data is sold or shared with third parties
- Use `/privacypolicy` to view the full policy
- Admins are responsible for lawful use in their groups

---

## 📁 Project Structure

```
telegram_bot/
├── bot.py              # Entry point, registers all handlers
├── database.py         # SQLite persistence layer
├── locales.py          # Multi-language string registry
├── requirements.txt
├── handlers/
│   ├── start.py        # /start, /about, /donate
│   ├── help_cmd.py     # /help with paginated inline buttons
│   ├── language.py     # /language, /setlang
│   ├── settings.py     # /settings interactive panel
│   ├── moderation.py   # ban/kick/mute/purge/pin
│   ├── warns.py        # warn system
│   ├── notes.py        # notes system
│   ├── filters.py      # filters + blacklist + message handler
│   ├── welcome.py      # welcome/goodbye/welcome mute
│   ├── rules.py        # rules management
│   ├── admin.py        # promote/demote/title/admins
│   ├── info.py         # id/info/chatinfo
│   ├── fun.py          # slap/hug/roll/flip/shrug
│   ├── privacy.py      # privacy policy display
│   └── utils.py        # shared helpers (is_admin, resolve_target)
```

---

## 📄 License

MIT License — Free to use, modify, and distribute.
