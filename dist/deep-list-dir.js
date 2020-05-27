/*!
 * deep-list-dir v1.1.0
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

const MinimatchOptions = {
  matchBase: true
};

/**
 * Creates patterns
 * @param {String[]|RegExp[]|RegExp|String} patterns
 */
function parsePatterns (patterns, minimatchOptions) {
  return castArray(patterns).map(pattern => {
    return typeof pattern === 'string' ? new minimatch.Minimatch(pattern, minimatchOptions) : pattern
  })
}

function includeFile ({ patterns, base, fullFile }) {
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

  return {
    included,
    excluded
  }
}

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
async function deepListDir (directory, { pattern: patterns, base, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory;
  patterns = parsePatterns(patterns, minimatchOptions);
  const files = (await readdirAsync(directory)).map(file => {
    /* eslint-disable-next-line */
    return new Promise(async (resolve) => {
      const fullFile = path.join(directory, file);

      const { excluded, included } = includeFile({
        patterns,
        fullFile,
        base
      });

      const isDirectory = (await lstat(fullFile)).isDirectory();

      if (!excluded && isDirectory) {
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

function deepListDirSync (directory, { pattern: patterns, base, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory;
  patterns = parsePatterns(patterns, minimatchOptions);
  const files = fs.readdirSync(directory).map(file => {
    const fullFile = path.join(directory, file);

    const { excluded, included } = includeFile({
      patterns,
      fullFile,
      base
    });

    const isDirectory = fs.lstatSync(fullFile).isDirectory();

    if (!excluded && isDirectory) {
      return deepListDirSync(fullFile, { pattern: patterns, base: directory })
    }

    if (!included) {
      return
    }

    return fullFile
  });
  return flattenDeep(files).filter(Boolean)
}

exports.deepListDir = deepListDir;
exports.deepListDirSync = deepListDirSync;
