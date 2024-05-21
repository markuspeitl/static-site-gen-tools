import { DataParsedDocument } from "../compilers/runners";
import { SsgConfig } from "../config";
import { IResourceProcessor } from "../processing/i-resource-processor";

export function configureStage(stageConfig: any): any {

}

export function initializeStage(stageConfig: any): any {

}


export interface IConfigInit {
    configure(config: any): any;
    initialize(config: any): any;
}

export class PipelineStage implements IConfigInit, IResourceProcessor {
    public id: string = '';
    public guard: string | any = null;

    //Possible strategies
    //Distribute to all subChains that can handle resource
    //Pass through subchains that can handle
    //Find first subchains that can handle and use only that
    public subProcessors: IResourceProcessor[];
    //TODO: there should be no seperation between the full resource pipeline eg. a list of all stages
    //and the PipelineStage itself --> definitions can be recusively nested

    configure(config: any) {
        throw new Error("Method not implemented.");
    }
    initialize(config: any) {
        throw new Error("Method not implemented.");
    }

    canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        throw new Error("Method not implemented.");
    }
}