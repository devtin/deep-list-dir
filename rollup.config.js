import { name, version, author, license } from './package.json'
import commonjs from '@rollup/plugin-commonjs'

const initialYear = 2020
const yearsActive = new Date().getFullYear() !== initialYear ? `${ initialYear }-${ new Date().getFullYear() }` : initialYear

const banner = `/*!
 * ${ name } v${ version }
 * (c) ${ yearsActive } ${ author }
 * ${ license }
 */`

export default [
  {
    input: 'src/deep-list-dir.js',
    output: [
      {
        file: `dist/deep-list-dir.js`,
        format: 'cjs',
        banner
      },
    ],
    plugins: [commonjs()]
  }
]
