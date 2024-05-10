import { DocumentData, DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { getScopedEvalFn } from "../../../utils/fn-apply";
import { BaseComponent, FnBaseComponent } from "../../base-component";

export abstract class IfComponent implements BaseComponent, FnBaseComponent {

    private getCompileDocumentFromDataCtx(dataCtx?: DocumentData | null): DataParsedDocument {
        const toCompileResource: DataParsedDocument = {
            content: dataCtx?.content,
            data: dataCtx,
        };
        return toCompileResource;
    }
    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {
        return dataCtx || {};
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        if (!dataCtx) {
            return '';
        }
        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);

        if (!dataCtx.cond) {
            console.log("Invalid 'if' component -> needs to have a condition with the 'cond' attribute");
        }

        const data: any = dataCtx.data;

        const conditionExpression: string = data.cond;

        const conditionFn = getScopedEvalFn(data, conditionExpression);
        const truthyValue: boolean = Boolean(conditionFn());

        if (truthyValue) {
            return toCompileResource;
        }

        return {
            content: '',
            data: dataCtx
        };
    }
}