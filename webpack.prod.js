const path = require('path');
const merge = require('webpack-merge');
//const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        main: './src/index.js',
        panels: './src/panels/panels.js',
        ar: './src/ar.js'
    },
    watch: true,
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
    },
    output: {
        filename: 'js/[name].js',
        path: path.resolve(__dirname, 'dist'),
        //        libraryTarget: 'var',
        //        library: 'MoleculeViewer'
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.(png|svg|wav|mp3|ogg|jpg|gif|glb|gltf|obj)$/,
                use: [
                  'file-loader',
              ],
          },
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            },
            {
                test: /\.(glsl)$/,
                use: [
                    'webpack-glsl-loader',
              ],
          }
      ],
    },
    //    plugins: [
    //       new HtmlWebpackPlugin({
    //        title: 'Development',
    //      }), 
    //    ],
};
