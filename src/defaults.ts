import matter from "gray-matter";
import markdownit from "markdown-it/lib";
import { DataExtractors } from "./data-extract";
import { DocCompilers, FalsyAble } from "./document-compile";
import { defaultFragmentCache } from "./fragement-cache";
import { defaultTsDataExtractor, defaultTsDocumentCompiler } from "./compilers/ts-runner";
import { defaultMarkdownDataExtractor, defaultMarkdownDocumentCompiler } from "./compilers/md-runner";
import { defaultHtmlDataExtractor, defaultHtmlDocumentCompiler } from "./compilers/html-runner";
import { defaultNjkDataExtractor, defaultNjkDocumentCompiler } from "./compilers/njk-runner";

export function getDefaultDataExtractors(): DataExtractors {
    const extractors: DataExtractors = {};
    extractors.md = defaultMarkdownDataExtractor;
    extractors.ts = defaultTsDataExtractor;
    extractors.html = defaultHtmlDataExtractor;
    extractors.njk = defaultNjkDataExtractor;

    return extractors;
}
export const defaultDataExtractors: DocCompilers = getDefaultDocCompilers();


export function getDefaultDocCompilers(): DocCompilers {
    const docCompilers: DocCompilers = {};
    docCompilers.md = defaultMarkdownDocumentCompiler;
    docCompilers.ts = defaultTsDocumentCompiler;
    docCompilers.html = defaultHtmlDocumentCompiler;
    docCompilers.njk = defaultNjkDocumentCompiler;

    return docCompilers;
}
export const defaultDocCompilers: DocCompilers = getDefaultDocCompilers();

export function setDefaultFragmentCache(config: any): void {
    if (!config.fragmentCache) {
        config.fragmentCache = defaultFragmentCache;
    }
}