"""handlers/settings.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from .utils import is_admin
from database import get_chat_settings, update_chat_setting
from locales import LANGUAGE_NAMES


def _settings_kb(settings: dict) -> InlineKeyboardMarkup:
    lang       = settings.get("language", "en")
    lang_name  = LANGUAGE_NAMES.get(lang, lang)
    wm_status  = "✅" if settings.get("welcome_mute")  else "❌"
    cw_status  = "✅" if settings.get("clean_welcome") else "❌"
    warn_limit = settings.get("warn_limit", 3)
    warn_mode  = settings.get("warn_mode", "ban")

    return InlineKeyboardMarkup([
        [InlineKeyboardButton(f"🌐 Language: {lang_name}", callback_data="lang_menu")],
        [
            InlineKeyboardButton(f"Welcome Mute: {wm_status}", callback_data="settings_toggle_welcome_mute"),
            InlineKeyboardButton(f"Clean Welcome: {cw_status}", callback_data="settings_toggle_clean_welcome"),
        ],
        [
            InlineKeyboardButton(f"⚠️ Warn Limit: {warn_limit}", callback_data="settings_warn_limit"),
            InlineKeyboardButton(f"🔨 Warn Mode: {warn_mode}",  callback_data="settings_warn_mode"),
        ],
        [InlineKeyboardButton("📜 View Rules", callback_data="rules_show")],
        [InlineKeyboardButton("🔒 Privacy Policy", callback_data="privacy_show")],
    ])


async def settings_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id  = update.effective_chat.id
    settings = get_chat_settings(chat_id)
    await update.message.reply_text(
        "⚙️ *Group Settings*\n\nTap a button to change settings:",
        parse_mode="Markdown",
        reply_markup=_settings_kb(settings)
    )


async def settings_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query   = update.callback_query
    chat_id = update.effective_chat.id
    data    = query.data

    if not await is_admin(update, ctx):
        await query.answer("Admins only.", show_alert=True); return

    if data == "settings_main":
        settings = get_chat_settings(chat_id)
        await query.edit_message_text(
            "⚙️ *Group Settings*\n\nTap a button to change settings:",
            parse_mode="Markdown",
            reply_markup=_settings_kb(settings)
        )
        await query.answer()
        return

    if data == "settings_toggle_welcome_mute":
        s   = get_chat_settings(chat_id)
        new = 0 if s.get("welcome_mute") else 1
        update_chat_setting(chat_id, "welcome_mute", new)
        await query.answer(f"Welcome Mute {'enabled' if new else 'disabled'}.")

    elif data == "settings_toggle_clean_welcome":
        s   = get_chat_settings(chat_id)
        new = 0 if s.get("clean_welcome") else 1
        update_chat_setting(chat_id, "clean_welcome", new)
        await query.answer(f"Clean Welcome {'enabled' if new else 'disabled'}.")

    elif data == "settings_warn_limit":
        s     = get_chat_settings(chat_id)
        limit = s.get("warn_limit", 3)
        new   = 3 if limit >= 10 else limit + 1
        update_chat_setting(chat_id, "warn_limit", new)
        await query.answer(f"Warn limit set to {new}.")

    elif data == "settings_warn_mode":
        s    = get_chat_settings(chat_id)
        mode = s.get("warn_mode", "ban")
        modes = ["ban", "kick", "mute"]
        new  = modes[(modes.index(mode) + 1) % len(modes)]
        update_chat_setting(chat_id, "warn_mode", new)
        await query.answer(f"Warn mode set to {new}.")

    # Refresh the keyboard
    settings = get_chat_settings(chat_id)
    try:
        await query.edit_message_reply_markup(_settings_kb(settings))
    except Exception:
        pass
