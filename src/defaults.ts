import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import { DataExtractor, DataExtractors } from "./data-extract";
import { DocCompilers, DocumentCompiler } from "./document-compile";

const mdItInstance = markdownit();
export const defaultMarkdownDocumentCompiler: DocumentCompiler = {
    compile: async (fileContent: string, config?: any) => {
        //const dataParsedMdFile: matter.GrayMatterFile<string> = matter.read(srcFilePath);
        return mdItInstance.render(fileContent);
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