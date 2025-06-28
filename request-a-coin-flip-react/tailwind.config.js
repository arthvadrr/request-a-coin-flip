/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	safelist: [
		'bg-primary',
		'text-darkbg',
		'hover:bg-accent/80',
		'bg-muted',
		'hover:bg-muted/80',
		'border-accent',
		'text-accent',
		'hover:bg-accent/10',
	],
	theme: {
		extend: {
			colors: {
				primary: '#ff0000',
				darkbg: '#242627',
				accent: '#00FFD0', // AAA contrast on dark
				text: '#F5F6FA', // AAA contrast on dark
				muted: '#A0AEC0', // Muted text
			},
		},
	},
	plugins: [],
};
