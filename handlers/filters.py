"""handlers/filters.py"""

from telegram import Update, ChatPermissions
from telegram.ext import ContextTypes
from .utils import is_admin
from database import (
    add_filter as db_add_filter, get_filters, remove_filter, remove_all_filters,
    add_blacklist_word, get_blacklist, remove_blacklist_word,
    get_blacklist_mode, set_blacklist_mode, get_chat_settings, add_warn, get_warns, reset_warns
)


async def add_filter(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args or len(ctx.args) < 2:
        await update.message.reply_text("Usage: /filter [keyword] [response]"); return
    keyword  = ctx.args[0].lower()
    response = " ".join(ctx.args[1:])
    db_add_filter(chat_id, keyword, response)
    await update.message.reply_text(f"✅ Filter *{keyword}* added.", parse_mode="Markdown")


async def stop_filter(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args:
        await update.message.reply_text("Usage: /stop [keyword]"); return
    keyword = ctx.args[0].lower()
    remove_filter(chat_id, keyword)
    await update.message.reply_text(f"✅ Filter *{keyword}* removed.", parse_mode="Markdown")


async def stop_all_filters(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    remove_all_filters(update.effective_chat.id)
    await update.message.reply_text("✅ All filters removed.")


async def list_filters(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    fs = get_filters(chat_id)
    if not fs:
        await update.message.reply_text("No active filters."); return
    text = "🔍 *Active filters:*\n" + "\n".join(f"• `{f['keyword']}`" for f in fs)
    await update.message.reply_text(text, parse_mode="Markdown")


# ── Blacklist ──────────────────────────────────────────────────────

async def blacklist_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    words   = get_blacklist(chat_id)
    mode    = get_blacklist_mode(chat_id)
    if not words:
        await update.message.reply_text(f"🚫 No blacklisted words.\nMode: *{mode}*",
                                        parse_mode="Markdown"); return
    text = f"🚫 *Blacklisted words* (mode: {mode}):\n" + "\n".join(f"• `{w}`" for w in words)
    await update.message.reply_text(text, parse_mode="Markdown")


async def add_blacklist(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args:
        await update.message.reply_text("Usage: /addblacklist [word]"); return
    for word in ctx.args:
        add_blacklist_word(chat_id, word.lower())
    await update.message.reply_text(
        f"✅ Added {len(ctx.args)} word(s) to blacklist."
    )


async def rm_blacklist(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    if not ctx.args:
        await update.message.reply_text("Usage: /rmblacklist [word]"); return
    remove_blacklist_word(chat_id, ctx.args[0].lower())
    await update.message.reply_text(f"✅ Removed *{ctx.args[0]}* from blacklist.",
                                    parse_mode="Markdown")


async def blacklist_mode(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    chat_id = update.effective_chat.id
    valid   = ("delete", "warn", "mute", "kick", "ban")
    if not ctx.args or ctx.args[0] not in valid:
        mode = get_blacklist_mode(chat_id)
        await update.message.reply_text(
            f"Current blacklist mode: *{mode}*\nUsage: /blacklistmode [{'/'.join(valid)}]",
            parse_mode="Markdown"
        ); return
    set_blacklist_mode(chat_id, ctx.args[0])
    await update.message.reply_text(
        f"✅ Blacklist mode set to *{ctx.args[0]}*.", parse_mode="Markdown"
    )


# ── Message handler (filters + blacklist + #notes) ─────────────────

async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    msg     = update.message
    chat_id = update.effective_chat.id
    if not msg or not msg.text:
        return

    text_lower = msg.text.lower()

    # #note shortcut
    if text_lower.startswith("#"):
        from database import get_note
        note_name = text_lower[1:].split()[0]
        content   = get_note(chat_id, note_name)
        if content:
            await msg.reply_text(f"📌 *{note_name}*\n\n{content}", parse_mode="Markdown")
            return

    # Filters
    for f in get_filters(chat_id):
        if f["keyword"] in text_lower:
            await msg.reply_text(f["response"])
            return

    # Blacklist
    bl_words = get_blacklist(chat_id)
    for word in bl_words:
        if word in text_lower:
            mode = get_blacklist_mode(chat_id)
            try:
                await msg.delete()
            except Exception:
                pass
            uid = msg.from_user.id
            if mode == "warn":
                settings = get_chat_settings(chat_id)
                limit    = settings.get("warn_limit", 3)
                count    = add_warn(chat_id, uid)
                if count >= limit:
                    reset_warns(chat_id, uid)
                    await update.effective_chat.ban_member(uid)
                    await msg.reply_text(
                        f"🚫 {msg.from_user.mention_html()} was banned (blacklist + warn limit).",
                        parse_mode="HTML"
                    )
                else:
                    await msg.reply_text(
                        f"⚠️ {msg.from_user.mention_html()} warned for blacklisted word. ({count}/{limit})",
                        parse_mode="HTML"
                    )
            elif mode == "mute":
                await update.effective_chat.restrict_member(
                    uid, ChatPermissions(can_send_messages=False)
                )
                await msg.reply_text(
                    f"🔇 {msg.from_user.mention_html()} muted for blacklisted word.",
                    parse_mode="HTML"
                )
            elif mode == "kick":
                await update.effective_chat.ban_member(uid)
                await update.effective_chat.unban_member(uid)
            elif mode == "ban":
                await update.effective_chat.ban_member(uid)
                await msg.reply_text(
                    f"🚫 {msg.from_user.mention_html()} banned for blacklisted word.",
                    parse_mode="HTML"
                )
            break
