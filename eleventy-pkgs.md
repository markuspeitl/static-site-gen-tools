Apparently a bit more stable fs implementation: https://www.npmjs.com/package/graceful-fs
var fs = require('graceful-fs')
string to slug
https://www.npmjs.com/package/@sindresorhus/slugify
https://www.npmjs.com/package/slugify
https://www.npmjs.com/package/bcp-47-normalize
 file watching
https://www.npmjs.com/package/chokidar 
Cross platform process spawning:
https://www.npmjs.com/package/cross-spawn
Colored debug logs:
https://www.npmjs.com/package/debug

 Dependencies:
 - sorting: https://www.npmjs.com/package/toposort
 - https://www.npmjs.com/package/dependency-graph

 https://www.npmjs.com/package/dependency-tree might be a better options - supports JS, TS, CSS, Sass, .etc
 https://github.com/dependents/node-dependency-tree

Globbing:
https://www.npmjs.com/package/glob (a tiyny bit slower than fast-glob, but a bit more correct)
 https://www.npmjs.com/package/fast-glob - fast and very small
 https://www.npmjs.com/package/is-glob check if is glob (through should not be needed with a good implementation)


Front matter parser (de facto standard for node):
https://www.npmjs.com/package/gray-matter

Maybe: https://www.npmjs.com/package/assetgraph - https://www.npmjs.com/package/hyperlink

Unrelated (might be useful for visualizing component deps):
visualize and validate deps: https://libraries.io/npm/dependency-cruiser

Markdown to html parser (supports plugins):
https://www.npmjs.com/package/markdown-it
Liquid parser
https://www.npmjs.com/package/liquidjs


Get js global scope vars from js string:
https://www.npmjs.com/package/node-retrieve-globals

Windows style paths to unix + clean up
https://www.npmjs.com/package/normalize-path

Recursive copying - not too fond of this:
https://www.npmjs.com/package/recursive-copy

Language code mapping formats: example English --> en, eng, .etc (old through 7years)
https://www.npmjs.com/package/langs
https://www.npmjs.com/package/iso-639-1

Json data localization i18n
https://www.npmjs.com/package/@cospired/i18n-iso-languages
https://www.npmjs.com/package/i18n
Airbnb solution (interesting features -> seems a bit bloat though)
https://www.npmjs.com/package/node-polyglot
 I don't trust this lots of marketing, big claims, bloat and boasting
https://www.i18next.com/

Logging colors
https://www.npmjs.com/package/kleur
https://www.npmjs.com/package/chalk

Datetime parsing and formatting
https://www.npmjs.com/package/luxon

Javascript color manipulation -> like sass:color
https://www.npmjs.com/package/moo-color

Lexer + tokenizer
https://www.npmjs.com/package/moo
Can be passed to a parser to transform into data structure:
https://nearley.js.org/

Create ast of html:
https://www.npmjs.com/package/posthtml-parser

html minifyier (kinda large 1.16MB)
https://www.npmjs.com/package/htmlnano

Html transformations & parsing
https://www.npmjs.com/package/posthtml

HTML:
More low level (no selector logic -> manual transversal and selection of nodes)
parse5
htmlparser2 - streaming parsing -> stream event based
somwhat higher level - jquery like manipulation
cheerio
jsdom - virtual browser env
https://stackoverflow.com/questions/11398419/trying-to-use-the-domparser-with-node-js

Transverse json tree and iterate over every node (small pure js)
https://github.com/ljharb/js-traverse/blob/main/index.js
