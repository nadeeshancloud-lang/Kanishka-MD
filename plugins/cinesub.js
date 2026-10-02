const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    cmdName: 'cinesub',
    desc: 'CineSub.lk වෙතින් චිත්‍රපට සෙවීම',
    async execute(sock, from, msg, { text }) {
        if (!text) return await sock.sendMessage(from, { text: '❌ කරුණාකර සෙවිය යුතු චිත්‍රපටයේ නම දෙන්න. (උදා: .cinesub Avatar)' }, { quoted: msg });

        await sock.sendMessage(from, { text: '🔎 CineSub හි සෝදිසි කරමින් පවතියි...' }, { quoted: msg });

        try {
            const searchUrl = `https://cinesub.lk/?s=${encodeURIComponent(text)}`;
            const { data } = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            const $ = cheerio.load(data);
            let results = [];

            $('.result-item, article').each((i, el) => {
                const title = $(el).find('.title a, entry-title a').text().trim();
                const link = $(el).find('.title a, entry-title a').attr('href');
                if (title && link) {
                    results.push(`🎬 *${title}*\n🔗 ${link}\n`);
                }
            });

            if (results.length === 0) {
                return await sock.sendMessage(from, { text: '❌ කිසිදු චිත්‍රපටයක් හමු වූයේ නැත.' }, { quoted: msg });
            }

            const replyMessage = `🍿 *Cinesub Search Results:*\n\n` + results.slice(0, 5).join('\n');
            await sock.sendMessage(from, { text: replyMessage }, { quoted: msg });

        } catch (error) {
            await sock.sendMessage(from, { text: '❌ CineSub ඩේටා ලබා ගැනීමේදී දෝෂයක් සිදු විය.' }, { quoted: msg });
        }
    }
};
