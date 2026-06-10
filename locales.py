"""
locales.py  –  Multi-language string registry
Supported: English (en), Filipino/Tagalog (tl), Spanish (es),
           Indonesian (id), Arabic (ar), Hindi (hi)
"""

STRINGS: dict[str, dict[str, str]] = {

    # ── ENGLISH ──────────────────────────────────────────────────
    "en": {
        "start_msg": (
            "👋 *Hello, {name}!*\n\n"
            "I'm *GalaxyBot*, a powerful group management bot.\n\n"
            "Add me to your group and I'll help you keep it clean and organised.\n\n"
            "Use /help to see all available commands."
        ),
        "help_title":   "📚 *GalaxyBot Help*",
        "lang_prompt":  "🌐 *Choose your language:*",
        "lang_set":     "✅ Language set to *English*.",
        "ban_success":  "🚫 {user} has been banned.",
        "unban_success":"✅ {user} has been unbanned.",
        "kick_success": "👢 {user} has been kicked.",
        "mute_success": "🔇 {user} has been muted.",
        "unmute_success":"🔊 {user} has been unmuted.",
        "warn_given":   "⚠️ {user} has been warned. ({count}/{limit})",
        "warn_banned":  "🚫 {user} exceeded the warn limit and was banned.",
        "no_permission":"❌ You don't have permission to do that.",
        "reply_required":"❌ Reply to a user to use this command.",
        "note_saved":   "📌 Note *{name}* saved.",
        "note_not_found":"❌ Note *{name}* not found.",
        "notes_list":   "📋 *Saved notes in this chat:*\n{notes}",
        "rules_header": "📜 *Group Rules*\n\n{rules}",
        "rules_not_set":"❌ No rules have been set for this group.",
        "rules_saved":  "✅ Rules updated.",
        "welcome_msg":  "👋 Welcome, {user}! Please read the /rules.",
        "goodbye_msg":  "👋 Goodbye, {user}! We'll miss you.",
        "privacy_title":"🔒 *Privacy Policy*",
        "settings_title":"⚙️ *Group Settings*",
        "admin_only":   "👮 This command is for admins only.",
        "id_msg":       "🆔 Your ID: `{user_id}`\n📢 Chat ID: `{chat_id}`",
    },

    # ── FILIPINO / TAGALOG ────────────────────────────────────────
    "tl": {
        "start_msg": (
            "👋 *Kumusta, {name}!*\n\n"
            "Ako si *GalaxyBot*, isang makapangyarihang bot para sa pamamahala ng grupo.\n\n"
            "Idagdag mo ako sa iyong grupo at tutulungan kitang panatilihing malinis at maayos ito.\n\n"
            "Gamitin ang /help para makita ang lahat ng mga utos."
        ),
        "help_title":   "📚 *Tulong ng GalaxyBot*",
        "lang_prompt":  "🌐 *Piliin ang iyong wika:*",
        "lang_set":     "✅ Ang wika ay itinakda sa *Filipino*.",
        "ban_success":  "🚫 Si {user} ay na-ban na.",
        "unban_success":"✅ Si {user} ay na-unban na.",
        "kick_success": "👢 Si {user} ay na-kick na.",
        "mute_success": "🔇 Si {user} ay na-mute na.",
        "unmute_success":"🔊 Si {user} ay na-unmute na.",
        "warn_given":   "⚠️ Si {user} ay nabigyan ng babala. ({count}/{limit})",
        "warn_banned":  "🚫 Nalampasan ni {user} ang limitasyon ng babala at siya ay na-ban.",
        "no_permission":"❌ Wala kang pahintulot na gawin iyon.",
        "reply_required":"❌ Mag-reply sa isang user para gamitin ang command na ito.",
        "note_saved":   "📌 Ang tala na *{name}* ay nai-save na.",
        "note_not_found":"❌ Hindi nahanap ang tala na *{name}*.",
        "notes_list":   "📋 *Mga naka-save na tala sa chat na ito:*\n{notes}",
        "rules_header": "📜 *Mga Patakaran ng Grupo*\n\n{rules}",
        "rules_not_set":"❌ Walang patakaran na nakatakda para sa grupong ito.",
        "rules_saved":  "✅ Ang mga patakaran ay na-update na.",
        "welcome_msg":  "👋 Maligayang pagdating, {user}! Basahin ang /rules.",
        "goodbye_msg":  "👋 Paalam, {user}! Mapalad ka.",
        "privacy_title":"🔒 *Patakaran sa Privacy*",
        "settings_title":"⚙️ *Mga Setting ng Grupo*",
        "admin_only":   "👮 Ang command na ito ay para sa mga admin lamang.",
        "id_msg":       "🆔 Ang iyong ID: `{user_id}`\n📢 Chat ID: `{chat_id}`",
    },

    # ── SPANISH ───────────────────────────────────────────────────
    "es": {
        "start_msg": (
            "👋 *¡Hola, {name}!*\n\n"
            "Soy *GalaxyBot*, un potente bot de gestión de grupos.\n\n"
            "Agrégame a tu grupo y te ayudaré a mantenerlo limpio y organizado.\n\n"
            "Usa /help para ver todos los comandos disponibles."
        ),
        "help_title":   "📚 *Ayuda de GalaxyBot*",
        "lang_prompt":  "🌐 *Elige tu idioma:*",
        "lang_set":     "✅ Idioma establecido en *Español*.",
        "ban_success":  "🚫 {user} ha sido baneado.",
        "unban_success":"✅ {user} ha sido desbaneado.",
        "kick_success": "👢 {user} ha sido expulsado.",
        "mute_success": "🔇 {user} ha sido silenciado.",
        "unmute_success":"🔊 {user} ha sido dessilenciado.",
        "warn_given":   "⚠️ {user} ha recibido una advertencia. ({count}/{limit})",
        "warn_banned":  "🚫 {user} superó el límite de advertencias y fue baneado.",
        "no_permission":"❌ No tienes permiso para hacer eso.",
        "reply_required":"❌ Responde a un usuario para usar este comando.",
        "note_saved":   "📌 Nota *{name}* guardada.",
        "note_not_found":"❌ Nota *{name}* no encontrada.",
        "notes_list":   "📋 *Notas guardadas en este chat:*\n{notes}",
        "rules_header": "📜 *Reglas del grupo*\n\n{rules}",
        "rules_not_set":"❌ No se han establecido reglas para este grupo.",
        "rules_saved":  "✅ Reglas actualizadas.",
        "welcome_msg":  "👋 ¡Bienvenido, {user}! Lee las /rules.",
        "goodbye_msg":  "👋 ¡Adiós, {user}! Te echaremos de menos.",
        "privacy_title":"🔒 *Política de Privacidad*",
        "settings_title":"⚙️ *Configuración del grupo*",
        "admin_only":   "👮 Este comando es solo para administradores.",
        "id_msg":       "🆔 Tu ID: `{user_id}`\n📢 ID del chat: `{chat_id}`",
    },

    # ── INDONESIAN ────────────────────────────────────────────────
    "id": {
        "start_msg": (
            "👋 *Halo, {name}!*\n\n"
            "Saya *GalaxyBot*, bot manajemen grup yang canggih.\n\n"
            "Tambahkan saya ke grup Anda dan saya akan membantu menjaganya tetap bersih dan teratur.\n\n"
            "Gunakan /help untuk melihat semua perintah yang tersedia."
        ),
        "help_title":   "📚 *Bantuan GalaxyBot*",
        "lang_prompt":  "🌐 *Pilih bahasa Anda:*",
        "lang_set":     "✅ Bahasa diatur ke *Bahasa Indonesia*.",
        "ban_success":  "🚫 {user} telah dibanned.",
        "unban_success":"✅ {user} telah di-unban.",
        "kick_success": "👢 {user} telah dikick.",
        "mute_success": "🔇 {user} telah dimute.",
        "unmute_success":"🔊 {user} telah di-unmute.",
        "warn_given":   "⚠️ {user} telah diperingatkan. ({count}/{limit})",
        "warn_banned":  "🚫 {user} melebihi batas peringatan dan di-ban.",
        "no_permission":"❌ Anda tidak memiliki izin untuk melakukan itu.",
        "reply_required":"❌ Reply ke pengguna untuk menggunakan perintah ini.",
        "note_saved":   "📌 Catatan *{name}* telah disimpan.",
        "note_not_found":"❌ Catatan *{name}* tidak ditemukan.",
        "notes_list":   "📋 *Catatan tersimpan di obrolan ini:*\n{notes}",
        "rules_header": "📜 *Peraturan Grup*\n\n{rules}",
        "rules_not_set":"❌ Tidak ada peraturan yang ditetapkan untuk grup ini.",
        "rules_saved":  "✅ Peraturan diperbarui.",
        "welcome_msg":  "👋 Selamat datang, {user}! Silakan baca /rules.",
        "goodbye_msg":  "👋 Selamat tinggal, {user}! Kami akan merindukanmu.",
        "privacy_title":"🔒 *Kebijakan Privasi*",
        "settings_title":"⚙️ *Pengaturan Grup*",
        "admin_only":   "👮 Perintah ini hanya untuk admin.",
        "id_msg":       "🆔 ID Anda: `{user_id}`\n📢 ID Chat: `{chat_id}`",
    },
}

LANGUAGE_NAMES = {
    "en": "🇬🇧 English",
    "tl": "🇵🇭 Filipino",
    "es": "🇪🇸 Español",
    "id": "🇮🇩 Bahasa Indonesia",
}


def get_string(lang: str, key: str, **kwargs) -> str:
    """Return a localised string, falling back to English."""
    template = STRINGS.get(lang, STRINGS["en"]).get(key) \
               or STRINGS["en"].get(key, f"[{key}]")
    return template.format(**kwargs) if kwargs else template
