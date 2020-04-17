const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        searchinghost: './src/searchinghost.js'
    },
    output: {
        filename: '[name].min.js',
        library: 'SearchinGhost',
        libraryExport: 'default',
        path: path.resolve(__dirname, 'dist'),
    },
};