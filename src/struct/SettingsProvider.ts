import Settings from './Settings';
import { Collection } from 'discord.js';
import { getRepository, Repository } from 'typeorm';

export default class SettingsProvider {
	public readonly cache = new Collection<string, Settings>();
	public repository: Repository<Settings> | null = null;

	public async init(): Promise<this> {
		this.repository = getRepository(Settings);
		const items = await this.repository.find();
		for (const item of items) this.cache.set(item.id, item);
		return this;
	}

	public async get(guild: string): Promise<Settings>;
	public async get<K extends keyof Settings>(guild: string, prop: K): Promise<Settings[K]>;
	public async get<K extends keyof Settings>(guild: string, prop?: K): Promise<Settings | Settings[K]> {
		if (!this.repository) throw Error('SettingsProvider not initialized');
		let item = this.cache.get(guild);
		if (!item) {
			let entry = await getRepository(Settings).findOne(guild);
			if (!entry) entry = await this.create(guild);
			this.cache.set(entry.id, entry);
			item = entry;
		}

		return prop ? item[prop] : item;
	}

	public async set<K extends keyof Settings>(guild: string, prop: K, value: Settings[K]): Promise<Settings> {
		if (!this.repository) throw Error('SettingsProvider not initialized');
		let item = this.cache.get(guild);
		if (!item) {
			let entry = await getRepository(Settings).findOne(guild);
			if (!entry) entry = await this.create(guild);
			this.cache.set(entry.id, entry);
			item = entry;
		}

		(item as any)[prop] = value;
		void this.repository.save(item);
		this.cache.set(item.id, item);
		return item;
	}

	public async create(id: string): Promise<Settings> {
		if (!this.repository) throw Error('SettingsProvider not initialized');
		const item = this.repository.create({
			id,
			prefix: 'pr!',
			rules: [],
			allowBots: false,
		});
		await this.repository.save(item);
		return item;
	}
}
