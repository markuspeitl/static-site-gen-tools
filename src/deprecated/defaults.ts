import { defaultFragmentCache } from "../fragement-cache";
import { SsgConfig } from "../config";

//These should modifyable through config
export const defaultCompileRunnersFileMap: Record<string, string> = {
    '.+.html': "html-runner.ts",
    '.+.ehtml': "html-runner.ts",
    '.+.md': "md-runner.ts",
    '.+.njk': "njk-runner.ts",
    '.+.ts': "ts-runner.ts"
};

/*
export interface CompileRunnerModule extends Module {
    //getExtractor(): DataExtractor;
    //getCompiler(): DocumentCompiler;
    //getTargetExtension(): string;
    getInstance(): CompileRunner;
}
export interface CompilerFns extends DocumentCompiler, DataExtractor { }

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

    extractors.md = defaultMarkdownDataExtractor;
    extractors.ts = defaultTsDataExtractor;
    extractors.html = defaultHtmlDataExtractor;
    extractors.njk = defaultNjkDataExtractor;

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

    docCompilers.md = defaultMarkdownDocumentCompiler;
    docCompilers.ts = defaultTsDocumentCompiler;
    docCompilers.html = defaultHtmlDocumentCompiler;
    docCompilers.njk = defaultNjkDocumentCompiler;

    return docCompilers;
}*/

export function setDefaultFragmentCache(config?: SsgConfig): void {
    if (!config) {
        return;
    }

    if (!config.fragmentCache) {
        config.fragmentCache = defaultFragmentCache;
    }
}

//export const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();
//export const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();