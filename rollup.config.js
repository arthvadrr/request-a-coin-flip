import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import terser from '@rollup/plugin-terser';
import sass from 'sass';

export default {
	input: 'src/js/main.js',
	output: {
		file: 'public/build/main.min.js',
		format: 'iife',
		sourcemap: true,
	},
	plugins: [
		resolve(),
		scss({
			input: 'src/styles/main.scss',
			output: 'public/build/main.min.css',
			outputStyle: 'compressed',
			includePaths: ['src/styles'],
			runtime: sass,
		}),
		terser(),
	],
};
