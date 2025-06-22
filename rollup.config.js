import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import sass from 'rollup-plugin-sass';
import { string } from 'rollup-plugin-string';

dotenv.config();

export default [
	{
		input: './src/js/main.js',
		context: 'window',
		output: {
			file: './public/build/main.min.js',
			format: 'iife',
			sourcemap: false,
		},
		plugins: [
			string({ include: '**/*.html' }),
			resolve({ browser: true, preferBuiltins: false }),
			commonjs(),
			terser(),
			sass({
				api: 'modern',
				output: './public/build/main.min.css',
				options: { style: 'compressed' },
			}),
			replace({
				preventAssignment: true,
				'process.env.SERVER_URI': JSON.stringify(process.env.SERVER_URI),
				'process.env.ANON_KEY': JSON.stringify(process.env.ANON_KEY),
			}),
		],
	},
];
