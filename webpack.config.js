const path = require('path');
const cssExtract = require('mini-css-extract-plugin');

module.exports = {
  entry: ['babel-polyfill', './src/javascript/index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(sc|c)ss$/,
        use: [
          { loader: cssExtract.loader },
          { loader: 'css-loader' },
          { loader: 'postcss-loader' },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass')
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new cssExtract({
      filename: 'bundle.css'
    })
  ],
  mode: 'development',
  watch: true
}