import { SsgConfig } from "../config";
import { FalsyString } from "../utils/util";
import { HtmlRunner } from "./html-runner";
import { CompileRunner, ResourceRunner } from "./runners";

export class NetworkHtmlRunner implements ResourceRunner {
    protected htmlRunner;
    public extractData;
    public compile;

    constructor () {
        this.htmlRunner = new HtmlRunner();
        this.extractData = this.htmlRunner.extractData;
        this.compile = this.htmlRunner.compile;
    }

    async readResource(resourceId: string, targetId: string, config: SsgConfig): Promise<any> {
        const fetchedResourceResult: Response = await fetch(resourceId);
        return fetchedResourceResult.json();
    }
    async writeResource(compiledResource: any, resourceId: FalsyString, targetId: string, config: SsgConfig): Promise<void> {
        //throw new Error("Method not implemented.");
        this.htmlRunner.writeResource(compiledResource, resourceId, targetId, config);
    }
}

export function getInstance(): CompileRunner {
    return new NetworkHtmlRunner();
}