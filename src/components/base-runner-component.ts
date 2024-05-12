import { CompileRunner, DataParsedDocument, DocumentData } from "../compilers/runners";
import { SsgConfig } from "../config";
import { BaseComponent, FnBaseComponent } from "./base-component";
import { FalsyAble } from "./helpers/generic-types";

export abstract class BaseRunnerComponent implements BaseComponent, FnBaseComponent {
    public abstract getRunnerIds(config?: SsgConfig): string | string[];

    private getCompileDocumentFromDataCtx(dataCtx?: DocumentData | null): DataParsedDocument {
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

        const runnerIds: string | string[] = this.getRunnerIds();
        if (!config.masterCompileRunner) {
            throw new Error("Can not process component if 'config.masterCompileRunner' is not defined");
        }
        if (!runnerIds) {
            throw new Error("Can not compile component if no runner was specified");
        }

        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);

        const dataExtractedDocument: FalsyAble<DataParsedDocument> = await config.masterCompileRunner.extractDataWith(runnerIds, toCompileResource, config);
        if (!dataExtractedDocument) {
            return toCompileResource;
        }
        return dataExtractedDocument;
    }
    public async render(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | string> {
        const runnerIds: string | string[] = this.getRunnerIds();
        if (!config.masterCompileRunner) {
            throw new Error("Can not process component if 'config.masterCompileRunner' is not defined");
        }
        if (!runnerIds) {
            throw new Error("Can not compile component if no runner was specified");
        }

        const toCompileResource: DataParsedDocument = this.getCompileDocumentFromDataCtx(dataCtx);

        const runnerCompiledDoc: FalsyAble<DataParsedDocument> = await config.masterCompileRunner.compileWith(runnerIds, toCompileResource, config);
        if (!runnerCompiledDoc) {
            return toCompileResource;
        }
        return runnerCompiledDoc;
    }
}

/*export abstract class BaseRunnerComponent implements BaseComponent, FnBaseComponent {

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
    public async render(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | string> {
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
}*/