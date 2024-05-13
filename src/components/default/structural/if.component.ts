import { DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { getScopedEvalFn } from "../../../utils/fn-apply";
import { BaseComponent, IInternalComponent } from "../../base-component";

export abstract class IfComponent implements BaseComponent, IInternalComponent {
    public canCompile(resource: DataParsedDocument, config?: SsgConfig): boolean {
        if (!resource.data) {
            console.error("Can not compile 'if' component -> data needs to be set");
            return false;
        }

        if (!resource.data.cond) {
            console.error("Invalid 'if' component -> needs to have a condition with the 'cond' attribute");
            return false;
        }

        return true;
    }

    public async data(resource: DataParsedDocument, config: SsgConfig = {}): Promise<DataParsedDocument> {
        return resource;
    }

    public async render(resource: DataParsedDocument, config?: SsgConfig): Promise<DataParsedDocument> {
        if (!this.canCompile(resource, config)) {
            return resource;
        }

        const data: any = resource.data;
        const conditionExpression: string = data.cond;

        const conditionFn = getScopedEvalFn(data, conditionExpression);
        const truthyValue: boolean = Boolean(conditionFn());

        if (truthyValue) {
            return resource;
        }

        resource.content = '';
        return resource;
    }
}