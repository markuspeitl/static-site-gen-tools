import { CompileRunner, DataParsedDocument, DocumentData } from "../compilers/runners";
import { SsgConfig } from "../config";
import { BaseComponent, FnBaseComponent } from "./base-component";
import { FalsyAble } from "./helpers/generic-types";

export abstract class BaseRunnerComponent implements BaseComponent, FnBaseComponent {

    protected runner: CompileRunner | null = null;
    public abstract getRunner(config?: SsgConfig): CompileRunner | null;

    private getCompileDocumentFromDataCtx(dataCtx?: DocumentData | null): DataParsedDocument {
        if (!this.runner) {
            this.runner = this.getRunner();
        }

        if (dataCtx?.content && dataCtx?.data) {
            return dataCtx as DataParsedDocument;
        }


        const toCompileResource: DataParsedDocument = {
            content: dataCtx?.content,
            data: dataCtx,
        };
        return toCompileResource;
    }

    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {
        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);
        const dataExtractedDocument: FalsyAble<DataParsedDocument> = await this.runner?.extractData(toCompileResource, config);

        if (dataExtractedDocument) {
            return dataExtractedDocument;
        }

        return toCompileResource;
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);
        const runnerCompiledDoc: FalsyAble<DataParsedDocument> = await this.runner?.compile(toCompileResource, config || {});

        if (runnerCompiledDoc) {
            return runnerCompiledDoc;
        }
        return toCompileResource;
    }

    public checkRunnerThis() {
        console.log(this);
    }
}