"""handlers/warns.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from .utils import is_admin, resolve_target
from database import (get_chat_settings, update_chat_setting,
                      add_warn, get_warns, reset_warns, remove_one_warn)
from locales import get_string


def _lang(chat_id):
    return get_chat_settings(chat_id).get("language", "en")


async def warn_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    uid, mention = await resolve_target(update, ctx)
    if not uid:
        await update.message.reply_text(get_string(_lang(chat_id), "reply_required")); return

    settings = get_chat_settings(chat_id)
    lang   = settings.get("language", "en")
    limit  = settings.get("warn_limit", 3)
    mode   = settings.get("warn_mode", "ban")
    count  = add_warn(chat_id, uid)

    if count >= limit:
        reset_warns(chat_id, uid)
        action_text = ""
        if mode == "ban":
            await update.effective_chat.ban_member(uid)
            action_text = get_string(lang, "warn_banned", user=mention)
        elif mode == "kick":
            await update.effective_chat.ban_member(uid)
            await update.effective_chat.unban_member(uid)
            action_text = f"👢 {mention} was kicked after reaching the warn limit."
        elif mode == "mute":
            from telegram import ChatPermissions
            await update.effective_chat.restrict_member(
                uid, ChatPermissions(can_send_messages=False)
            )
            action_text = f"🔇 {mention} was muted after reaching the warn limit."
        await update.message.reply_text(action_text, parse_mode=ParseMode.HTML)
    else:
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Remove Warn", callback_data=f"warns_remove_{uid}")
        ]])
        await update.message.reply_text(
            get_string(lang, "warn_given", user=mention, count=count, limit=limit),
            parse_mode=ParseMode.HTML,
            reply_markup=kb
        )


async def unwarn_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    new_count = remove_one_warn(chat_id, uid)
    await update.message.reply_text(
        f"✅ Removed one warn from {mention}. Now at {new_count} warns.",
        parse_mode=ParseMode.HTML
    )


async def warns_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    uid, mention = await resolve_target(update, ctx)
    if not uid:
        uid     = update.effective_user.id
        mention = update.effective_user.mention_html()
    count   = get_warns(chat_id, uid)
    limit   = get_chat_settings(chat_id).get("warn_limit", 3)
    await update.message.reply_text(
        f"⚠️ {mention} has <b>{count}/{limit}</b> warnings.",
        parse_mode=ParseMode.HTML
    )


async def reset_warns_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    reset_warns(chat_id, uid)
    await update.message.reply_text(
        f"✅ Reset all warnings for {mention}.", parse_mode=ParseMode.HTML
    )


async def warn_limit_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args:
        limit = get_chat_settings(chat_id).get("warn_limit", 3)
        await update.message.reply_text(f"Current warn limit: *{limit}*", parse_mode="Markdown"); return
    try:
        limit = max(1, int(ctx.args[0]))
    except ValueError:
        await update.message.reply_text("Usage: /warnlimit [number]"); return
    update_chat_setting(chat_id, "warn_limit", limit)
    await update.message.reply_text(f"✅ Warn limit set to *{limit}*.", parse_mode="Markdown")


async def warn_mode_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args or ctx.args[0] not in ("ban", "kick", "mute"):
        await update.message.reply_text("Usage: /warnmode [ban|kick|mute]"); return
    update_chat_setting(chat_id, "warn_mode", ctx.args[0])
    await update.message.reply_text(
        f"✅ Warn mode set to *{ctx.args[0]}*.", parse_mode="Markdown"
    )


async def warns_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if not await is_admin(update, ctx):
        await query.answer("Admins only.", show_alert=True); return
    data = query.data
    if data.startswith("warns_remove_"):
        uid     = int(data.replace("warns_remove_", ""))
        chat_id = update.effective_chat.id
        remove_one_warn(chat_id, uid)
        await query.answer("✅ Warn removed.", show_alert=True)
        await query.edit_message_reply_markup(reply_markup=None)
