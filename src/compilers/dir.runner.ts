import { SsgConfig } from "../config";
import { CompileRunner, DataParsedDocument, DocumentData, ResourceRunner } from "./runners";
import { FalsyAble, FalsyString, FalsyStringPromise } from "../components/helpers/generic-types";
import path from "path";
import * as fs from 'fs';
import { getFsNodeStat, walkYieldFiles } from "../utils/fs-util";

//CompileRunner, ResourceWriter, 
export class DirRunner implements ResourceRunner {
    public async readResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.data?.src) {
            return null;
        }

        let dirStat: fs.Stats | null = await getFsNodeStat(resource.data.src);
        if (!dirStat) {
            resource.data.src = path.resolve(resource.data.src);
            dirStat = await getFsNodeStat(resource.data.src);
        }

        if (!dirStat) {
            return null;
        }

        if (!dirStat.isDirectory()) {
            return null;
        }

        //Get all files of dir

        /*const readResource: DataParsedDocument = {
            content: null,
            data: {
                childData: []
            }
        };*/

        resource.data.childData = [];

        const descendantFilePaths: string[] = [];

        for await (const filePath of walkYieldFiles(resource.data.src)) {

            descendantFilePaths.push(filePath);

            /*const childResourceInfo = {
                src: filePath,
            }
            readResource.data?.childData.push(filePath);*/
        }

        resource.content = descendantFilePaths;
        return resource;

        /*return {
            content: descendantFilePaths,
            data: {
                src: resource.data.src
            }
        };*/
    }

    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        //Particular files in the dir: data.json, `$dirname`.json => shared with all to be compiled component instances of the src dir

        const descendantFilePaths: string[] = resource.content;
        const dirData: any = resource.data;

        const dirPath: string = dirData.src;
        const targetDirPath: string = dirData.target;

        const dirDataRegex: RegExp = new RegExp(`${dirPath}(data\.json|data\.ts|data\.js)`, 'i');

        const dirDataFiles: string[] = descendantFilePaths.filter((filePath: string) => dirDataRegex.test(filePath));

        const dataFileContents: any[] = [];
        for (const dataFilePath of dirDataFiles) {
            const dataFileModule: any = await import(dataFilePath);
            const dataJson = dataFileModule.default();
            dataFileContents.push(dataJson);
        }
        const mergedDataFiles: any = Object.assign({}, ...dataFileContents);


        const subCompileDataList: any[] = [];
        for (const subFilePath of descendantFilePaths) {

            const relPathToDir: string = path.relative(dirPath, subFilePath);
            const targetFilePath: string = path.join(targetDirPath, relPathToDir);

            let subFileData: any = {
                src: subFilePath,
                target: targetFilePath
            };

            subFileData = Object.assign(mergedDataFiles, subFileData);

            subCompileDataList.push(subFileData);
        }


        return {
            content: null,
            data: {
                subDataList: subCompileDataList
            }
        };
    }
    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!config.masterCompileRunner) {
            return null;
        }

        const subCompileDataList: any[] = resource?.data?.subDataList;
        if (!subCompileDataList || subCompileDataList.length === 0) {
            return null;
        }

        const compilePromises: any[] = [];
        for (const subCompileData of subCompileDataList) {

            const compileDoc: DataParsedDocument = {
                content: null,
                data: subCompileData
            };

            const compilePromise: Promise<FalsyAble<DataParsedDocument>> = config.masterCompileRunner.compile(compileDoc, config);
            //const compiledSubDoc: FalsyAble<DataParsedDocument> = await
            compilePromises.push(compilePromise);
        }

        const compiledDocs: FalsyAble<DataParsedDocument>[] = await Promise.all(compilePromises);

        return resource;
    }

    public async writeResource(compiledResource: DataParsedDocument, config: SsgConfig): Promise<void> {
        //return writeFileResource(compiledResource, config);
    }
}

export function getInstance(): CompileRunner {
    return new DirRunner();
}