"""handlers/rules.py"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from .utils import is_admin
from database import get_chat_settings, update_chat_setting


async def rules_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    chat_id  = update.effective_chat.id
    settings = get_chat_settings(chat_id)
    rules    = settings.get("rules", "")

    if not rules:
        await update.message.reply_text(
            "❌ No rules have been set for this group.\n\nAdmins can use /setrules to add rules."
        ); return

    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ I have read the rules", callback_data="rules_ack")
    ]])
    await update.message.reply_text(
        f"📜 *Group Rules*\n\n{rules}",
        parse_mode="Markdown",
        reply_markup=kb
    )


async def set_rules(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    if not ctx.args:
        await update.message.reply_text("Usage: /setrules [rules text]"); return
    rules = " ".join(ctx.args)
    update_chat_setting(update.effective_chat.id, "rules", rules)
    await update.message.reply_text("✅ Rules updated.")


async def clear_rules(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not await is_admin(update, ctx): return
    update_chat_setting(update.effective_chat.id, "rules", "")
    await update.message.reply_text("✅ Rules cleared.")


async def rules_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data  = query.data

    if data == "rules_ack":
        await query.answer("✅ Thanks for reading the rules!", show_alert=True)

    elif data == "rules_show":
        chat_id  = update.effective_chat.id
        settings = get_chat_settings(chat_id)
        rules    = settings.get("rules", "")
        if rules:
            kb = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ I have read the rules", callback_data="rules_ack")
            ]])
            await query.edit_message_text(
                f"📜 *Group Rules*\n\n{rules}",
                parse_mode="Markdown",
                reply_markup=kb
            )
        else:
            await query.answer("No rules set for this group.", show_alert=True)
