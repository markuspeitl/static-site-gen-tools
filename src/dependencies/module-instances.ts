
import { SsgConfig } from "../config";
//import { Environment } from "nunjucks";

const defaultLibConstructors = {
    'markdown': async () => {
        const markdownit = await import('markdown-it');
        return markdownit.default();
    },
    'matter': async () => {
        const module = await import('gray-matter');
        return module;
    },
    'nunjucks': async () => {
        const nunjucksModule = await import('nunjucks');
        const nunjucks = nunjucksModule.default;
        //const { Environment } = nunjucks;

        return nunjucks.configure({ autoescape: true });
        //const njkEnvironment: nunjucks.Environment = nunjucks.configure({ autoescape: true });
        //return nunjucks;
    },
    'cheerio': async () => {
        const module = import('cheerio');
        return module;
    }
};

const initializedLibsCache: Record<string, any> = {};

export function setDefaultLibConstructors(config: SsgConfig): void {

    if (!config.libConstructors) {
        config.libConstructors = {};
    }

    const libConstructors: Record<string, any> = config.libConstructors;

    for (const libName in defaultLibConstructors) {
        if (!libConstructors[ libName ]) {
            libConstructors[ libName ] = defaultLibConstructors[ libName ];
        }
    }
}

export type ConstructorFn = (config?: SsgConfig) => Promise<any>;
export type ConstructorFnOrStatic = ConstructorFn | any;

export async function initializeLib(libConstructor: ConstructorFnOrStatic, config?: SsgConfig): Promise<any> {

    if (typeof libConstructor === 'function') {
        const initializedLib: any = await libConstructor(config);
        return initializedLib;
    }

    return libConstructor;
}

export async function getLibInstance(libName: string, config?: SsgConfig): Promise<any> {

    if (initializedLibsCache[ libName ]) {
        return initializedLibsCache[ libName ];
    }

    if (!config) {
        return null;
    }

    if (!config.libConstructors) {
        config.libConstructors = {};
    }

    let selectedLibConstructor: ConstructorFnOrStatic = config.libConstructors[ libName ];

    if (!selectedLibConstructor) {
        selectedLibConstructor = defaultLibConstructors[ libName ];
    }

    const initializedLib: any = await initializeLib(selectedLibConstructor, config);

    if (initializedLib) {
        initializedLibsCache[ libName ] = initializedLib;
    }

    return initializedLib;
}