import { Command } from './';

const statsCommand: Command = {
	name: 'stats',
	description: "Gets statistics about this bot's client.",
	usage: null,
	guildOnly: false,
	async execute({ message }) {
		const memory = `Memory:   ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`;
		const guilds = `Guilds:   ${message.client.guilds.cache.size}`;
		const channels = `Channels: ${message.client.channels.cache.size}`;
		const uptime = `Uptime:   ${message.client.uptime}ms`;
		return message.channel.send(`\`\`\`${[memory, guilds, channels, uptime].join('\n')}\`\`\``);
	},
};

export default statsCommand;
