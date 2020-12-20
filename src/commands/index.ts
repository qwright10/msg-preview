import { Message } from 'discord.js';
import { Repository } from 'typeorm';
import Settings from '../struct/Settings';

import Config from './config';
import Help from './help';
import Ping from './ping';
import Stats from './stats';

export default [Config, Help, Ping, Stats];

interface CommandContext {
	args: string[];
	message: Message;
	repository: Repository<Settings>;
	settings: Settings;
}

export interface Command {
	/**
	 * The ID of the command. Used to index the command in `commands` map.
	 */
	name: string;

	/**
	 * A short description of what the command does.
	 */
	description: string;

	/**
	 * Usage patten for this command; null if it accepts no arguments.
	 */
	usage: string | null;

	/**
	 * Whether this command should only be allowed to run in guilds.
	 */
	guildOnly: boolean;

	/**
	 * The command "logic". `this` is bound to the commands map.
	 */
	execute: (this: Map<string, Command>, context: CommandContext) => any;
}
