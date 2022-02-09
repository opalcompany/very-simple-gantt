const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const nodeExternals = require('webpack-node-externals');

module.exports = {
  //name: "index",
  entry: {
    'very-simple-gantt': path.resolve(__dirname, "client/components/index.ts"),
  },
  devtool: "source-map",
  target: ['web', 'es5'],
  mode: "development",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    umdNamedDefine: true,
    library: {
      type: 'umd',
      name: 'verySimpleGantt'
    }
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.lib.json",
        },
      },
      {
        test: /\.scss$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader"
        }, {
          loader: "sass-loader"
        }]
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      //{ test: /\.json$/, loader: 'json-loader' },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
      cleanAfterEveryBuildPatterns: ['!images/**/*', '!fonts/**/*'],
    }),
    // new WebpackManifestPlugin(),
  ],
};
