import { DocumentData, DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseComponent, FnBaseComponent } from "../base-component";

export class HelloWorldComponent implements BaseComponent, FnBaseComponent {

    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {
        dataCtx = dataCtx || {};
        dataCtx.data.message = "Hello world from component subrenderer";
        return dataCtx || {};
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        return {
            content: `
                ${dataCtx?.content}
                This is the message from hello:
                ${dataCtx?.data?.message}
            `,
            data: dataCtx,
        };
    }
}