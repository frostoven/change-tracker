const webpack = require('webpack');

module.exports = (env, argv) => {
  let mode = argv.mode;
  let target = 'node';
  let libraryTarget = 'umd';
  let bundleName = 'index';

  if (argv.mode === 'development') {
    bundleName = 'dev'
  }
  else if (process.env.NODE_OPTIONS === 'force_browser') {
    mode = 'production';
    target = 'web';
    libraryTarget = 'window';
    bundleName = 'browser';
  }

  return {
    mode,
    watch: false,
    target,
    entry: {
      [bundleName]: './src/index.ts',
    },
    output: {
      path: __dirname,
      filename: '[name].js',
      library: 'ChangeTracker',
      libraryExport: 'default',
      libraryTarget,
    },
    module: {
      rules: [
        {
          test: /\.ts?$/,
          loader: 'babel-loader',
          options: {
            compact: false,
            presets: [
              [
                '@babel/preset-typescript', {
                "isTSX": true,
                "allExtensions": true,
              }
              ],
              '@babel/preset-react'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              // All the below needed for very old devices:
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-transform-arrow-functions',
              '@babel/plugin-transform-parameters', // if 'let' is not supported, add: @babel/plugin-transform-block-scoping
              '@babel/plugin-transform-block-scoping',
              '@babel/plugin-transform-exponentiation-operator',
              '@babel/plugin-transform-destructuring',
              '@babel/plugin-transform-async-to-generator',
              '@babel/plugin-transform-classes',
              '@babel/plugin-transform-object-assign',
              // '@babel/plugin-transform-runtime',
              'transform-es2017-object-entries',
            ],
          }
        },
      ]
    },
    resolve: {
      extensions: [ '.ts' ],
    },
  };
};
