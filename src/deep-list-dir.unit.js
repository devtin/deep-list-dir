import test from 'ava'
import { deepListDir } from './deep-list-dir.js'

test(`Deeply lists and filters files`, async t => {
  const dir = fixturePath('./')
  const r1 = await deepListDir(dir, { pattern: ['*.md'] })
  const r2 = await deepListDir(dir, { pattern: ['*.js'] })
  const r3 = await deepListDir(dir, { pattern: ['*.js', '*.md'] })
  const r4 = await deepListDir(dir, { pattern: ['README.md'] })
  const r5 = await deepListDir(dir, { pattern: ['**/*/README.md'] })

  const mdFile = /\.md$/
  const jsFile = /\.js$/

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
