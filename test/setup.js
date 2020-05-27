import fs from 'fs'
import path from 'path'

function fixturePath (name) {
  const fixtureFile = path.join(__dirname, './fixtures', name)
  const benchmarkFile = path.join(__dirname, '../benchmark', name)
  if (!fs.existsSync(fixtureFile) && !fs.existsSync(benchmarkFile)) {
    throw new Error(`Fixture ${ path.relative(process.cwd(), fixtureFile) } not found`)
  }
  return fs.existsSync(fixtureFile) ? fixtureFile : benchmarkFile
}

function fixture (name) {
  return fs.readFileSync(fixturePath(name)).toString()
}

Object.assign(global, {
  fixture,
  fixturePath
})
