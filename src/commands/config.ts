import { Command } from './';

const configCommand: Command = {
	name: 'config',
	description: 'Change configuration for this guild.',
	usage: '<allow-bots | prefix | rules> <...other args>',
	guildOnly: true,
	async execute({ args, message, repository, settings }) {
		const configKey = args[0] ?? 'Nothing';
		if (!['allow-bots', 'prefix', 'rules'].includes(configKey))
			return message.reply(`\`${configKey}\` isn't a valid option. Try \`allow-bots\`, \`prefix\`, or \`rules\`.`);

		if (configKey === 'allow-bots') {
			if (args[1] !== 'true' && args[1] !== 'false')
				return message.channel.send('❌ The valid options for `allow-bots` are `true` and `false`.');
			await repository.update(settings, { allowBots: args[1] === 'true' });
			return message.channel.send(`✅ Updated \`allow-bots\` to \`${args[1] === 'true'}\`.`);
		} else if (configKey === 'prefix') {
			if (!args[1]) return message.channel.send('❌ You must provide a new prefix <= 3 characters.');
			if (args[1].length > 3) return message.channel.send('❌ Prefixes may only be up to three characters.');
			await repository.update(settings, { prefix: args[1] });
			return message.reply(`✅ Updated \`prefix\` to \`${args[1]}\``);
		} else if (configKey === 'rules') {
			if (args[1] === 'list') {
				if (!settings.rules.length) return message.reply('There are no rules for this guild.');
				return message.reply(`\`\`\`${settings.rules.join('\n').replace(/:/g, ' ')}\`\`\``);
			} else if (args[1] === 'add') {
				if (args[2] !== 'not' && args[2] !== 'is') return message.reply('Rules may be either `not` or `is`.');
				const id = message.mentions.channels.first()?.id ?? args[3];
				if (!/^\d{17,19}$/.test(id)) return message.reply('The provided channel is not valid.');

				const rules = settings.rules.concat(`${args[2]}:${id}`);
				await repository.update(settings, { rules: rules });
				return message.reply(`added \`${args[2]}\` rule.`);
			}
		}
	},
};

export default configCommand;
