import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('guild_settings')
export default class Settings {
	@PrimaryColumn({ name: 'id', type: 'varchar', length: 19, unique: true })
	public id!: string;

	@Column({ name: 'prefix', type: 'varchar', length: 3 })
	public prefix!: string;

	@Column({ name: 'rules', type: 'text', array: true })
	public rules!: string[];

	@Column({ name: 'allow_bots', type: 'bool' })
	public allowBots!: boolean;
}
