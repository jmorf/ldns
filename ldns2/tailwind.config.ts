import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					'50': '#fff5ed',
					'100': '#ffe8d4',
					'200': '#ffcca9',
					'300': '#ffa872',
					'400': '#fe7939',
					'500': '#fc4e09',
					'600': '#ed3a09',
					'700': '#c52809',
					'800': '#9c2110',
					'900': '#7d1e11',
					'950': '#440c06',
				}
			}
		},
	},
	plugins: [],
	darkMode: 'class',
};

export default config;
