import path from 'path';
import { getResourceImportsCache, resolveResourceImports, substituteComponentsPlaceholder } from '../../compilers/resolve-sub-html.runner';
import { DataParsedDocument } from '../../compilers/runners';
import { BaseComponent, IInternalComponent } from '../../components/base-component';
import { FalsyAble } from '../../components/helpers/generic-types';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { HtmlCompiler } from './html.compiler';
import { setHtmlOutputFormat } from './output-format';

export class PlaceholderCompiler implements IResourceProcessor {
    id: string = 'placeholder';

    public async canHandle(resource: DataParsedDocument, config: SsgConfig): Promise<boolean> {
        return new HtmlCompiler().canHandle(resource, config);
    }
    public async process(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
        const resourceContent: string | undefined = resource.content?.trim();
        if (!resourceContent) {
            return resource;
        }
        resource.content = resourceContent;
        if (!resource.data) {
            return resource;
        }


        let currentDocumentDir: string = "";
        if (resource.data.document.src) {
            currentDocumentDir = path.parse(resource.data.document.src).dir;
        }

        resource = await resolveResourceImports(currentDocumentDir, resource, config);
        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
        const importScopeSymbols: string[] = Object.keys(selectedDependencies);

        //1. Load dependencies/imports and components
        //2. Check if any components are in content
        //const dataResource: DataParsedDocument = resource;

        const componentsSubstitutedRes: FalsyAble<DataParsedDocument> = await substituteComponentsPlaceholder(resource, config);

        if (componentsSubstitutedRes) {
            resource = componentsSubstitutedRes;
        }

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(resource, 'compiler', this);
    }
}