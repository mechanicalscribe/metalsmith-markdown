var basename = require('path').basename;
var debug = require('debug')('metalsmith-markdown');
var basename = require('path').basename;
var dirname = require('path').dirname;
var extname = require('path').extname;
var join = require('path').join;
var marked = require('marked');

/**
 * Check if a `file` is markdown.
 *
 * @param {String} file
 * @return {Boolean}
 */
var markdown = function(file) {
  return /\.md$|\.markdown$/.test(extname(file));
};

/**
 * Metalsmith plugin to convert markdown files.
 *
 * @param {Object} options (optional)
 *   @property {Array} keys
 * @return {Function}
 */
var plugin = function(options) {
  options = options || {};
  var keys = options.keys || [];

  return function(files, metalsmith, done) {
    setImmediate(done);
    Object.keys(files).forEach(function(file) {
      debug('checking file: %s', file);
      if (!markdown(file)) return;

      var root_dir = dirname(file).split("/")[0];

      // check to see whether the user specified directories we should be looking in
      if (options.directories && !~options.directories.indexOf(root_dir)) {
        debug("Ignoring %s because it's root directory (%s) is not in the 'directories' property.", file, root_dir);
        return;
      }

      if (options.ignore && ~options.ignore.join("_").toLowerCase().indexOf(basename(file).toLowerCase())) {
        debug("Ignoring %s because it's on the 'ignore' list.", file);
        return;
      }

      var data = files[file];

      var dir = dirname(file);
      var html = basename(file, extname(file)) + '.html';
      if ('.' != dir) html = join(dir, html);

      debug('converting file: %s', file);
      var str = marked(data.contents.toString(), options);

      // convert mdashes
      str = str.replace(/--/g, "&mdash;");

      try {
        // preferred
        data.contents = Buffer.from(str);
      } catch (err) {
        // node versions < (5.10 | 6)
        data.contents = new Buffer(str);
      }
      keys.forEach(function(key) {
        if (data[key]) {
          data[key] = marked(data[key].toString(), options);
        }
      });

      delete files[file];
      files[html] = data;
    });
  };
};

// Expose Plugin
module.exports = plugin;
