import { Command } from './';
import { MessageEmbed } from 'discord.js';

const helpCommand: Command = {
	name: 'help',
	description: 'Displays command info.',
	usage: '[command]',
	guildOnly: false,
	execute({ message, args, settings }) {
		if (args[0]) {
			const cmd = this.get(args[0]);
			if (!cmd) return message.channel.send('❌ A command with that name was not found.');
			const embed = new MessageEmbed()
				.setAuthor(message.author.tag, message.author.displayAvatarURL())
				.setTitle(`\`${settings.prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ''}\``)
				.setDescription(cmd.description)
				.addField('Guild Only', cmd.guildOnly ? 'Yes' : 'No')
				.setTimestamp();
			return message.channel.send(embed);
		}

		const embed = new MessageEmbed()
			.setAuthor(message.author.tag, message.author.displayAvatarURL())
			.setDescription([...this.values()].map((c) => `> \`${settings.prefix}${c.name}\` — ${c.description}`))
			.setFooter(`Run ${settings.prefix}help <command> for more`)
			.setTimestamp();
		return message.channel.send(embed);
	},
};

export default helpCommand;
