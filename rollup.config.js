import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import scss from 'rollup-plugin-scss';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
  },
  plugins: [
    resolve(), // resolve `node_modules` paths
    commonjs(), // convert cjs to ESM (for rollup to convert back to cjs)
    babel({
      babelHelpers: 'bundled', // best option when building an app
      exclude: 'node_modules/**', // this excludes transpiling node_modules
    }),
    scss({
      output: 'dist/bundle.css',
      watch: 'css',
    }),
  ],
};
