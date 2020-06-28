import test from 'ava'
import path from 'path'
import { deepListDir, deepListDirSync } from './deep-list-dir.js'

const mdFile = /\.md$/
const jsFile = /\.js$/

test(`Deeply lists and filters files`, async t => {
  const dir = fixturePath('./')
  const r1 = await deepListDir(dir, { pattern: ['*.md'] })
  const r2 = await deepListDir(dir, { pattern: ['*.js'] })
  const r3 = await deepListDir(dir, { pattern: ['*.js', '*.md'] })
  const r4 = await deepListDir(dir, { pattern: ['README.md'] })
  const r5 = await deepListDir(dir, { pattern: ['**/*/README.md'] })

  t.is(r1.length, 2)
  r1.forEach(file => {
    t.true(mdFile.test(file))
  })

  t.is(r2.length, 2)
  r2.forEach(file => {
    t.true(jsFile.test(file))
  })

  t.is(r3.length, 4)
  r3.forEach(file => {
    t.true(jsFile.test(file) || mdFile.test(file))
  })

  t.is(r4.length, 2)
  r4.forEach(file => {
    t.true(mdFile.test(file))
  })

  t.is(r5.length, 1)
  r5.forEach(file => {
    t.true(mdFile.test(file))
  })
})

test(`Deeply lists and filters files (sync)`, t => {
  const dir = fixturePath('./')
  const r1 = deepListDirSync(dir, { pattern: ['*.md'] })
  const r2 = deepListDirSync(dir, { pattern: ['*.js'] })
  const r3 = deepListDirSync(dir, { pattern: ['*.js', '*.md'] })
  const r4 = deepListDirSync(dir, { pattern: ['README.md'] })
  const r5 = deepListDirSync(dir, { pattern: ['**/*/README.md'] })

  t.is(r1.length, 2)
  r1.forEach(file => {
    t.true(mdFile.test(file))
  })

  t.is(r2.length, 2)
  r2.forEach(file => {
    t.true(jsFile.test(file))
  })

  t.is(r3.length, 4)
  r3.forEach(file => {
    t.true(jsFile.test(file) || mdFile.test(file))
  })

  t.is(r4.length, 2)
  r4.forEach(file => {
    t.true(mdFile.test(file))
  })

  t.is(r5.length, 1)
  r5.forEach(file => {
    t.true(mdFile.test(file))
  })
})

test(`Negative expressions are used to explicitly exclude paths`, t => {
  const dir = fixturePath('./')
  const results = deepListDirSync(dir, { pattern: ['*.js', '!sub-dir2'] })
  t.is(results.length, 1)
  t.is(path.relative(dir, results[0]), 'index.js')
})
