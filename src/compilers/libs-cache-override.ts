import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import * as nunjucks from 'nunjucks';

const libConstructors = {
    'markdown': () => markdownit(),
    'matter': () => matter,
    'nunjucks': () => nunjucks.configure({ autoescape: true })
};
const libCache = {};

export function getOverrideOrLocal(libName: string, config?: any): any {

    if (config.libOverrides[ libName ]) {
        return config.libOverrides[ libName ];
    }

    if (libCache[ libName ]) {
        return libCache[ libName ];
    }

    libCache[ libName ] = libConstructors[ libName ](config);

    return libCache[ libName ];
}