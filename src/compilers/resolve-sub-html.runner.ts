import { FalsyAble } from "../components/helpers/generic-types";
import { SsgConfig } from "../config";
import { FileRunner } from "./file.runner";
import { DataParsedDocument } from "./runners";

export abstract class ResolveDataImportsRunner extends FileRunner {
    abstract extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    abstract compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}

export abstract class ResolveSubHtmlRunner extends ResolveDataImportsRunner {
    abstract extractData(resource: DataParsedDocument, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
    abstract compile(resource: FalsyAble<DataParsedDocument>, config: SsgConfig): Promise<FalsyAble<DataParsedDocument>>;
}