const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    getContentType
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('./settings');

// Plugins රෝඩ් කිරීම (Dynamic Plugin Loader)
const commands = new Map();
const pluginsPath = path.join(__dirname, 'plugins');

if (fs.existsSync(pluginsPath)) {
    fs.readdirSync(pluginsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const plugin = require(path.join(pluginsPath, file));
            if (plugin.cmdName) {
                commands.set(plugin.cmdName, plugin);
            }
        }
    });
}

async function startKanishkaBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('සම්බන්ධතාවය බිඳ වැටුණි, නැවත සම්බන්ධ වෙමින්...', shouldReconnect);
            if (shouldReconnect) startKanishkaBot();
        } else if (connection === 'open') {
            console.log('✅ KANISHKA-MD බොට් සාර්ථකව සම්බන්ධ විය!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const typeOfMsg = getContentType(msg.message);
        const body = (typeOfMsg === 'conversation') ? msg.message.conversation :
                     (typeOfMsg === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';

        if (!body.startsWith(config.PREFIX)) return;

        const args = body.slice(config.PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const text = args.join(" ");

        const command = commands.get(commandName);
        if (command) {
            try {
                await command.execute(sock, from, msg, { args, text, config });
            } catch (error) {
                console.error(`Error executing ${commandName}:`, error);
                await sock.sendMessage(from, { text: '⚠️ කමාන්ඩ් එක ක්‍රියාත්මක කිරීමේදී දෝෂයක් සිදු විය.' });
            }
        }
    });
}

startKanishkaBot();
