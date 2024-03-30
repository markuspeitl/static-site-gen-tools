//import matter from "gray-matter";
//import markdownit from "markdown-it/lib";
//import * as nunjucks from 'nunjucks';

/*const libConstructors = {
    'markdown': async () => {
        const markdownit = await import('markdown-it/lib');
        return markdownit.default();
    },
    'matter': async () => await import('gray-matter'),
    'nunjucks': async () => {
        const nunjucks = await import('nunjucks');
        nunjucks.configure({ autoescape: true });
        return nunjucks;
    }
};
const libCache: Record<string, any> = {};

export async function getOverrideOrLocal(libName: string, config?: any): Promise<any> {

    if (config.libOverrides[ libName ]) {
        return config.libOverrides[ libName ];
    }

    if (libCache[ libName ]) {
        return libCache[ libName ];
    }

    libCache[ libName ] = libConstructors[ libName ](config);

    return libCache[ libName ];
}*/