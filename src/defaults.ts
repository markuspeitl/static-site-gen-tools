import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import { DataExtractor, DataExtractors, DocumentData } from "./data-extract";
import { DataParsedDocument, DocCompilers, DocumentCompiler } from "./document-compile";
import { defaultFragmentCache } from "./fragement-cache";

const mdItInstance = markdownit();
export const defaultMarkdownDocumentCompiler: DocumentCompiler = {
    compile: async (fileContent: string | null | undefined, dataCtx?: DocumentData | null, config?: any) => {

        if (!fileContent) {
            return null;
        }
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);

        const compiledOutput: DataParsedDocument = {
            content: mdItInstance.render(fileContent),

            //If any from outside accessible data properties or functions get defined within the component evaluated from 
            //fileContent, then these are added into the dataCtx (might be necessary to somehow scope them though to prevent collisions)
            data: dataCtx
        };

        return compiledOutput;
    }
};

export const defaultMarkdownDataExtractor: DataExtractor = {
    extractData: async (fileContent: string, config?: any) => {

        const dataParsedMdFile: matter.GrayMatterFile<string> = matter(fileContent);
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        //mdItInstance.render(fileContent);

        return dataParsedMdFile.data;
    }
};

export function getDefaultDataExtractors(): DataExtractors {
    const extractors: DataExtractors = {};
    extractors.md = defaultMarkdownDataExtractor;
    return extractors;
}
export const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();


export function getDefaultDocCompilers(): DocCompilers {
    const docCompilers: DocCompilers = {};
    docCompilers.md = defaultMarkdownDocumentCompiler;
    return docCompilers;
}
export const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();

export function setDefaultFragmentCache(config: any): void {
    if (!config.fragmentCache) {
        config.fragmentCache = defaultFragmentCache;
    }
}