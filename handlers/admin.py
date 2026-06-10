"""handlers/admin.py"""

from telegram import Update, ChatPermissions
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from .utils import is_admin, resolve_target
from database import get_chat_settings


async def promote_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    try:
        await update.effective_chat.promote_member(
            uid,
            can_delete_messages=True,
            can_restrict_members=True,
            can_pin_messages=True,
            can_invite_users=True,
        )
        await update.message.reply_text(
            f"👮 {mention} has been promoted to admin.", parse_mode=ParseMode.HTML
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Failed to promote: {e}")


async def demote_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid: return
    try:
        await update.effective_chat.promote_member(
            uid,
            can_delete_messages=False,
            can_restrict_members=False,
            can_pin_messages=False,
            can_invite_users=False,
            can_manage_chat=False,
        )
        await update.message.reply_text(
            f"✅ {mention} has been demoted.", parse_mode=ParseMode.HTML
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Failed to demote: {e}")


async def set_title_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    uid, mention = await resolve_target(update, ctx)
    if not uid or not ctx.args:
        await update.message.reply_text("Usage: /title [reply] [title text]"); return
    title = " ".join(ctx.args[1:]) if ctx.args else ""
    if not title:
        await update.message.reply_text("Provide a title text."); return
    try:
        await update.effective_chat.set_administrator_custom_title(uid, title)
        await update.message.reply_text(
            f"✅ Set title *{title}* for {mention}.",
            parse_mode="Markdown"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Failed: {e}")


async def admins_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    admins = await update.effective_chat.get_administrators()
    lines  = []
    for a in admins:
        u    = a.user
        name = u.full_name
        if a.custom_title:
            name += f" [{a.custom_title}]"
        if u.username:
            name += f" @{u.username}"
        emoji = "👑" if a.status == "creator" else "👮"
        lines.append(f"{emoji} {name}")
    text = "👮 *Admins in this chat:*\n\n" + "\n".join(lines)
    await update.message.reply_text(text, parse_mode="Markdown")


async def invite_link_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    try:
        link = await update.effective_chat.export_invite_link()
        await update.message.reply_text(f"🔗 Invite link:\n{link}")
    except Exception as e:
        await update.message.reply_text(f"❌ Failed: {e}")
