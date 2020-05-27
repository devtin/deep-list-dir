import fs from 'fs'
import util from 'util'
export const readdirAsync = util.promisify(fs.readdir)
