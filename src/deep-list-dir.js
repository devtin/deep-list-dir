import fs from 'fs'
import path from 'path'
import util from 'util'
import castArray from 'lodash/castArray'
import each from 'lodash/each'
import flattenDeep from 'lodash/flattenDeep'
import { Minimatch } from 'minimatch'
import { readdirAsync } from './lib/readdir-async.js'

const lstat = util.promisify(fs.lstat)

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
export async function deepListDir (directory, { pattern: patterns, base, minimatchOptions = { matchBase: true } } = {}) {
  base = base || directory
  patterns = castArray(patterns).map(pattern => {
    return typeof pattern === 'string' ? new Minimatch(pattern, minimatchOptions) : pattern
  })
  const files = (await readdirAsync(directory)).map(file => {
    /* eslint-disable-next-line */
    return new Promise(async (resolve) => {
      const fullFile = path.join(directory, file)

      let included = !patterns.length
      let excluded = false

      each(patterns, pattern => {
        const relativeFile = path.relative(base, fullFile)
        const isRegex = pattern instanceof RegExp
        if ((isRegex && pattern.test(relativeFile)) || pattern.match(relativeFile)) {
          included = true
          return
        }
        if (!isRegex && pattern.negate) {
          included = false
          excluded = true
          return false
        }
      })

      const isDirectory = (await lstat(fullFile)).isDirectory()

      if (!excluded && isDirectory) {
        // found = found.concat(await deepScanDir(file, { exclude, filter, only }))
        return resolve(deepListDir(fullFile, { pattern: patterns, base: directory }))
      }

      if (!included) {
        return resolve()
      }

      return resolve(fullFile)
    })
  })
  return flattenDeep(await Promise.all(files)).filter(Boolean)
}
