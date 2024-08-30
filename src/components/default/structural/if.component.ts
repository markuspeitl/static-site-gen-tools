import type { SsgConfig } from "../../../config/ssg-config";
import type { IProcessResource } from "../../../processors/shared/i-processor-resource";

import { getScopedEvalFn } from "@markus/ts-node-util-mk1";
import { BaseComponent, IInternalComponent } from "../../base/i-component";

export interface IIfResource extends IProcessResource {
    cond: string,
}

export abstract class IfComponent implements BaseComponent, IInternalComponent {
    public canCompile(resource: IIfResource, config: SsgConfig): boolean {
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
        if (!this.canCompile(resource as IIfResource, config)) {
            return resource;
        }

        const conditionExpression: string = resource.cond;

        const conditionFn = getScopedEvalFn(resource, conditionExpression);
        const truthyValue: boolean = Boolean(conditionFn());

        if (truthyValue) {
            //const stagesRunId: string = "__if-body_" + conditionExpression;
            return config.processor.renderFork(resource, config, "__if-body_" + conditionExpression);
        }

        resource.content = '';
        return resource;
    }
}