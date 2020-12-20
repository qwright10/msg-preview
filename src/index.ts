import { Client, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { default as Commands, Command } from './commands';
import { createConnection, getRepository } from 'typeorm';
import Settings from './struct/Settings';

import 'dotenv/config';
import SettingsProvider from './struct/SettingsProvider';
import Logger from './struct/Logger';

if (!process.env.DISCORD_TOKEN || !process.env.PG) {
	Logger.ERROR`Missing environment variables, check .env`;
	process.exit(1);
}

const client = new Client({
	messageCacheMaxSize: 10_000,
	presence: { activity: { name: 'for messages', type: 'WATCHING' } },
	partials: ['CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'USER'],
	ws: {
		intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'GUILD_MESSAGE_REACTIONS'],
	},
});

const commands = new Map<string, Command>(Commands.map((c) => [c.name, c]));

const lastEmbeds = new Map<string, number>();
const regex = /https:\/\/(?:canary\.)?discord\.com\/channels\/(\d{17,19})\/(\d{17,19})\/(\d{17,19})/;

const settingsProvider = new SettingsProvider();

const messageURLHandler = async (message: Message, settings: Settings) => {
	const last = lastEmbeds.get(message.channel.id);
	if (last && last - Date.now() < 2_000) return;
	if (!message.guild) return message.reply('This bot only responds to messages in guilds.');

	const result = regex.exec(message.content);
	if (!result) return;
	const [, guildID, channelID, messageID] = result;

	const channel = message.guild.channels.cache.get(channelID);
	if (guildID !== message.guild.id) return;
	if (channel?.type !== 'text') return;

	if (!settings.allowBots && message.author.bot) return;
	for (const rule of settings.rules) {
		const [type, ruleID] = rule.split(' ');
		if (type === 'not' && message.channel.id === ruleID) return Logger.DEBUG`${channelID} failed not case: ${rule}`;
		if (type === 'is' && message.channel.id !== ruleID) return Logger.DEBUG`${channelID} failed is case: ${rule}`;
	}

	const msg = await (channel as TextChannel).messages.fetch(messageID).catch(() => null);
	if (!msg) return Logger.DEBUG`Message ${messageID} not found`;

	const content = msg.content
		? msg.content.length > 300
			? msg.content.substring(0, 296).concat('...')
			: msg.content
		: 'No content';

	const embed = new MessageEmbed()
		.setAuthor(msg.author.tag, msg.author.displayAvatarURL())
		.addField('Content', content, true)
		.setFooter('Delete with 🗑️ reaction')
		.setTimestamp(msg.createdTimestamp);

	if (msg.attachments.size || msg.embeds.length)
		embed.addField('Attachments/Embeds', msg.attachments.size + msg.embeds.length, true);

	const sentMsg = await message.channel.send(embed).catch((err) => Logger.ERROR`${err}`);
	if (sentMsg) {
		const reaction = await sentMsg.react('🗑');
		const filter = async (r: MessageReaction, u: User) => {
			if (r.emoji.name !== '🗑') return false;
			const member = await r.message.guild!.members.fetch(u);
			return u.id === message.author.id || member.hasPermission('MANAGE_MESSAGES') || false;
		};

		sentMsg
			.createReactionCollector(filter, { time: 30_000 })
			.on('collect', () => void sentMsg.delete({ reason: 'User requested deletion' }))
			.on('end', () => void reaction.remove().catch(() => null));
	}
};

const messageHandler = async (message: Message) => {
	if (!message.content) return;
	const repository = getRepository(Settings);
	const settings = await settingsProvider.get(message.guild?.id ?? '0');

	const prefix = settings.prefix;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift()!.toLowerCase();

	if (message.author.bot || !message.content.startsWith(prefix)) return messageURLHandler(message, settings);
	for (const arg of args) if (arg.length > 300) return;

	const cmd = commands.get(command);
	if (!cmd) return messageURLHandler(message, settings);
	if (cmd.guildOnly && !message.guild) return message.channel.send(`❌ \`${command}\` is a guild-only command.`);
	cmd.execute.call(commands, { args, message, repository, settings });
};

client.on('message', (message) => void messageHandler(message));

client.on('ready', () => {
	Logger.LOG`Logged in as: ${client.user?.tag ?? 'Unknown User'}`;
});

void (async () => {
	await createConnection({
		type: 'postgres',
		url: process.env.PG,
		entities: [Settings],
	}).catch((err) => {
		Logger.ERROR`Failed to connect to pg: ${err}`;
		process.exit(1);
	});

	Logger.LOG`Connected to database`;

	await settingsProvider.init();
	Logger.LOG`Settings provider initialized`;

	await client.login();
})();
