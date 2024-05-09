import { HtmlRunner } from "../../../compilers/html-runner";
import { DocumentData, DataParsedDocument, CompileRunner } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { BaseRunnerComponent } from "../../base-runner-component";
import { FalsyAble } from '../../helpers/generic-types';

export abstract class DataComponent extends BaseRunnerComponent {
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new HtmlRunner();
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        return {
            content: dataCtx?.content,
            data: dataCtx,
        };
    }
}