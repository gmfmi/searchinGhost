const path = require('path');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
    mode: 'production',
    devtool: 'hidden-source-map',
    entry: {
        searchinghost: './src/searchinghost.js'
    },
    output: {
        filename: '[name].min.js',
        library: 'SearchinGhost',
        libraryExport: 'default',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.BannerPlugin(`name: SearchinGhost\nversion: ${package.version}\nrepository: ${package.homepage}`)
    ]
};