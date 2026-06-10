"""handlers/utils.py  –  shared helpers"""

from telegram import Update, ChatMember
from telegram.ext import ContextTypes


async def is_admin(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> bool:
    """Return True if the message sender is a chat admin (or the bot owner in PM)."""
    chat = update.effective_chat
    if chat.type == "private":
        return True
    user_id = update.effective_user.id
    member  = await chat.get_member(user_id)
    return member.status in (ChatMember.ADMINISTRATOR, ChatMember.OWNER)


async def resolve_target(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """
    Returns (user_id, mention_html) of the target user.
    Tries: reply > args[0] as @username or user_id.
    Returns (None, None) on failure.
    """
    msg = update.message
    if msg.reply_to_message:
        target = msg.reply_to_message.from_user
        return target.id, target.mention_html()
    if ctx.args:
        arg = ctx.args[0]
        try:
            uid = int(arg)
            return uid, f"<a href='tg://user?id={uid}'>{uid}</a>"
        except ValueError:
            username = arg.lstrip("@")
            try:
                chat_member = await update.effective_chat.get_member_by_username(username) # type: ignore
                u = chat_member.user
                return u.id, u.mention_html()
            except Exception:
                pass
    return None, None


def parse_time_arg(arg: str) -> int | None:
    """Convert '30m', '2h', '1d' → seconds.  Returns None if not parseable."""
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    if not arg:
        return None
    try:
        unit = arg[-1].lower()
        if unit in units:
            return int(arg[:-1]) * units[unit]
    except (ValueError, IndexError):
        pass
    return None
