import { FalsyString } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { HtmlRunner } from "./html.runner";
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

    async readResource(resourceId: string, config: SsgConfig): Promise<any> {
        const fetchedResourceResult: Response = await fetch(resourceId);
        return fetchedResourceResult.json();
    }
    async writeResource(compiledResource: any, config: SsgConfig): Promise<void> {
        //throw new Error("Method not implemented.");
        this.htmlRunner.writeResource(compiledResource, config);
    }
}

export function getInstance(): CompileRunner {
    return new NetworkHtmlRunner();
}