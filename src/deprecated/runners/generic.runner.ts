import { packIntoDataOpt } from "../components/helpers/dict-util";
import { FalsyAble, FalsyStringPromise } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { CompileRunner, DataExtractor, DataParsedDocument, DocumentData, getRunnerInstanceChainForResource, ResourceRunner, getRunnerInstance, parseRunnerIds, getRunnerChainInstances, getRunnerIdsFor, getExtractRunnerInstanceChainForResource, getExtractRunnerIdsFor } from './runners';

export interface IMasterRunner extends ResourceRunner {
    extractDataWith(runnerIds: string | string[], resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    compileWith(runnerIds: string | string[], resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}

export async function callOnFirstRunner(fnName: string, resource: DataParsedDocument, config: SsgConfig,): Promise<any> {
    const compileRunner: CompileRunner[] = await getRunnerInstanceChainForResource(resource, config);

    //const resourceId = resource.data.src;
    if (compileRunner && compileRunner.length > 0 && (compileRunner[ 0 ])[ fnName ]) {
        return compileRunner[ 0 ][ fnName ](resource, config);
    }

    return resource;
}

export async function passResourceThroughChain(runnerIds: string | string[], resource: DataParsedDocument, config: SsgConfig, runnerCallFnName: string, ...args: any[]): Promise<FalsyAble<DataParsedDocument>> {
    runnerIds = parseRunnerIds(runnerIds);
    const runnerChain: CompileRunner[] = await getRunnerChainInstances(runnerIds, config);

    let stageProcessedResource: FalsyAble<DataParsedDocument> = resource;
    for (let i = 0; i < runnerChain.length; i++) {
        const selectedRunner = runnerChain[ i ];
        if (selectedRunner[ runnerCallFnName ]) {
            stageProcessedResource = await selectedRunner[ runnerCallFnName ](stageProcessedResource, config, ...args);
        }
    }

    return stageProcessedResource;
}

export class GenericRunner implements ResourceRunner {
    public async readResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<any> {

        if (!resource || !resource.data) {
            return null;
        }

        /*const compileRunner: CompileRunner[] = await getRunnerInstanceChainForResource(resource, config);
        //const resourceId = resource.data.src;
        if (compileRunner && compileRunner.length > 0 && (compileRunner[ 0 ] as ResourceRunner).readResource) {
            return (compileRunner[ 0 ] as ResourceRunner).readResource(resource, config);
        }
        return null;*/

        return callOnFirstRunner('readResource', resource, config);


    }

    public async writeResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<void> {

        /*data = packIntoDataOpt(data, {
            target: targetId,
            src: resourceId
        });*/
        if (!resource || !resource.data) {
            return;
        }

        return callOnFirstRunner('writeResource', resource, config);

        /*const compileRunner: FalsyAble<CompileRunner> = await getRunnerInstanceForResource(resource, config);
        if (!compileRunner || !(compileRunner as ResourceRunner).writeResource) {
            return;
        }

        (compileRunner as ResourceRunner).writeResource(resource, config);*/

        //return compiledResult;
    }


    //Extract data from any identified source that is registered.
    //Other extractors (not only file extractors) should also be possible --> 192.168.0.1/network -- '[0-9\.]+/network.+': NetworkRunner
    //Therefore required are: the src id => in this case *192.168.0.1/network*, the target id 192.168.0.1/network (send result via http) or local file /home/test/some.html, .etc



    public async extractDataWith(runnerIds: string | string[], resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        runnerIds = parseRunnerIds(runnerIds);
        const dataExtractedResource: FalsyAble<DataParsedDocument> = await passResourceThroughChain(runnerIds, resource, config, 'extractData');
        return dataExtractedResource;

    }
    //input: identity of the data source
    //output: extracted data, and rest content of the data source without extracted data
    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        if (!resource) {
            return {};
        }
        if (!resource.data) {
            resource.data = {};
        }
        if (!resource.data.extractRunner) {
            resource.data.extractRunner = [];
        }

        const runnerIds: string[] = await getExtractRunnerIdsFor(resource, config);
        resource.data.extractRunner = runnerIds;
        return this.extractDataWith(resource.data.extractRunner, resource, config);

        //Load template defaults
        //await setDefaultRunnerInstantiatorsFromFiles(config);

        //return callOnFirstRunner('extractData', resource, config);

        //const extractRunnerChain: CompileRunner[] = getExtractRunnerInstanceChainForResource(resource, config);

        //documentTypeExt = cleanUpExt(documentTypeExt);
        /*const dataExtractorInstance: FalsyAble<DataExtractor> = await getRunnerInstanceForResource(resource, config);
        if (!dataExtractorInstance) {
            return resource;
        }

        const dataExtractedDoc: FalsyAble<DataParsedDocument> = await dataExtractorInstance.extractData(resource.content, config);

        return dataExtractedDoc;*/
    }

    public async compileWith(runnerIds: string | string[], resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.data) {
            return null;
        }

        if (!resource.data.src && !resource.data.compileRunner) {
            //Needs to be specified for automatic compile runner selection
            return null;
            //Todo add this to select specifically
            //data.compileRunner;
        }

        if (!resource.content) {
            resource = await this.readResource(resource, config);
        }
        if (!resource) {
            return null;
        }

        console.log(resource);


        const dataExtractedDoc: FalsyAble<DataParsedDocument> = await this.extractData(resource, config);
        console.log(dataExtractedDoc);

        //Document and context data merging ()
        if (dataExtractedDoc) {
            dataExtractedDoc.data = Object.assign(resource.data || {}, dataExtractedDoc?.data || {});
            resource = dataExtractedDoc;
        }
        resource = dataExtractedDoc;

        //const dataExtractedDoc: FalsyAble<DataParsedDocument> = resource;

        /*if (compileRunnerInstance?.extractData) {
            const dataExtractedDoc: FalsyAble<DataParsedDocument> = await compileRunnerInstance.extractData(resource, config);

            //Document and context data merging ()
            if (dataExtractedDoc) {
                dataExtractedDoc.data = Object.assign(resource.data || {}, dataExtractedDoc?.data || {});
                resource = dataExtractedDoc;
            }
            
        }*/
        //const mergedData = Object.assign(resource?.data || {}, data);

        //const compileRunnerChain: CompileRunner[] = await getRunnerInstanceChainForResource(resource, config);

        runnerIds = parseRunnerIds(runnerIds);
        const compiledResource: FalsyAble<DataParsedDocument> = await passResourceThroughChain(runnerIds, resource || {}, config, 'compile');

        /*const compileRunnerInstance: FalsyAble<CompileRunner> = await getRunnerInstanceForResource(resource, config);
        if (!compileRunnerInstance) {
            return null;
        }
        const compiledResource: FalsyAble<DataParsedDocument> = await compileRunnerInstance.compile(resource, config);*/

        //const targetCompileRunnerInstance: FalsyAble<ResourceRunner> = await findRunnerInstanceFor(resource?.data?.target, config) as ResourceRunner;
        /*if (targetCompileRunnerInstance && targetCompileRunnerInstance.writeResource) {
            await targetCompileRunnerInstance.writeResource(compiledResource, config);
        }*/

        await this.writeResource(compiledResource, config);

        /*if (compileRunnerInstance && (compileRunnerInstance as ResourceRunner).writeResource) {
            await (compileRunnerInstance as ResourceRunner).writeResource(compiledResource, config);
        }*/

        return compiledResource;
    }
    //Main entry for the generic-runner ==> we want to compile a resource from src to target
    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig = {}): Promise<FalsyAble<DataParsedDocument>> {
        if (!resource) {
            return null;
        }
        if (!resource.data) {
            resource.data = {};
        }

        const runnerIds: string[] = await getRunnerIdsFor(resource, config);
        resource.data.compileRunner = runnerIds;

        return this.compileWith(resource.data.compileRunner, resource, config);
    }

    //readResource
}

export function getInstance(): CompileRunner {
    return new GenericRunner();
}