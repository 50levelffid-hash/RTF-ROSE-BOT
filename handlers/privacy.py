"""handlers/privacy.py  –  Privacy Policy & Terms of Service"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

PRIVACY_TEXT = """
🔒 *Privacy Policy & Terms of Service*

*Last updated: 2024*

━━━━━━━━━━━━━━━━━━━━

*1. Data We Collect*
• Telegram user IDs and chat IDs (for functionality only)
• Warning counts and note content you explicitly save
• Language preferences and group settings

*2. How We Use Your Data*
• To provide group moderation features
• To remember settings across bot restarts
• Data is never sold or shared with third parties

*3. Data Storage*
• All data is stored locally on the bot server
• No data is transmitted to external services
• Admins can delete all data with /clearall

*4. User Rights*
• You may request deletion of your data at any time
• Contact the bot admin to exercise your rights
• You may opt out by removing the bot from your group

*5. Legal Compliance*
• This bot complies with Telegram's Terms of Service
• This bot complies with GDPR principles
• This bot does not process data of users under 13

*6. Prohibited Use*
• Spamming or harassment
• Bypassing Telegram's ToS
• Any illegal activities

*7. Disclaimer*
This bot is provided "as is" without warranty. The bot
developer is not liable for any misuse by group admins.

━━━━━━━━━━━━━━━━━━━━

By using this bot, you agree to these terms.
"""

SAFETY_TEXT = """
🛡 *Safety & Legal Guidelines*

*For Group Admins:*

✅ *Allowed*
• Moderating spam, scams, and off-topic content
• Enforcing your group's own rules
• Muting/banning users who violate rules

❌ *Not Allowed*
• Targeting users based on race, gender, religion, etc.
• Banning users without valid reason
• Harassment or stalking campaigns
• Using the bot to facilitate illegal activities

*Reporting Abuse*
If this bot is being used to harass you, please:
1. Block the group
2. Report to Telegram: @SpamBot
3. Contact the bot developer

*Emergency*
If you are in danger, contact your local emergency services.
"""


def _privacy_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🛡 Safety & Legal", callback_data="privacy_safety"),
            InlineKeyboardButton("📋 Terms",           callback_data="privacy_terms"),
        ],
        [InlineKeyboardButton("🔙 Back", callback_data="start_back")],
    ])


async def privacy_command(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        PRIVACY_TEXT,
        parse_mode="Markdown",
        reply_markup=_privacy_kb()
    )


async def privacy_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data  = query.data

    if data == "privacy_show":
        await query.edit_message_text(
            PRIVACY_TEXT, parse_mode="Markdown", reply_markup=_privacy_kb()
        )
    elif data == "privacy_safety":
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("🔙 Back to Privacy", callback_data="privacy_show")
        ]])
        await query.edit_message_text(
            SAFETY_TEXT, parse_mode="Markdown", reply_markup=kb
        )
    elif data == "privacy_terms":
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("🔙 Back to Privacy", callback_data="privacy_show")
        ]])
        await query.edit_message_text(
            PRIVACY_TEXT, parse_mode="Markdown", reply_markup=kb
        )
