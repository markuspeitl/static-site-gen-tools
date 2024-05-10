import path from "path";
import { SsgConfig } from "../config";
import { FileRunner } from "./file.runner";
import { DocumentData, DataParsedDocument, CompileRunner, ResourceRunner } from "./runners";
import * as fs from 'fs';
import { FalsyAble, FalsyString } from "../components/helpers/generic-types";

export class AssetRunner implements ResourceRunner {

    //Usually a resource is the - component file (has data func for data extraction + preperation, and render for the actual tranformation of data)
    public async readResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<any> {
        //return resourceId;
        return resource;
    }

    //Extract
    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        const filePath: string = resource.data?.src;
        const filePathParsed: path.ParsedPath = path.parse(filePath);
        const filePathName = filePathParsed.name;
        const filePathExt = filePathParsed.ext;


        const extractedAssetInfo: any = {
            path: filePath,
            name: filePathName,
            ext: filePathExt,
        };

        //Data merging could be deferred to caller -> return resource with replaced data
        //Object.assign(resource.data || {}, extractedAssetInfo);

        return {
            content: resource.content,
            data: extractedAssetInfo
        };
    }

    //Transform
    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        return {
            content: null,
            data: resource?.data,
        };
    }

    //Write
    public async writeResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<void> {
        //throw new Error("Method not implemented.");
        if (!resource) {
            return;
        }

        if (resource.data?.src && resource.data?.target) {
            return fs.promises.copyFile(resource.data.src, resource.data.target);
        }
        return;
    }
}

export function getInstance(): CompileRunner {
    return new AssetRunner();
}