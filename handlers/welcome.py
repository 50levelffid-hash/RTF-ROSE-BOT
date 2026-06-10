"""handlers/welcome.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ChatPermissions
from telegram.ext import ContextTypes, ChatMemberHandler
from telegram.constants import ParseMode
from .utils import is_admin
from database import get_chat_settings, update_chat_setting


def _format_welcome(template: str, user, chat) -> str:
    return (template
            .replace("{first}", user.first_name or "")
            .replace("{last}",  user.last_name  or "")
            .replace("{fullname}", user.full_name or "")
            .replace("{username}", f"@{user.username}" if user.username else user.first_name)
            .replace("{mention}", user.mention_html())
            .replace("{chatname}", chat.title or ""))


async def track_member(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    result = update.chat_member
    if not result:
        return
    chat    = result.chat
    user    = result.new_chat_member.user
    old_st  = result.old_chat_member.status
    new_st  = result.new_chat_member.status

    settings = get_chat_settings(chat.id)
    lang     = settings.get("language", "en")

    # Joined
    if old_st in ("left", "kicked") and new_st in ("member", "restricted"):
        msg_tpl = settings.get("welcome_msg") or "👋 Welcome, {mention}! Please read the /rules."
        text    = _format_welcome(msg_tpl, user, chat)

        # Welcome mute
        if settings.get("welcome_mute"):
            await chat.restrict_member(user.id, ChatPermissions(can_send_messages=False))
            kb = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ I agree – Unmute me", callback_data=f"welcome_unmute_{user.id}")
            ]])
            await ctx.bot.send_message(chat.id, text, parse_mode=ParseMode.HTML, reply_markup=kb)
        else:
            await ctx.bot.send_message(chat.id, text, parse_mode=ParseMode.HTML)

    # Left
    elif new_st in ("left", "kicked") and old_st in ("member", "restricted", "administrator"):
        msg_tpl = settings.get("goodbye_msg") or "👋 Goodbye, {mention}!"
        text    = _format_welcome(msg_tpl, user, chat)
        await ctx.bot.send_message(chat.id, text, parse_mode=ParseMode.HTML)


async def welcome_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id  = update.effective_chat.id
    settings = get_chat_settings(chat_id)
    msg      = settings.get("welcome_msg") or "(default)"
    muted    = "on" if settings.get("welcome_mute") else "off"
    clean    = "on" if settings.get("clean_welcome") else "off"
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("✏️ Edit Welcome", callback_data="welcome_edit")],
        [InlineKeyboardButton("🔄 Reset",         callback_data="welcome_reset")],
    ])
    await update.message.reply_text(
        f"👋 *Welcome settings*\n\nMessage:\n`{msg}`\n\n"
        f"Welcome Mute: *{muted}*\nClean Welcome: *{clean}*",
        parse_mode="Markdown", reply_markup=kb
    )


async def set_welcome(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if not ctx.args:
        await update.message.reply_text(
            "Usage: /setwelcome [message]\n\n"
            "Variables: {first} {last} {fullname} {username} {mention} {chatname}"
        ); return
    update_chat_setting(update.effective_chat.id, "welcome_msg", " ".join(ctx.args))
    await update.message.reply_text("✅ Welcome message updated.")


async def reset_welcome(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    update_chat_setting(update.effective_chat.id, "welcome_msg", "")
    await update.message.reply_text("✅ Welcome message reset to default.")


async def goodbye_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id  = update.effective_chat.id
    settings = get_chat_settings(chat_id)
    msg      = settings.get("goodbye_msg") or "(default)"
    await update.message.reply_text(
        f"👋 *Goodbye message:*\n\n`{msg}`", parse_mode="Markdown"
    )


async def set_goodbye(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if not ctx.args:
        await update.message.reply_text("Usage: /setgoodbye [message]"); return
    update_chat_setting(update.effective_chat.id, "goodbye_msg", " ".join(ctx.args))
    await update.message.reply_text("✅ Goodbye message updated.")


async def reset_goodbye(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    update_chat_setting(update.effective_chat.id, "goodbye_msg", "")
    await update.message.reply_text("✅ Goodbye message reset.")


async def clean_welcome(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if not ctx.args or ctx.args[0] not in ("on", "off"):
        await update.message.reply_text("Usage: /cleanwelcome [on|off]"); return
    val = 1 if ctx.args[0] == "on" else 0
    update_chat_setting(update.effective_chat.id, "clean_welcome", val)
    await update.message.reply_text(f"✅ Clean welcome set to *{ctx.args[0]}*.",
                                    parse_mode="Markdown")


async def welcome_mute(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if not ctx.args or ctx.args[0] not in ("on", "off"):
        await update.message.reply_text("Usage: /welcomemute [on|off]"); return
    val = 1 if ctx.args[0] == "on" else 0
    update_chat_setting(update.effective_chat.id, "welcome_mute", val)
    await update.message.reply_text(f"✅ Welcome mute set to *{ctx.args[0]}*.",
                                    parse_mode="Markdown")


async def welcome_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query   = update.callback_query
    chat_id = update.effective_chat.id
    data    = query.data

    if data.startswith("welcome_unmute_"):
        uid = int(data.replace("welcome_unmute_", ""))
        # Only the user themselves can press it
        if update.effective_user.id != uid:
            await query.answer("This button is not for you.", show_alert=True); return
        await update.effective_chat.restrict_member(
            uid,
            ChatPermissions(
                can_send_messages=True, can_send_media_messages=True,
                can_send_polls=True, can_send_other_messages=True,
                can_add_web_page_previews=True
            )
        )
        await query.answer("✅ You have been unmuted! Welcome!", show_alert=True)
        await query.edit_message_reply_markup(reply_markup=None)

    elif data == "welcome_reset":
        if not await is_admin(update, ctx):
            await query.answer("Admins only.", show_alert=True); return
        update_chat_setting(chat_id, "welcome_msg", "")
        await query.answer("✅ Reset.", show_alert=True)

    elif data == "welcome_edit":
        await query.answer()
        await query.message.reply_text(
            "Send /setwelcome [your message] to update the welcome text.\n\n"
            "Variables: `{first}` `{last}` `{fullname}` `{username}` `{mention}` `{chatname}`",
            parse_mode="Markdown"
        )
