import { Command } from './';

const pingCommand: Command = {
	name: 'ping',
	description: 'Gets the latency to the Discord API.',
	usage: null,
	guildOnly: false,
	execute({ message }) {
		return message.channel.send(`🏓 ${message.client.ws.ping}ms`);
	},
};

export default pingCommand;
