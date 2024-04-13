import path from "path";
import { SsgConfig } from "../config";
import { FalsyAble, FalsyString } from "../utils/util";
import { FileRunner } from "./file-runner";
import { DocumentData, DataParsedDocument, CompileRunner, ResourceRunner } from "./runners";
import { getTsModuleCompilerData, callTsModuleCompile, TsRunner } from "./ts-runner";
import * as fs from 'fs';

export class AssetRunner implements ResourceRunner {

    //Usually a resource is the - component file (has data func for data extraction + preperation, and render for the actual tranformation of data)
    public async readResource(resourceId: string, targetId: string, config: SsgConfig): Promise<any> {
        //return resourceId;
    }

    //Extract
    public async extractData(resourceData: string, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | DocumentData | null> {

        const filePath: string = dataCtx?.src;
        const filePathParsed: path.ParsedPath = path.parse(filePath);
        const filePathName = filePathParsed.name;
        const filePathExt = filePathParsed.ext;

        return {
            path: filePath,
            name: filePathName,
            ext: filePathExt,
        };
    }

    //Transform
    public async compile(resourceData: string | null | undefined, dataCtx?: DocumentData | null, config?: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        return {
            content: {
                src: dataCtx?.path,
                target: dataCtx?.target,
            },
            data: dataCtx
        };
    }

    //Write
    public async writeResource(writeInfo: any, resourceId: FalsyString, targetId: string, config: SsgConfig): Promise<void> {
        //throw new Error("Method not implemented.");

        if (writeInfo?.src && writeInfo?.target) {
            return fs.promises.copyFile(writeInfo.src, writeInfo.target);
        }
        return;
    }
}

export function getInstance(): CompileRunner {
    return new AssetRunner();
}