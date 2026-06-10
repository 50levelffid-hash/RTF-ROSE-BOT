"""handlers/help_cmd.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

HELP_SECTIONS = {
    "main": {
        "title": "📚 *GalaxyBot Help — Categories*",
        "text": "Choose a category below to see the available commands:",
        "buttons": [
            [
                InlineKeyboardButton("🛡 Moderation",  callback_data="help_moderation"),
                InlineKeyboardButton("⚠️ Warns",       callback_data="help_warns"),
            ],
            [
                InlineKeyboardButton("📌 Notes",       callback_data="help_notes"),
                InlineKeyboardButton("🔍 Filters",     callback_data="help_filters"),
            ],
            [
                InlineKeyboardButton("👋 Welcome",     callback_data="help_welcome"),
                InlineKeyboardButton("📜 Rules",       callback_data="help_rules"),
            ],
            [
                InlineKeyboardButton("🚫 Blacklist",   callback_data="help_blacklist"),
                InlineKeyboardButton("🎲 Fun",         callback_data="help_fun"),
            ],
            [
                InlineKeyboardButton("👮 Admin",       callback_data="help_admin"),
                InlineKeyboardButton("ℹ️ Info",        callback_data="help_info"),
            ],
        ],
    },
    "moderation": {
        "title": "🛡 *Moderation Commands*",
        "text": (
            "/ban `[reply/username]` — Ban a user\n"
            "/unban `[reply/username]` — Unban a user\n"
            "/kick `[reply/username]` — Kick a user\n"
            "/mute `[reply/username]` — Mute a user\n"
            "/unmute `[reply/username]` — Unmute a user\n"
            "/tmute `[reply/username] [time]` — Temp mute (e.g. 1h, 30m)\n"
            "/tban `[reply/username] [time]` — Temp ban\n"
            "/purge `[n]` — Delete the last n messages\n"
            "/del — Delete a replied message\n"
            "/pin — Pin a replied message\n"
            "/unpin — Unpin current pinned message\n"
            "/unpinall — Unpin all messages"
        ),
    },
    "warns": {
        "title": "⚠️ *Warn Commands*",
        "text": (
            "/warn `[reply/username]` — Warn a user\n"
            "/unwarn `[reply/username]` — Remove one warn\n"
            "/warns `[reply/username]` — Show warns\n"
            "/resetwarns `[reply/username]` — Reset all warns\n"
            "/warnlimit `[n]` — Set warn limit (default 3)\n"
            "/warnmode `[ban/kick/mute]` — Action when limit hit"
        ),
    },
    "notes": {
        "title": "📌 *Notes Commands*",
        "text": (
            "/save `[name] [content]` — Save a note\n"
            "/get `[name]` — Get a saved note\n"
            "/notes — List all notes\n"
            "/clear `[name]` — Delete a note\n"
            "/clearall — Delete all notes\n\n"
            "You can also use `#notename` to retrieve notes."
        ),
    },
    "filters": {
        "title": "🔍 *Filter Commands*",
        "text": (
            "/filter `[keyword] [response]` — Add a filter\n"
            "/stop `[keyword]` — Remove a filter\n"
            "/stopall — Remove all filters\n"
            "/filters — List active filters"
        ),
    },
    "welcome": {
        "title": "👋 *Welcome Commands*",
        "text": (
            "/welcome — Show welcome settings\n"
            "/setwelcome `[message]` — Set welcome message\n"
            "/resetwelcome — Reset to default welcome\n"
            "/goodbye — Show goodbye settings\n"
            "/setgoodbye `[message]` — Set goodbye message\n"
            "/resetgoodbye — Reset goodbye message\n"
            "/cleanwelcome `[on/off]` — Delete old welcome messages\n"
            "/welcomemute `[on/off]` — Mute new members until they tap unmute\n\n"
            "*Variables:* `{first}` `{last}` `{fullname}` `{username}` `{mention}` `{chatname}` `{count}`"
        ),
    },
    "rules": {
        "title": "📜 *Rules Commands*",
        "text": (
            "/rules — Show group rules\n"
            "/setrules `[text]` — Set group rules\n"
            "/clearrules — Remove rules"
        ),
    },
    "blacklist": {
        "title": "🚫 *Blacklist Commands*",
        "text": (
            "/blacklist — Show blacklisted words\n"
            "/addblacklist `[word]` — Add a word to blacklist\n"
            "/rmblacklist `[word]` — Remove a word\n"
            "/blacklistmode `[delete/warn/mute/kick/ban]` — Set action"
        ),
    },
    "fun": {
        "title": "🎲 *Fun Commands*",
        "text": (
            "/slap `[reply]` — Slap someone\n"
            "/hug `[reply]` — Hug someone\n"
            "/roll — Roll a dice 🎲\n"
            "/flip — Flip a coin 🪙\n"
            "/shrug — Shrug ¯\\_(ツ)_/¯"
        ),
    },
    "admin": {
        "title": "👮 *Admin Commands*",
        "text": (
            "/promote `[reply/username]` — Promote to admin\n"
            "/demote `[reply/username]` — Demote admin\n"
            "/title `[reply/username] [title]` — Set custom admin title\n"
            "/admins — List all admins\n"
            "/invitelink — Get the group invite link"
        ),
    },
    "info": {
        "title": "ℹ️ *Info Commands*",
        "text": (
            "/id — Show your ID and chat ID\n"
            "/info `[reply/username]` — Show user info\n"
            "/chatinfo — Show chat info\n"
            "/admins — List admin users"
        ),
    },
}


def _build_markup(section: str) -> InlineKeyboardMarkup:
    data = HELP_SECTIONS.get(section, HELP_SECTIONS["main"])
    if section == "main":
        return InlineKeyboardMarkup(data["buttons"])
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("🔙 Back to Help", callback_data="help_main")
    ]])


async def help_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    data = HELP_SECTIONS["main"]
    await update.message.reply_text(
        f"{data['title']}\n\n{data['text']}",
        parse_mode="Markdown",
        reply_markup=_build_markup("main")
    )


async def help_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    section = query.data.replace("help_", "")
    data = HELP_SECTIONS.get(section, HELP_SECTIONS["main"])
    text = f"{data['title']}\n\n{data['text']}"
    await query.edit_message_text(
        text,
        parse_mode="Markdown",
        reply_markup=_build_markup(section)
    )
