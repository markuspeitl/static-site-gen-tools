
import { SsgConfig } from "../config";
//import { Environment } from "nunjucks";

const defaultLibConstructors = {
    'markdown': async (config?: SsgConfig, configOptions?: any) => {
        const markdownit = await import('markdown-it');

        //Initialize &
        //Disable indented code blocks (break formatting when mixing templating syntaxes)

        //info: https://github.com/11ty/eleventy/issues/2438
        return markdownit.default(configOptions).disable('code');

        //alternatives:
        //https://github.com/micromark/micromark#extending-markdown
        //remark

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
    },
    'xml2js': async () => {
        const module = import('xml2js');
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

export async function initializeLib(libConstructor: ConstructorFnOrStatic, config?: SsgConfig, configOptions?: any): Promise<any> {

    if (typeof libConstructor === 'function') {
        const initializedLib: any = await libConstructor(config, configOptions);
        return initializedLib;
    }

    return libConstructor;
}

export async function getLibInstance(libName: string, config?: SsgConfig, configOptions?: any): Promise<any> {

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

    if (!selectedLibConstructor) {
        throw new Error(`Library with the key '${libName}' is not defined in 'defaultLibConstructors', please add dependency costructor`);
    }

    const initializedLib: any = await initializeLib(selectedLibConstructor, config, configOptions);

    if (initializedLib) {
        initializedLibsCache[ libName ] = initializedLib;
    }

    return initializedLib;
}