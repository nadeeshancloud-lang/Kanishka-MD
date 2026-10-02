module.exports = {
    cmdName: 'menu',
    desc: 'බොට්ගේ සියලුම කමාන්ඩ්ස් පෙන්වයි',
    async execute(sock, from, msg, { config }) {
        const menuText = `
*═════ 🛠️ ${config.botName} 🛠️ ═════*

👋 *ආයුබෝවන්!* 

*📌 ප්‍රධාන පහසුකම්:*
  • *${config.PREFIX}ai <ප්‍රශ්නය>* - AI වෙතින් පිළිතුරු ලබාගැනීම
  • *${config.PREFIX}cinesub <නම>* - CineSub චිත්‍රපට සෙවීම
  • *${config.PREFIX}movie <නම>* - Movie විස්තර සෙවීම

*👑 Developer:* ${config.ownerName}
*⚙️ Prefix:* [ ${config.PREFIX} ]
*═════════════════════════*
`;
        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }
};
