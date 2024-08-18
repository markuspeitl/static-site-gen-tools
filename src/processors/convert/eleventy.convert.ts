import type { SsgConfig } from "../../config/ssg-config";
import type { IProcessResource, IResourceProcessor } from '../../processors/shared/i-processor-resource';
import { getLibInstance } from "../../dependencies/lib-module-instances";
import { getKeyFromDict, loadDataAsync, wrapContents } from "@markus/ts-node-util-mk1";

import path from "path";
import * as fs from 'fs';
import * as lodash from 'lodash';

export async function loadInheritedDataFor(
    resourcePath: string,
    inputRootDir: string,
    initialData?: any
): Promise<any> {

    const resourceDir: string = path.dirname(resourcePath);

    const rootRelativeDirPath = path.relative(inputRootDir, resourceDir);

    const dirPathHierarchyParts = rootRelativeDirPath.split('/');

    let currentRootDir = inputRootDir;

    if (!initialData) {
        initialData = {};
    }

    let currentParsedData = initialData;

    for (const currentPathPart of dirPathHierarchyParts) {
        const currentFullDirPath: string = path.join(currentRootDir, currentPathPart);

        const dataFilePath = path.join(currentFullDirPath, currentPathPart + ".11tydata.js");

        const loadedData: any | null = await loadDataAsync(dataFilePath);

        if (loadedData) {
            //Object.assign(currentParsedData, currentParsedData)
            currentParsedData = lodash.merge(currentParsedData, currentParsedData);
        }
        /*if (fs.existsSync(dataFilePath)) {
            
        }*/

        currentRootDir = currentFullDirPath;
    }

    return currentParsedData;
}

export interface EleventyData {
    content: string,
    this: any; //Eleventy context through which 'shortcodes', .etc can be called (would be usually bound to this -> but is a bad practice)
    page: {
        fileSlug: string; //file name of document as a slug
        inputPath: string; //full (relative?) input file path
        outputPath: string; //full (relative?) output file path
        filePathStem: string; //relative file path (or directory?) to inputDir root
    };

    template: any;
    templateContent: string;

    //data: any;
    date: string;
    /*filePathStem: string;
    fileSlug: string;
    inputPath: string;
    outputPath: string;*/
}

//Special data attrs
//permalink -> relative output path of the rendered page


export function resourceTo11tyComponentData(

): any {

}

//Convert from 11ty templates format to bssg components format
export class EleventyConvert implements IResourceProcessor {
    id: string = 'eleventy.convert';

    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {

        const inputFormat = getKeyFromDict(resource, 'data.document.inputFormat');
        const inputFormats = [
            '.md',
            '.njk',
            '.liquid'
        ];
        if (inputFormats.includes(inputFormat)) {
            return true;
        }
        return false;
    }*/
    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }

        const inputPath = getKeyFromDict(resource, 'data.document.src');
        if (!inputPath) {
            return resource;
        }

        const inputDir = getKeyFromDict(resource, 'data.document.dir');

        const ancestorData = loadInheritedDataFor(inputPath, inputDir, config.data.globalData);

        const dataExtractedResource: IProcessResource = await config.processor.processFork(
            resource,
            config,
            [ 'extractor' ]
        );
        const currentData = lodash.merge(ancestorData, dataExtractedResource.data);
        resource = currentData;

        const renderContent = dataExtractedResource.content;

        //TODO inject shortcodes like 'renderFile' into njk (but not in the processor -> during init)
        //TODO simulate 11ty collections -> through collections rendered templates can be accessed
        //TODO load global config data during init
        //Note: global data in eleventy is *special* --> data files with the same name are merged ->
        //then this data is put into a dict in the form { <cleanFileName>: loadedData }
        //And when a template is rendered this key:value pair is passed the data context

        let wrappedRenderContent: string = wrapContents('njk', renderContent);

        if (dataExtractedResource.data.layout) {

            const fullLayoutPath = path.join(config.data.includesDir, dataExtractedResource.data.layout);
            /*if (!config.defaultImportSymbolPaths) {
                config.defaultImportSymbolPaths = []
                config.defaultImportSymbolPaths.push(config.includesDir)
            }*/

            wrappedRenderContent = wrapContents('file', wrappedRenderContent, {
                path: fullLayoutPath
            });
        }

        resource.content = wrappedRenderContent;

        return config.processor.processStages(resource, config);
    }
}