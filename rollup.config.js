import { string } from 'rollup-plugin-string';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import sass from 'rollup-plugin-sass';

export default [
	{
		input: './src/js/main.js',
		output: {
			file: './public/build/main.min.js',
			format: 'iife',
			sourcemap: false,
		},
		plugins: [
			string({ include: '**/*.html' }),
			resolve(),
			terser(),
			sass({
				api: 'modern',
				output: './public/build/main.min.css',
				options: { style: 'compressed' },
			}),
		],
	},
];
