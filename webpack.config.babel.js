const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const root = path.join(__dirname, '/');
const defaultEnv = {
  dev: true,
  proxyDocumentation: false,
  production: false,
};

module.exports = (env = defaultEnv) => ({
  mode: process.env.production ? 'production' : 'development',
  entry: ['./src/application.js'],
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.[contenthash:6].js',
    assetModuleFilename: 'resources/[name].[contenthash:6][ext]',
    clean: true,
  },
  resolve: {
    alias: {
      modernizr: path.resolve(__dirname, '.modernizrrc'),
      router: path.resolve(__dirname, 'src/router'),
      pages: path.resolve(__dirname, 'src/views/pages'),
      components: path.resolve(__dirname, 'src/views/components'),
      utils: path.resolve(__dirname, 'src/utils'),
      common: path.resolve(__dirname, 'src/common'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: path.join(root, '.cache'),
        },
      },
      {
        test: /\.(jade|pug)$/,
        loader: 'pug-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          { loader: 'css-loader', options: { sourceMap: env.dev } },
          { loader: 'sass-loader', options: { sourceMap: env.dev } },
          {
            loader: 'sass-resources-loader',
            options: {
              resources: [
                path.resolve(__dirname, 'src/common/css/variables/**/*.scss'),
                path.resolve(__dirname, 'src/common/css/mixins.scss'),
              ],
            },
          },
        ],
      },
      {
        test: /\.(gif|png|jpg|svg|woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
      },
      {
        test: /.modernizrrc.js$/,
        loader: 'webpack-modernizr-loader',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].[fullhash:6].css' }),
    new HtmlWebpackPlugin({ template: './src/index.jade' }),
    new webpack.HotModuleReplacementPlugin(),
    new WebpackNotifierPlugin({ skipFirstNotification: true }),
    new webpack.DefinePlugin({
      LOCAL_DOCUMENTATION: JSON.stringify(env.proxyDocumentation),
    }),
    ...env.production ? [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'CNAME' },
          { from: 'sitemap.xml' },
          { from: 'google95cc3d56e1325c3b.html' },
          { from: 'src/404.html' },
        ],
      }),
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        threshold: 10240,
        minRatio: 0.8,
      }),
    ] : [],
  ],
  devtool: env.dev ? 'inline-source-map' : false,
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: {
      disableDotRule: true,
    },
    https: false,
    port: 9000,
    host: '0.0.0.0',
    hot: true,
    inline: true,
    watchOptions: {
      aggregateTimeout: 200,
      poll: 1000,
    },
    proxy: env.proxyDocumentation ? {
      '/documentation.html*': {
        target: 'http://localhost:9020/',
        bypass(req, res, options) {
          console.log(`proxy url: ${req.url}`);
        },
      },
      '/docs/Images/**': {
        pathRewrite: { '^/docs': '' },
        target: 'http://localhost:9020/',
        bypass(req, res, options) {
          console.log(`proxy url: ${req.url}`);
        },
      },
    } : {},

  },
  optimization: {
    minimize: !!env.production,
    minimizer: env.production ? [new TerserPlugin({
      terserOptions: {
        format: {
          comments: false,
        },
      },
      extractComments: false,
    }), new CssMinimizerPlugin()] : [],
  },
  performance: {
    hints: false,
  },
});
