import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import { DataExtractor, DataExtractors } from "./data-extract";
import { DocCompilers, DocumentCompiler, FalsyAble } from "./document-compile";
import { defaultFragmentCache } from "./fragement-cache";
import { getExtractor as getTsDataExtractor, getCompiler as getTsCompile } from "./compilers/ts-runner";
import path from "path";
import * as fs from 'fs';
import { loadTsModule } from "./module-loading/util";
import Module from "module";


export interface CompilerModule extends Module {
    getExtractor(): DataExtractor;
    getCompiler(): DocumentCompiler;
    getTargetExtension(): string;
}
export interface CompilerFns extends DocumentCompiler, DataExtractor { }


export async function loadCompilers(srcDirPath: string, extension: string = 'ts'): Promise<Module[] | null> {
    //const compilersDirRel = './compilers';
    //let compilersDirPath = path.join(__dirname, compilersDirRel);

    if (!path.isAbsolute(srcDirPath)) {
        srcDirPath = path.join(process.cwd(), srcDirPath);
    }

    if (!fs.existsSync(srcDirPath)) {
        return null;
    }

    const srcDirFiles: string[] = await fs.promises.readdir(srcDirPath);

    const loadedModules: Module[] = [];

    for (const dirFile of srcDirFiles) {
        const dirFileAbs = path.join(srcDirPath, dirFile);
        const dirFileParsed: path.ParsedPath = path.parse(dirFileAbs);
        //const dirFileName = dirFileParsed.name;
        const dirFileExt = dirFileParsed.ext;

        if (dirFileExt === extension) {
            const loadedTsModule = await loadTsModule(dirFileAbs);
            if (loadedTsModule) {
                loadedModules.push(loadedTsModule);
            }

        }

    }
    return loadedModules;
}

let defaultCompilerModules: CompilerModule[] | null = null;
async function getDefaultCompilers(): Promise<CompilerModule[] | null> {

    if (defaultCompilerModules) {
        return defaultCompilerModules;
    }

    const compilersDirRel = './compilers';
    let compilersDirPath = path.join(__dirname, compilersDirRel);
    defaultCompilerModules = (await loadCompilers(compilersDirPath)) as CompilerModule[];
    return defaultCompilerModules;
}

const defaultCompilerAssociations: Record<string, string> = {
    '*.html': "html-runner.ts",
    '*.md': "md-runner.ts",
    '*.njk': "njk-runner.ts",
    '*.ts': "ts-runner.ts"
};

export async function getDefaultDataExtractors(): Promise<DataExtractors> {
    const extractors: DataExtractors = {};


    const compilerModules: CompilerModule[] | null = await getDefaultCompilers();
    if (!compilerModules) {
        return extractors;
    }

    for (const compilerModule of compilerModules) {
        const ext: string = compilerModule.getTargetExtension();
        extractors[ ext ] = compilerModule.getExtractor();
    }

    /*extractors.md = defaultMarkdownDataExtractor;
    extractors.ts = defaultTsDataExtractor;
    extractors.html = defaultHtmlDataExtractor;
    extractors.njk = defaultNjkDataExtractor;*/

    return extractors;
}



export async function getDefaultDocCompilers(): Promise<DocCompilers> {
    const docCompilers: DocCompilers = {};

    const compilerModules: CompilerModule[] | null = await getDefaultCompilers();
    if (!compilerModules) {
        return docCompilers;
    }

    for (const compilerModule of compilerModules) {
        const ext: string = compilerModule.getTargetExtension();
        docCompilers[ ext ] = compilerModule.getCompiler();
    }

    /*docCompilers.md = defaultMarkdownDocumentCompiler;
    docCompilers.ts = defaultTsDocumentCompiler;
    docCompilers.html = defaultHtmlDocumentCompiler;
    docCompilers.njk = defaultNjkDocumentCompiler;*/

    return docCompilers;
}

export function setDefaultFragmentCache(config: any): void {
    if (!config.fragmentCache) {
        config.fragmentCache = defaultFragmentCache;
    }
}

//export const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();
//export const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();