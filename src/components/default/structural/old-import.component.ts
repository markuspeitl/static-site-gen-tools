import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../pipeline/i-processor";
import { BaseComponent, DocumentData } from "../../base-component";

export abstract class ImportComponent implements BaseComponent {

    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<IProcessResource | DocumentData> {

        if (!dataCtx) {
            return {};
        }

        if (!dataCtx.imports) {
            dataCtx.imports = [];
        }

        const importPathGlob: string = dataCtx.path;
        const importAlias: string = dataCtx.as;

        //const importedComponents: BaseComponent[] = await loadComponentImports(dataCtx?.src, [ importPathGlob ]);
        const importedComponents: BaseComponent[] = [];

        if (importAlias) {
            if (importedComponents.length < 1) {
                dataCtx[ importAlias ] = importedComponents[ 0 ];
            }
            else {
                dataCtx[ importAlias ] = importedComponents;
            }
        }
        else {
            dataCtx.imports = (dataCtx.imports as Array<any>).concat(importedComponents);
        }

        return dataCtx || {};
    }
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<IProcessResource | string> {
        return {
            content: '',
            data: dataCtx
        };
    }
}