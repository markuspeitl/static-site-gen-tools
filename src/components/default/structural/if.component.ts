import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../pipeline/i-processor";

import { getScopedEvalFn } from "@markus/ts-node-util-mk1";
import { BaseComponent, IInternalComponent } from "../../base-component";

export abstract class IfComponent implements BaseComponent, IInternalComponent {
    public canCompile(resource: IProcessResource, config: SsgConfig): boolean {
        if (!resource) {
            console.error("Can not compile 'if' component -> data needs to be set");
            return false;
        }

        if (!resource.cond) {
            console.error("Invalid 'if' component -> needs to have a condition with the 'cond' attribute");
            return false;
        }

        return true;
    }

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }

    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        if (!this.canCompile(resource, config)) {
            return resource;
        }

        const data: any = resource;
        const conditionExpression: string = data.cond;

        const conditionFn = getScopedEvalFn(data, conditionExpression);
        const truthyValue: boolean = Boolean(conditionFn());

        if (truthyValue) {
            //const stagesRunId: string = "__if-body_" + conditionExpression;
            return config.processor.renderFork(resource, config, "__if-body_" + conditionExpression);
        }

        resource.content = '';
        return resource;
    }
}