/*!
 * deep-list-dir v1.0.1
 * (c) 2020 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var util = _interopDefault(require('util'));
var castArray = _interopDefault(require('lodash/castArray'));
var each = _interopDefault(require('lodash/each'));
var flattenDeep = _interopDefault(require('lodash/flattenDeep'));
var minimatch = require('minimatch');

const readdirAsync = util.promisify(fs.readdir);

const lstat = util.promisify(fs.lstat);

/**
 * Deeply scans the given `directory` and returns results optionally filtering those matching given
 * <a href="https://github.com/isaacs/minimatch#readme" target="_blank">minimatch</a> `pattern` returning an array of
 * strings with absolute paths to all of the matching files.
 *
 * @param {String} directory - The directory to scan
 * @param {Object} options
 * @param {String[]|String|RegExp|RegExp[]} [options.pattern] - Minimatch pattern or RegExp
 * @return {Promise<String[]>} Paths found
 */
async function deepListDir (directory, { pattern: patterns, base, minimatchOptions = { matchBase: true } } = {}) {
  base = base || directory;
  patterns = castArray(patterns).map(pattern => {
    return typeof pattern === 'string' ? new minimatch.Minimatch(pattern, minimatchOptions) : pattern
  });
  const files = (await readdirAsync(directory)).map(file => {
    /* eslint-disable-next-line */
    return new Promise(async (resolve) => {
      const fullFile = path.join(directory, file);

      let included = !patterns.length;
      let excluded = false;

      each(patterns, pattern => {
        const relativeFile = path.relative(base, fullFile);
        const isRegex = pattern instanceof RegExp;
        if ((isRegex && pattern.test(relativeFile)) || pattern.match(relativeFile)) {
          included = true;
          return
        }
        if (!isRegex && pattern.negate) {
          included = false;
          excluded = true;
          return false
        }
      });

      const isDirectory = (await lstat(fullFile)).isDirectory();

      if (!excluded && isDirectory) {
        // found = found.concat(await deepScanDir(file, { exclude, filter, only }))
        return resolve(deepListDir(fullFile, { pattern: patterns, base: directory }))
      }

      if (!included) {
        return resolve()
      }

      return resolve(fullFile)
    })
  });
  return flattenDeep(await Promise.all(files)).filter(Boolean)
}

exports.deepListDir = deepListDir;
