/*!
 * deep-list-dir v1.4.2
 * (c) 2020 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var util = require('util');
var castArray = require('lodash/castArray');
var each = require('lodash/each');
var flattenDeep = require('lodash/flattenDeep');
var minimatch = require('minimatch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var castArray__default = /*#__PURE__*/_interopDefaultLegacy(castArray);
var each__default = /*#__PURE__*/_interopDefaultLegacy(each);
var flattenDeep__default = /*#__PURE__*/_interopDefaultLegacy(flattenDeep);

const readdirAsync = util__default['default'].promisify(fs__default['default'].readdir);

const lstat = util__default['default'].promisify(fs__default['default'].lstat);

const MinimatchOptions = {
  matchBase: true
};

/**
 * Creates patterns
 * @param {String[]|RegExp[]|RegExp|String} patterns
 * @param {Object} [minimatchOptions]
 */
function parsePatterns (patterns, minimatchOptions) {
  return castArray__default['default'](patterns).filter(Boolean).map(pattern => {
    return typeof pattern === 'string' ? new minimatch.Minimatch(pattern, minimatchOptions) : pattern
  })
}

/**
 * Checks if given `fullFile` should be included according to provided `patterns`
 *
 * @param patterns
 * @param base
 * @param fullFile
 * @return {{excluded: boolean, included: boolean}}
 */
function includeFile ({ patterns, base, fullFile }) {
  let included = !patterns.length;
  let excluded = false;

  each__default['default'](patterns, pattern => {
    const relativeFile = path__default['default'].relative(base, fullFile);
    const isRegex = pattern instanceof RegExp;

    if (isRegex) {
      if (!included) {
        included = pattern.test(relativeFile);
      }
      return
    }

    if (pattern.negate) {
      if (!excluded) {
        excluded = !pattern.match(relativeFile);
        return !excluded
      }
      return
    }

    if (!included) {
      included = pattern.match(relativeFile);
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
 * @param {String[]|String|RegExp|RegExp[]} [options.base] - Minimatch pattern or RegExp
 * @param {String[]|String|RegExp|RegExp[]} [options.minimatchOptions] - Additional minimatch options
 * @return {Promise<String[]>} Paths found
 */
async function deepListDir (directory, { pattern: patterns, base, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory;
  patterns = parsePatterns(patterns, minimatchOptions);
  const files = (await readdirAsync(directory)).map(file => {
    /* eslint-disable-next-line */
    return new Promise(async (resolve) => {
      const fullFile = path__default['default'].join(directory, file);

      const { excluded, included } = includeFile({
        patterns,
        fullFile,
        base
      });

      if (!excluded) {
        const isDirectory = (await lstat(fullFile)).isDirectory();
        if (isDirectory) {
          return resolve(deepListDir(fullFile, { pattern: patterns, base: directory }))
        }
      }

      if (!included) {
        return resolve()
      }

      return resolve(fullFile)
    })
  });
  return flattenDeep__default['default'](await Promise.all(files)).filter(Boolean)
}

function deepListDirSync (directory, { pattern: patterns, base, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory;
  patterns = parsePatterns(patterns, minimatchOptions);
  const files = fs__default['default'].readdirSync(directory).map(file => {
    const fullFile = path__default['default'].join(directory, file);

    const { excluded, included } = includeFile({
      patterns,
      fullFile,
      base
    });

    const isDirectory = fs__default['default'].lstatSync(fullFile).isDirectory();

    if (!excluded && isDirectory) {
      return deepListDirSync(fullFile, { pattern: patterns, base: directory })
    }

    if (!included) {
      return
    }

    return fullFile
  });
  return flattenDeep__default['default'](files).filter(Boolean)
}

exports.deepListDir = deepListDir;
exports.deepListDirSync = deepListDirSync;
