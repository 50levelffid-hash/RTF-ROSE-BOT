"""handlers/start.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from locales import get_string, LANGUAGE_NAMES
from database import get_chat_settings, init_db

init_db()

BOT_USERNAME = "Galaxy_accBot"  # change to your bot's username


def _main_menu(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📚 Help",        callback_data="help_main"),
            InlineKeyboardButton("🌐 Language",    callback_data="lang_menu"),
        ],
        [
            InlineKeyboardButton("⚙️ Settings",    callback_data="settings_main"),
            InlineKeyboardButton("📜 Rules",       callback_data="rules_show"),
        ],
        [
            InlineKeyboardButton("🔒 Privacy Policy", callback_data="privacy_show"),
            InlineKeyboardButton("💝 Donate",      callback_data="start_donate"),
        ],
        [
            InlineKeyboardButton(
                "➕ Add me to your group",
                url=f"https://t.me/{BOT_USERNAME}?startgroup=true"
            )
        ],
    ])


async def start_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    user    = update.effective_user
    lang    = get_chat_settings(chat_id).get("language", "en")

    text = get_string(lang, "start_msg", name=user.first_name)
    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        reply_markup=_main_menu(lang)
    )


async def about_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = (
        "🌹 *GalaxyBot*\n\n"
        "A feature-rich Telegram group management bot.\n\n"
        "• Multi-language support\n"
        "• Moderation (ban, kick, mute, warns)\n"
        "• Notes & Filters\n"
        "• Welcome & Goodbye messages\n"
        "• Rules management\n"
        "• Blacklist & Anti-spam\n\n"
        "Built with Python & python-telegram-bot v20.\n\n"
        "_This bot follows all Telegram ToS and applicable laws._"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def donate_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = (
        "💝 *Support GalaxyBot*\n\n"
        "If you find this bot useful, consider supporting its development!\n\n"
        "Your support helps keep the servers running and enables new features."
    )
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("❤️ Support", url="https://example.com/donate")
    ]])
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=kb)


async def button_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data  = query.data
    lang  = get_chat_settings(update.effective_chat.id).get("language", "en")

    if data == "start_donate":
        await query.edit_message_text(
            "💝 *Support GalaxyBot*\n\nYour support is appreciated!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔙 Back", callback_data="start_back")
            ]])
        )
    elif data == "start_back":
        text = get_string(lang, "start_msg",
                          name=update.effective_user.first_name)
        await query.edit_message_text(
            text,
            parse_mode="Markdown",
            reply_markup=_main_menu(lang)
        )
