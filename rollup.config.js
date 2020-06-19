import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

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
      babelHelpers: 'bundled', // for application code
      exclude: 'node_modules/**', // this excludes transpiling node_modules
    }),
  ],
};
