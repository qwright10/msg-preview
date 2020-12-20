import chalk from 'chalk';
import util from 'util';

type LoggerFn = (strings: TemplateStringsArray, ...exprs: any[]) => void;

export default new Proxy<{ [key: string]: LoggerFn }>(
	{},
	{
		get: (_, label: string) => (strings: string[], ...exprs: any[]): void => {
			if (!Array.isArray(strings))
				return void process.stderr.write(chalk.redBright('.write may only be invoked by a tagged template'));
			if (label) label = chalk.bold(chalk.blueBright(chalk.underline(`[${label}]`).concat(':'))).concat(' ');

			const highlightTypes = (exprs: any[]) =>
				exprs.map((expr) => {
					let value = '';
					if (typeof expr === 'number') value = chalk.yellow(expr.toString());
					else if (typeof expr === 'boolean') value = (expr ? chalk.greenBright : chalk.redBright)(String(expr));
					else if (expr instanceof Error) value = chalk.redBright(`${expr.stack ? `\n${expr.stack}` : expr.message}`);
					else if (expr instanceof Date) value = chalk.green(expr.toLocaleString());
					else if (typeof expr === 'object') value = util.inspect(expr, { depth: 2 });
					else if (typeof expr === 'bigint') value = `${chalk.yellow(expr.toString())}${chalk.blue('n')}`;
					else if (typeof expr === 'string') value = chalk.yellow(expr);
					else value = String(expr);
					return value;
				});

			let highlightedStr = strings[0];
			const highlighted = highlightTypes(exprs);
			for (let i = 0; i < highlighted.length; i++) highlightedStr += `${highlighted[i]}${strings[i + 1]}`;

			process.stdout.write(`${label}${highlightedStr}\n`);
		},
	},
);
