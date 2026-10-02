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
const qrcode = require('qrcode-terminal');
const config = require('./settings');

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
    console.log("🚀 Kanishka-MD Pro ආරම්භ වෙමින් පවතී...");
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n👇 පහත QR Code එක WhatsApp මගින් Scan කරන්න:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ Kanishka-MD Pro සාර්ථකව Connect විය!');
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`🔴 Connection එක විසන්ධි විය. Status Code: ${statusCode} Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) startKanishkaBot();
        }
    });

    if (!sock.authState.creds.registered && config.ownerNumber) {
        setTimeout(async () => {
            try {
                if (!sock.authState.creds.registered) {
                    let code = await sock.requestPairingCode(config.ownerNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(`\n==============================================`);
                    console.log(`🔢 ඔයාගේ PAIRING CODE එක: ${code}`);
                    console.log(`(WhatsApp -> Linked Devices -> Link with phone number යොදන්න)`);
                    console.log(`==============================================\n`);
                }
            } catch (err) {
                console.log("Pairing code error:", err.message);
            }
        }, 6000);
    }

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
