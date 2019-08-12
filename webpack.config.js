const path = require('path')
const webpack = require('webpack')

const ENV_PROD = process.env.NODE_ENV === 'production'
const ENV_DEMO = process.env.NODE_ENV === 'demo'

const output = {
  path: path.resolve(__dirname, './dist'),
  publicPath: '/dist/',
  filename: 'build.js'
}
if (ENV_PROD) {
  output.filename = 'vue-drag-sortable.js'
  output.library = 'DragSortable'
  output.libraryTarget = 'umd'
}

module.exports = {
  entry: ENV_PROD ? './src/DragSortable.vue' : './src/main.js',
  output: output,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ],
      },      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map'
}

if (ENV_PROD || ENV_DEMO) {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
