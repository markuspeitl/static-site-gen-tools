import { DocumentData, DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseComponent, FnBaseComponent } from "../base-component";

export class PassthroughComponent implements BaseComponent, FnBaseComponent {

    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {
        return dataCtx || {};
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        return {
            content: dataCtx?.content || '',
            data: dataCtx,
        };
    }
}