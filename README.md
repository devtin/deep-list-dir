# deep-list-dir
> Deeply lists a directory filtering files by given pattern(s)

<a href="https://www.npmjs.com/package/deep-list-dir" target="_blank"><img src="https://img.shields.io/npm/v/deep-list-dir.svg" alt="Version"></a>
[![tests](https://github.com/devtin/deep-list-dir/workflows/test/badge.svg)](https://github.com/devtin/deep-list-dir/actions)

This module recursively lists all files in given directory (including sub-folders) by early filtering the results using the
given `pattern` which can be an array of <a href="https://www.npmjs.com/package/minimatch" target="_blank">minimatch</a>
expressions or `RegExp`.

It will return all matching results. <a href="https://www.npmjs.com/package/minimatch" target="_blank">minimatch</a>
negative patterns are used to explicitly exclude a path from being scan / returned.

## Example

Take the following file structure:

```
<directory>
├── dir1
│   └── README.md
├── dir2
│   └── sub-dir2
│       ├── hi.txt
│       └── index.js
├── index.js
└── README.md
```

...and the following script:

```js
const { deepListDir, deepListDirSync } = require('deep-list-dir')

deepListDir('<directory>',
  {
    pattern: ['*.md'], // minimatch or RegExp
    // base: '', set parent base to something different than given directory
    // minimatchOptions: { matchBase: true } // minimatch options
  }
).then(console.log)
```

Will output

```json
[
  "dir1/README.md",
  "README.md"
]
```

A sync version is also provided:

```js
console.log(deepListDirSync('<directory>', { pattern: '*.js'})) 
```

Output:

```json
[
  "dir2/sub-dir2/index.js",
  "index.js"
]
```

* * *

### License

[MIT](https://opensource.org/licenses/MIT)

&copy; 2020-present Martin Rafael Gonzalez
<tin@devtin.io>
