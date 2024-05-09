import { packIntoDataOpt } from "../components/helpers/dict-util";
import { FalsyAble, FalsyStringPromise } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { CompileRunner, DataExtractor, DataParsedDocument, DocumentData, findRunnerInstanceFor, getRunnerInstanceForResource, ResourceRunner, setDefaultRunnerInstantiatorsFromFiles } from "./runners";

export abstract class GenericRunner implements ResourceRunner {
    public async readResource(resourceId: string, config: SsgConfig): Promise<any> {
        const compileRunner: FalsyAble<CompileRunner> = await findRunnerInstanceFor(resourceId, config);

        if (compileRunner && (compileRunner as ResourceRunner).readResource) {
            return (compileRunner as ResourceRunner).readResource(resourceId, config);
        }

        return null;
    }

    public async writeResource(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<void> {

        /*data = packIntoDataOpt(data, {
            target: targetId,
            src: resourceId
        });*/
        if (!resource || !resource.data) {
            return;
        }

        const compileRunner: FalsyAble<CompileRunner> = await getRunnerInstanceForResource(resource, config);

        if (!compileRunner || !(compileRunner as ResourceRunner).writeResource) {
            return;
        }

        (compileRunner as ResourceRunner).writeResource(resource, config);

        //return compiledResult;
    }


    //Extract data from any identified source that is registered.
    //Other extractors (not only file extractors) should also be possible --> 192.168.0.1/network -- '[0-9\.]+/network.+': NetworkRunner
    //Therefore required are: the src id => in this case *192.168.0.1/network*, the target id 192.168.0.1/network (send result via http) or local file /home/test/some.html, .etc

    //input: identity of the data source
    //output: extracted data, and rest content of the data source without extracted data
    public async extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>> {
        if (!resource) {
            return {};
        }

        //Load template defaults
        await setDefaultRunnerInstantiatorsFromFiles(config);

        //documentTypeExt = cleanUpExt(documentTypeExt);
        const dataExtractorInstance: FalsyAble<DataExtractor> = await getRunnerInstanceForResource(resource, config);
        if (!dataExtractorInstance) {
            return resource;
        }

        const dataExtractedDoc: FalsyAble<DataParsedDocument> = await dataExtractorInstance.extractData(resource.content, config);

        return dataExtractedDoc;
    }

    //Main entry for the generic-runner ==> we want to compile a resource from src to target
    public async compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig = {}): Promise<FalsyAble<DataParsedDocument>> {

        if (!resource || !resource.data) {
            return null;
        }

        if (!resource.data.src && !resource.data.compileRunner) {
            //Needs to be specified for automatic compile runner selection
            return null;
            //Todo add this to select specifically
            //data.compileRunner;
        }

        const compileRunnerInstance: FalsyAble<CompileRunner> = await getRunnerInstanceForResource(resource, config);
        if (!compileRunnerInstance) {
            return null;
        }

        if (!resource.content) {
            resource.content = this.readResource(resource.data.src, config);
        }
        if (compileRunnerInstance?.extractData) {
            const dataExtractedDoc: FalsyAble<DataParsedDocument> = await compileRunnerInstance.extractData(resource, config);

            //Document and context data merging ()
            if (dataExtractedDoc) {
                dataExtractedDoc.data = Object.assign(resource.data || {}, dataExtractedDoc?.data || {});
            }
            resource = dataExtractedDoc;
        }

        //const mergedData = Object.assign(resource?.data || {}, data);

        const compiledResource: FalsyAble<DataParsedDocument> = await compileRunnerInstance.compile(resource, config);

        const targetCompileRunnerInstance: FalsyAble<ResourceRunner> = await findRunnerInstanceFor(resource?.data?.target, config) as ResourceRunner;
        if (targetCompileRunnerInstance && targetCompileRunnerInstance.writeResource) {
            await targetCompileRunnerInstance.writeResource(compiledResource, config);
        }

        return compiledResource;
    }

    //readResource


}