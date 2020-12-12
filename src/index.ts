import { Client, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { createConnection, getRepository } from 'typeorm';
import Settings from './Settings';
import 'dotenv/config';

if (!process.env.DISCORD_TOKEN || !process.env.PG) {
	console.error('Missing environment variables, did you use -r dotenv/config?');
	process.exit(1);
}

const client = new Client({
	messageCacheMaxSize: 10_000,
	presence: { activity: { name: 'for messages', type: 'WATCHING' } },
	ws: {
		intents: ['GUILD_MESSAGES', 'DIRECT_MESSAGES'],
	},
});

const regex = /https:\/\/(?:canary\.)?discord\.com\/channels\/(\d{17,19})\/(\d{17,19})\/(\d{17,19})/;

client.on('message', (message) => {
	void (async () => {
		if (!message.guild) return message.reply('This bot only responds to messages in guilds.');

		const result = regex.exec(message.content);
		if (!result) return;
		const [, guildID, channelID, messageID] = result;

		if (guildID !== message.guild.id) return;
		if (message.guild.channels.cache.get(channelID)?.type === 'text') return;

		const repository = getRepository(Settings);
		let settings = await repository.findOne(message);

		if (!settings) {
			const doc = repository.create({
				id: message.guild.id,
				prefix: 'pr!',
				rules: [],
				allowBots: false,
			});
			settings = await repository.save(doc);
		}

		if (!settings.allowBots && message.author.bot) return;
		for (const rule of settings.rules) {
			const [type, ruleID] = rule.split(' ');
			if (type === 'not' && message.channel.id === ruleID) return;
			if (type === 'is' && message.channel.id !== ruleID) return;
		}

		const msg = await (message.guild.channels.cache.get(channelID) as TextChannel).messages
			.fetch(messageID)
			.catch(() => null);
		if (!msg) return;

		const embed = new MessageEmbed()
			.setAuthor(msg.author.tag, message.author.displayAvatarURL())
			.setDescription(`${msg.content.length} characters long`)
			.addField('Content', msg.content.length > 300 ? msg.content.substring(0, 296).concat('...') : msg.content)
			.addField('Attachments/Embeds', message.attachments.size + message.embeds.length)
			.setFooter('Delete with 🗑️ reaction')
			.setTimestamp(msg.createdTimestamp);
		const sentMsg = await message.channel.send(embed).catch(console.error);
		if (sentMsg)
			void sentMsg
				.awaitReactions(
					(reaction: MessageReaction, user: User) => reaction.emoji.name === '🗑️' && user.id === message.author.id,
					{ max: 1 },
				)
				.then((collected) => {
					if (collected.size) return sentMsg.delete({ reason: 'User requested deletion' });
				});
	})();
});

void (async () => {
	await createConnection({
		type: 'postgres',
		url: process.env.PG,
		entities: [Settings],
		logging: true,
		synchronize: true,
	}).catch((err) => {
		console.error('Failed to connect to pg:', err);
	});

	await client.login();
	console.log('Logged in as:', client.user?.tag ?? 'Unknown#0000');
})();
