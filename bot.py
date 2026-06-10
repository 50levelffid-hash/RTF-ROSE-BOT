#!/usr/bin/env python3
"""
GalaxyBot - A Feature-Rich Telegram Group Management Bot
Inspired by Rose Bot capabilities
"""

import logging
import os
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    filters, ChatMemberHandler
)
from handlers import (
    start, help_cmd, language, settings,
    moderation, filters as filter_handlers,
    notes, warns, welcome, rules,
    privacy, admin, info, fun
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "8282366957:AAHbm5b_YSji4d5LWgnxnD8-Iw4SkpiVmD0")


def main():
    app = Application.builder().token(BOT_TOKEN).build()

    # ── Start & Help ──────────────────────────────────────────────
    app.add_handler(CommandHandler("start",   start.start_command))
    app.add_handler(CommandHandler("help",    help_cmd.help_command))
    app.add_handler(CommandHandler("donate",  start.donate_command))
    app.add_handler(CommandHandler("about",   start.about_command))

    # ── Language ──────────────────────────────────────────────────
    app.add_handler(CommandHandler("language", language.language_command))
    app.add_handler(CommandHandler("setlang",  language.set_language_command))

    # ── Settings ──────────────────────────────────────────────────
    app.add_handler(CommandHandler("settings", settings.settings_command))

    # ── Moderation ───────────────────────────────────────────────
    app.add_handler(CommandHandler("ban",      moderation.ban_command))
    app.add_handler(CommandHandler("unban",    moderation.unban_command))
    app.add_handler(CommandHandler("kick",     moderation.kick_command))
    app.add_handler(CommandHandler("mute",     moderation.mute_command))
    app.add_handler(CommandHandler("unmute",   moderation.unmute_command))
    app.add_handler(CommandHandler("tmute",    moderation.tmute_command))
    app.add_handler(CommandHandler("tban",     moderation.tban_command))
    app.add_handler(CommandHandler("warn",     warns.warn_command))
    app.add_handler(CommandHandler("unwarn",   warns.unwarn_command))
    app.add_handler(CommandHandler("warns",    warns.warns_command))
    app.add_handler(CommandHandler("resetwarns", warns.reset_warns_command))
    app.add_handler(CommandHandler("warnlimit",  warns.warn_limit_command))
    app.add_handler(CommandHandler("warnmode",   warns.warn_mode_command))
    app.add_handler(CommandHandler("purge",    moderation.purge_command))
    app.add_handler(CommandHandler("del",      moderation.delete_command))
    app.add_handler(CommandHandler("pin",      moderation.pin_command))
    app.add_handler(CommandHandler("unpin",    moderation.unpin_command))
    app.add_handler(CommandHandler("unpinall", moderation.unpinall_command))
    app.add_handler(CommandHandler("promote",  admin.promote_command))
    app.add_handler(CommandHandler("demote",   admin.demote_command))
    app.add_handler(CommandHandler("title",    admin.set_title_command))
    app.add_handler(CommandHandler("admins",   admin.admins_command))
    app.add_handler(CommandHandler("invitelink", admin.invite_link_command))

    # ── Filters / Blacklist ───────────────────────────────────────
    app.add_handler(CommandHandler("filter",      filter_handlers.add_filter))
    app.add_handler(CommandHandler("stop",        filter_handlers.stop_filter))
    app.add_handler(CommandHandler("stopall",     filter_handlers.stop_all_filters))
    app.add_handler(CommandHandler("filters",     filter_handlers.list_filters))
    app.add_handler(CommandHandler("blacklist",   filter_handlers.blacklist_command))
    app.add_handler(CommandHandler("addblacklist",filter_handlers.add_blacklist))
    app.add_handler(CommandHandler("rmblacklist", filter_handlers.rm_blacklist))
    app.add_handler(CommandHandler("blacklistmode", filter_handlers.blacklist_mode))

    # ── Notes ─────────────────────────────────────────────────────
    app.add_handler(CommandHandler("save",     notes.save_note))
    app.add_handler(CommandHandler("get",      notes.get_note))
    app.add_handler(CommandHandler("notes",    notes.list_notes))
    app.add_handler(CommandHandler("clear",    notes.clear_note))
    app.add_handler(CommandHandler("clearall", notes.clear_all_notes))
    app.add_handler(CommandHandler("saved",    notes.list_notes))

    # ── Welcome / Goodbye ─────────────────────────────────────────
    app.add_handler(CommandHandler("welcome",      welcome.welcome_command))
    app.add_handler(CommandHandler("setwelcome",   welcome.set_welcome))
    app.add_handler(CommandHandler("resetwelcome", welcome.reset_welcome))
    app.add_handler(CommandHandler("goodbye",      welcome.goodbye_command))
    app.add_handler(CommandHandler("setgoodbye",   welcome.set_goodbye))
    app.add_handler(CommandHandler("resetgoodbye", welcome.reset_goodbye))
    app.add_handler(CommandHandler("cleanwelcome", welcome.clean_welcome))
    app.add_handler(CommandHandler("welcomemute",  welcome.welcome_mute))

    # ── Rules ─────────────────────────────────────────────────────
    app.add_handler(CommandHandler("rules",     rules.rules_command))
    app.add_handler(CommandHandler("setrules",  rules.set_rules))
    app.add_handler(CommandHandler("clearrules",rules.clear_rules))
    app.add_handler(CommandHandler("privacypolicy", privacy.privacy_command))

    # ── Info ──────────────────────────────────────────────────────
    app.add_handler(CommandHandler("id",      info.id_command))
    app.add_handler(CommandHandler("info",    info.info_command))
    app.add_handler(CommandHandler("adminlist", admin.admins_command))
    app.add_handler(CommandHandler("chatinfo", info.chat_info_command))

    # ── Fun ───────────────────────────────────────────────────────
    app.add_handler(CommandHandler("slap",    fun.slap_command))
    app.add_handler(CommandHandler("hug",     fun.hug_command))
    app.add_handler(CommandHandler("roll",    fun.roll_command))
    app.add_handler(CommandHandler("flip",    fun.flip_command))
    app.add_handler(CommandHandler("shrug",   fun.shrug_command))

    # ── Inline Buttons (Callback Queries) ─────────────────────────
    app.add_handler(CallbackQueryHandler(start.button_callback,    pattern="^start_"))
    app.add_handler(CallbackQueryHandler(help_cmd.help_callback,   pattern="^help_"))
    app.add_handler(CallbackQueryHandler(language.lang_callback,   pattern="^lang_"))
    app.add_handler(CallbackQueryHandler(settings.settings_callback, pattern="^settings_"))
    app.add_handler(CallbackQueryHandler(rules.rules_callback,     pattern="^rules_"))
    app.add_handler(CallbackQueryHandler(privacy.privacy_callback, pattern="^privacy_"))
    app.add_handler(CallbackQueryHandler(warns.warns_callback,     pattern="^warns_"))
    app.add_handler(CallbackQueryHandler(welcome.welcome_callback, pattern="^welcome_"))
    app.add_handler(CallbackQueryHandler(notes.notes_callback,     pattern="^notes_"))

    # ── Message Handlers ─────────────────────────────────────────
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        filter_handlers.handle_message
    ))
    app.add_handler(ChatMemberHandler(welcome.track_member, ChatMemberHandler.CHAT_MEMBER))

    logger.info("✅ GalaxyBot is running...")
    app.run_polling(allowed_updates=["message", "callback_query", "chat_member"])


if __name__ == "__main__":
    main()
