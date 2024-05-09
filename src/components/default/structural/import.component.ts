import { loadComponentImports } from "../../../compilers/lib/component-cache";
import { DocumentData, DataParsedDocument } from "../../../compilers/runners";
import { SsgConfig } from "../../../config";
import { getScopedEvalFn } from "../../../utils/fn-apply";
import { BaseComponent, FnBaseComponent } from "../../base-component";

export abstract class ImportComponent implements BaseComponent, FnBaseComponent {

    public async data(dataCtx?: DocumentData | null, config: SsgConfig = {}): Promise<DataParsedDocument | DocumentData> {

        if (!dataCtx) {
            return {};
        }

        if (!dataCtx.imports) {
            dataCtx.imports = [];
        }

        const importPathGlob: string = dataCtx.path;
        const importAlias: string = dataCtx.as;

        const importedComponents: BaseComponent[] = await loadComponentImports(dataCtx?.src, [ importPathGlob ]);

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
    public async render(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<DataParsedDocument | string> {
        return {
            content: '',
            data: dataCtx
        };
    }
}