"""handlers/moderation.py"""

import datetime
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from .utils import is_admin, resolve_target, parse_time_arg
from database import get_chat_settings
from locales import get_string


def _lang(chat_id):
    return get_chat_settings(chat_id).get("language", "en")


async def ban_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid:
        await update.message.reply_text(get_string(_lang(update.effective_chat.id), "reply_required"))
        return
    await update.effective_chat.ban_member(uid)
    await update.message.reply_text(
        get_string(_lang(update.effective_chat.id), "ban_success", user=mention),
        parse_mode=ParseMode.HTML
    )


async def unban_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    await update.effective_chat.unban_member(uid)
    await update.message.reply_text(
        get_string(_lang(update.effective_chat.id), "unban_success", user=mention),
        parse_mode=ParseMode.HTML
    )


async def kick_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    await update.effective_chat.ban_member(uid)
    await update.effective_chat.unban_member(uid)
    await update.message.reply_text(
        get_string(_lang(update.effective_chat.id), "kick_success", user=mention),
        parse_mode=ParseMode.HTML
    )


async def mute_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    from telegram import ChatPermissions
    await update.effective_chat.restrict_member(
        uid, ChatPermissions(can_send_messages=False)
    )
    await update.message.reply_text(
        get_string(_lang(update.effective_chat.id), "mute_success", user=mention),
        parse_mode=ParseMode.HTML
    )


async def unmute_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    from telegram import ChatPermissions
    await update.effective_chat.restrict_member(
        uid, ChatPermissions(can_send_messages=True, can_send_media_messages=True,
                             can_send_polls=True, can_send_other_messages=True,
                             can_add_web_page_previews=True)
    )
    await update.message.reply_text(
        get_string(_lang(update.effective_chat.id), "unmute_success", user=mention),
        parse_mode=ParseMode.HTML
    )


async def tmute_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    duration = parse_time_arg(ctx.args[-1] if ctx.args else "")
    if not duration:
        await update.message.reply_text("Usage: /tmute [user] [time] e.g. 30m, 2h, 1d"); return
    from telegram import ChatPermissions
    until = datetime.datetime.now() + datetime.timedelta(seconds=duration)
    await update.effective_chat.restrict_member(
        uid, ChatPermissions(can_send_messages=False), until_date=until
    )
    await update.message.reply_text(
        f"🔇 {mention} muted for <code>{ctx.args[-1]}</code>.",
        parse_mode=ParseMode.HTML
    )


async def tban_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    duration = parse_time_arg(ctx.args[-1] if ctx.args else "")
    if not duration:
        await update.message.reply_text("Usage: /tban [user] [time] e.g. 30m, 2h, 1d"); return
    until = datetime.datetime.now() + datetime.timedelta(seconds=duration)
    await update.effective_chat.ban_member(uid, until_date=until)
    await update.message.reply_text(
        f"🚫 {mention} banned for <code>{ctx.args[-1]}</code>.",
        parse_mode=ParseMode.HTML
    )


async def purge_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    n = 10
    if ctx.args:
        try: n = min(int(ctx.args[0]), 100)
        except ValueError: pass
    msg_ids = list(range(
        update.message.message_id - n,
        update.message.message_id + 1
    ))
    try:
        await update.effective_chat.delete_messages(msg_ids)
    except Exception:
        await update.message.reply_text("⚠️ Could not delete all messages (bot may lack permission).")


async def delete_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if update.message.reply_to_message:
        try:
            await update.message.reply_to_message.delete()
            await update.message.delete()
        except Exception:
            await update.message.reply_text("❌ Could not delete the message.")
    else:
        await update.message.reply_text("Reply to a message to delete it.")


async def pin_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if update.message.reply_to_message:
        await update.message.reply_to_message.pin()
    else:
        await update.message.reply_text("Reply to a message to pin it.")


async def unpin_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    await update.effective_chat.unpin_message()


async def unpinall_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    await update.effective_chat.unpin_all_messages()
    await update.message.reply_text("📌 All messages unpinned.")
