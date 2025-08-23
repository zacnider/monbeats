// webpack.config.js

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = {
  entry: [
    path.resolve(__dirname, 'src', 'index.js'),
    path.resolve(__dirname, 'src', 'index.scss'),
  ],
  output: {
    path: path.join(__dirname, 'dist'), // bundled file in dist/
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // applies to js and jsx files
        use: ['babel-loader'], // transpiles your js/jsx
        exclude: /node_modules/, // don't transpile node modules
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.json$/,
        type: 'json'
      },
      {
        test: /\.s?[ac]ss$/, // applies to css/scss/sass files
        use: [
          MiniCssExtractPlugin.loader, // create bundled css file
          {
            loader: 'css-loader', // resolves @import statements
            options: { url: false } // don't resolve url() statements
          },
          'sass-loader', // compiles sass to css
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/")
    }
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'production') {
    config.devtool = 'source-map';
  } else {
    config.devtool = 'eval-source-map';
    
    // Dev server configuration
    config.devServer = {
      static: {
        directory: path.join(__dirname),
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true,
      historyApiFallback: true
    };
  }

  return config;
}