
import { getLibModuleInstance, ModuleConstructDict, setUnsetCfgLibConstructors } from "@markus/ts-node-util-mk1";
import { SsgConfig } from "../config";
//import { Environment } from "nunjucks";

const defaultLibConstructors: ModuleConstructDict = {
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

        return nunjucks.configure({ autoescape: false });
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


export async function getLibInstance(libName: string, config?: SsgConfig, configOptions?: any): Promise<any> {
    if (!config) {
        return null;
    }

    if (!config.libConstructors) {
        config.libConstructors = {};
    }


    if (config.libConstructors[ libName ]) {
        return getLibModuleInstance(libName, config.libConstructors, config, configOptions);
    }
    return getLibModuleInstance(libName, defaultLibConstructors, config, configOptions);
}

export function setDefaultLibConstructors(config: SsgConfig): void {
    setUnsetCfgLibConstructors(config, defaultLibConstructors);
}