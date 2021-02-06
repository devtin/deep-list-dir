import fs from 'fs'
import path from 'path'
import util from 'util'
import castArray from 'lodash/castArray'
import each from 'lodash/each'
import flattenDeep from 'lodash/flattenDeep'
import { Minimatch } from 'minimatch'
import { readdirAsync } from './lib/readdir-async.js'

const lstat = util.promisify(fs.lstat)

const MinimatchOptions = {
  matchBase: true
}

/**
 * Creates patterns
 * @param {String[]|RegExp[]|RegExp|String} patterns
 * @param {Object} [minimatchOptions]
 */
function parsePatterns (patterns, minimatchOptions) {
  return castArray(patterns).filter(Boolean).map(pattern => {
    return typeof pattern === 'string' ? new Minimatch(pattern, minimatchOptions) : pattern
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
  let included = !patterns.length
  let excluded = false

  each(patterns, pattern => {
    const relativeFile = path.relative(base, fullFile)
    const isRegex = pattern instanceof RegExp

    if (isRegex) {
      if (!included) {
        included = pattern.test(relativeFile)
      }
      return
    }

    if (pattern.negate) {
      if (!excluded) {
        excluded = !pattern.match(relativeFile)
        return !excluded
      }
      return
    }

    if (!included) {
      included = pattern.match(relativeFile)
    }
  })

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
export async function deepListDir (directory, { pattern: patterns, base, mainBase, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory
  mainBase = mainBase || base
  patterns = parsePatterns(patterns, minimatchOptions)

  const files = (await readdirAsync(directory)).map(file => {
    /* eslint-disable-next-line */
    return new Promise(async (resolve) => {
      const fullFile = path.join(directory, file)

      const { excluded, included } = includeFile({
        patterns,
        fullFile,
        base: mainBase
      })

      if (!excluded) {
        const isDirectory = (await lstat(fullFile)).isDirectory()
        if (isDirectory) {
          return resolve(deepListDir(fullFile, { pattern: patterns, base: directory, mainBase }))
        }
      }

      if (!included) {
        return resolve()
      }

      return resolve(fullFile)
    })
  })
  return flattenDeep(await Promise.all(files)).filter(Boolean)
}

export function deepListDirSync (directory, { pattern: patterns, base, mainBase, minimatchOptions = MinimatchOptions } = {}) {
  base = base || directory
  mainBase = mainBase || base

  patterns = parsePatterns(patterns, minimatchOptions)
  const files = fs.readdirSync(directory).map(file => {
    const fullFile = path.join(directory, file)

    const { excluded, included } = includeFile({
      patterns,
      fullFile,
      base: mainBase
    })

    const isDirectory = fs.lstatSync(fullFile).isDirectory()

    if (!excluded && isDirectory) {
      return deepListDirSync(fullFile, { pattern: patterns, base: directory, mainBase })
    }

    if (!included) {
      return
    }

    return fullFile
  })
  return flattenDeep(files).filter(Boolean)
}
