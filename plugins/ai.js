const axios = require('axios');

module.exports = {
    cmdName: 'ai',
    desc: 'AI Chatbot පහසුකම',
    async execute(sock, from, msg, { text }) {
        if (!text) return await sock.sendMessage(from, { text: '❌ කරුණාකර ප්‍රශ්නයක් ඇතුළත් කරන්න. (උදා: .ai Hello)' }, { quoted: msg });

        await sock.sendMessage(from, { text: '🤖 සිතමින් පවතියි...' }, { quoted: msg });

        try {
            // Free AI API Endpoint
            const response = await axios.get(`https://api.vyturex.com/ai?query=${encodeURIComponent(text)}`);
            const replyText = response.data.result || response.data.answer || "පිළිතුරක් ලබා ගැනීමට නොහැකි විය.";

            await sock.sendMessage(from, { text: `🧠 *AI Answer:*\n\n${replyText}` }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: '❌ AI සේවාව දැනට අක්‍රියයි.' }, { quoted: msg });
        }
    }
};
