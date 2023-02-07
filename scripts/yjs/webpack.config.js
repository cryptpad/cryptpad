module.exports = {
  entry: './yjs_bundle.js',
  output: {
    library: 'yjs_bundle',
    filename: 'yjs_bundle.js',
    path: __dirname + '../../../www/lib/',
    // libraryTarget: 'window',
    // libraryExport: 'default'
  },
};
