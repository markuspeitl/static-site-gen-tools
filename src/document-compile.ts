import * as fs from 'fs';
import path from 'path';
import markdownit from 'markdown-it';
import { setDefaults, cleanUpExt } from './compile';
import { DocumentData, extractData } from './data-extract';
import { CompilerModule, getDefaultDocCompilers, setDefaultFragmentCache } from './defaults';
import { defaultFragmentCache, FragmentCache } from './fragement-cache';
import { SsgConfig } from './config';
import { arrayify, arrayifyFilter } from './utils/util';
import { SingleOrArray } from './utils/util2';
import { loadTsModule } from './module-loading/util';

export interface DataParsedDocument {
    content?: string | null;
    data?: DocumentData | null;
}
export interface DocumentCompileData extends DataParsedDocument {
    dataCtx?: DocumentData;
}

export interface DocumentCompiler {
    compile: (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig) => Promise<FalsyAble<DataParsedDocument>>;
}

export type DocCompilers = Record<string, DocumentCompiler>;



export async function getDocumentCompiler(idString: string, resolvePathRoots: SingleOrArray<FalsyAble<string>>, compilersCache: FalsyAble<DocCompilers>, config?: SsgConfig): Promise<FalsyAble<DocumentCompiler>> {

    if (!config) {
        config = {};
    }

    if (!config.compilers) {
        config.compilers = {};
    }

    if (!compilersCache) {
        compilersCache = config.compilers;
    }

    if (!resolvePathRoots) {
        resolvePathRoots = [];
    }

    if (config.compilerResolvePaths) {
        resolvePathRoots = (arrayifyFilter(resolvePathRoots) as string[]).concat(config.compilerResolvePaths);
    }

    const absTargetRunnerPath: string | null = findExistingPathFromRelative(resolvePathRoots, idString);

    if (absTargetRunnerPath) {

        const existingCompiler: DocumentCompiler | undefined = compilersCache[ absTargetRunnerPath ];

        if (!existingCompiler) {

            //TODO: these are not really DocumentCompilers (need to define a module interface)
            const loadedModule: CompilerModule = await import(absTargetRunnerPath);
            //loadTsModule(absTargetRunnerPath, compilersCache);
            compilersCache[ absTargetRunnerPath ] = loadedModule.getCompiler();
        }

        idString = absTargetRunnerPath;
    }

    const selectedCompiler: DocumentCompiler | null = compilersCache[ idString ];
    return selectedCompiler;
}

export function getDataExtractedDocOfContent(documentContents: string | DataParsedDocument, docData?: DocumentData | null): DataParsedDocument {
    if (typeof documentContents === 'string') {
        return {
            content: documentContents,
            data: docData
        };
    }
    return documentContents;
}

export async function alternativeProcessCompileDocument(inputsAndDocToCompile: DocumentCompileData, config?: SsgConfig): Promise<DocumentCompileData | null> {


    const fragmentCache: FragmentCache | undefined = config?.fragmentCache;
    let cachedFragment: DocumentCompileData | null = null;
    /*const compileInputs: CompileInputs = {
        contents: inputsAndDocToCompile.content,
        data: inputsAndDocToCompile.data,
        passedData: null,
    };*/
    if (fragmentCache && fragmentCache.getExistingFragmentFromCache) {
        cachedFragment = await fragmentCache.getExistingFragmentFromCache(inputsAndDocToCompile);
    }
    return cachedFragment;
}

export async function postProcessCompiledDocument(input: DocumentCompileData, output: DocumentCompileData, config?: SsgConfig): Promise<DocumentCompileData> {
    const fragmentCache: FragmentCache | undefined = config?.fragmentCache;
    if (fragmentCache && fragmentCache.storeUpdatedCompiledFragment) {
        /*const compileOutputs: CompileOutputs = {
            contents: output.content,
            data: dataExtDoc.data,
        };*/
        await fragmentCache.storeUpdatedCompiledFragment(input, output);
    }
    return output;
}

export type FalsyAble<ItemType> = ItemType | null | undefined;

export function mergeLocalAndParamData(localDocData: FalsyAble<DocumentData>, paramData: FalsyAble<DocumentData>): DocumentData {

    if (!localDocData && !paramData) {
        return {};
    }
    if (!localDocData) {
        localDocData = {};
    }
    if (!paramData) {
        paramData = {};
    }

    const mergedCtxData: DocumentData = Object.assign({}, localDocData, paramData);
    return mergedCtxData;
}

export async function compileDocument(inputData: DocumentCompileData, compiler: DocumentCompiler, config?: SsgConfig): Promise<DocumentCompileData | null> {
    if (!compiler) {
        throw new Error(`No compiler was passed for compiling the document data`);
    }

    const cachedFragment: DocumentCompileData | null = await alternativeProcessCompileDocument(inputData, config);

    if (cachedFragment && cachedFragment?.content) {
        return cachedFragment;
    }

    const inputCtxData: DocumentData = mergeLocalAndParamData(inputData.data, inputData.dataCtx);

    const parsedOutputDoc: FalsyAble<DataParsedDocument> = await compiler.compile(inputData.content, inputCtxData, config);
    if (!parsedOutputDoc) {
        return null;
    }

    let output: DocumentCompileData = {
        content: parsedOutputDoc.content,
        data: inputData.data,
        dataCtx: parsedOutputDoc.data || {},
    };

    output = await postProcessCompiledDocument(
        inputData,
        output,
        config
    );

    //const layouts = output.data.layout || output.dataCtx.layout
    //When defined compile the layouts

    return output;
}

export async function compileDocumentWithExt(inputData: DocumentCompileData, documentTypeExt: string, docCompilers?: DocCompilers, config?: SsgConfig): Promise<DocumentCompileData | null> {
    const defaultDocCompilers: DocCompilers = await getDefaultDocCompilers();
    docCompilers = setDefaults(docCompilers, defaultDocCompilers);
    setDefaultFragmentCache(config);

    const inputPath: string | undefined = inputData.dataCtx?.inputPath;
    const selectedCompiler: FalsyAble<DocumentCompiler> = await getDocumentCompiler(documentTypeExt, [ inputPath ], docCompilers, config);

    if (!selectedCompiler) {
        throw new Error(`No compiler found for extension ${documentTypeExt}`);
    }

    if (!inputData.content) {
        throw new Error(`Document has not contents to compile ${inputData.content}`);
    }

    return compileDocument(inputData, selectedCompiler, config);
}

//Helper fn for calling from external (internally compileDocumentWithExt should be mainly used)
export async function compileDocumentString(documentContents: string | DataParsedDocument, dataCtx: any | null | undefined, documentTypeExt: string, config?: SsgConfig): Promise<DocumentCompileData | null> {
    const document: DataParsedDocument = getDataExtractedDocOfContent(documentContents, null);

    if (!document.content) {
        throw new Error(`Document has not contents to compile ${documentContents}`);
    }

    const compileInputData: DocumentCompileData = Object.assign({}, document, { dataCtx });

    return compileDocumentWithExt(compileInputData, documentTypeExt, config?.compilers, config);
}

export async function compileFile(srcFilePath: string, data: FalsyAble<DocumentData>, config?: SsgConfig): Promise<FalsyAble<string>> {

    if (!fs.existsSync(srcFilePath)) {
        //return null;
        throw new Error(`Src file at ${srcFilePath} does not exist`);
    }

    const srcFilePathParsed: path.ParsedPath = path.parse(srcFilePath);
    const srcFilePathName = srcFilePathParsed.name;
    let documentTypeExt = srcFilePathParsed.ext;
    documentTypeExt = cleanUpExt(documentTypeExt);


    let docFileContent = await fs.promises.readFile(srcFilePath).toString();

    if (!docFileContent || docFileContent.length <= 0) {
        throw new Error(`File ${srcFilePath} is empty -> nothing to compile`);
        //return null;
    }

    let dataExtractedDocument: DataParsedDocument = await extractData(docFileContent, documentTypeExt, config?.dataExtractors, config);


    if (!dataExtractedDocument.data) {
        dataExtractedDocument.data = {};
    }
    if (!data) {
        data = {};
    }
    //dataExtractedDocument.data.inputPath = srcFilePath;
    data.inputPath = srcFilePath;

    const docToCompile = dataExtractedDocument || docFileContent;

    const compiledDocument: DocumentCompileData | null = await compileDocumentString(docToCompile, data, documentTypeExt, config);

    return compiledDocument?.content;
}

export async function compileFileTo(srcFilePath: string, targetFilePath: string, data: FalsyAble<DocumentData>, config?: SsgConfig): Promise<FalsyAble<string>> {
    const compiledDocumentContents: FalsyAble<string> = await compileFile(srcFilePath, data, config);

    if (compiledDocumentContents) {
        await fs.promises.writeFile(targetFilePath, compiledDocumentContents);
    }
    return compiledDocumentContents;
}