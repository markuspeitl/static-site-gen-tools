import type { SsgConfig } from "../../config";
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import type { IInternalComponent } from '../../components/base-component';
import type { FalsyAble } from '../../components/helpers/generic-types';
import { getLibInstance } from "../../dependencies/module-instances";
import { addHandlerId } from "../i-resource-processor";
import { HtmlCompiler } from './html.compiler';
import { setHtmlOutputFormat } from './output-format';
import { getResourceImportsCache, resolveResourceImports } from '../../components/component-imports';
import { findReplaceTopLevelDetectedComponents } from '../../components/components-to-placeholders';
import path from 'path';

export class PlaceholderCompiler implements IResourceProcessor {
    id: string = 'placeholder.compiler';

    protected htmlCompilerSubject: IProcessingNode = new HtmlCompiler();
    public canHandle = this.htmlCompilerSubject.canHandle;
    /*public async canHandle(resource: IProcessResource, config: SsgConfig): Promise<boolean> {
        return this.htmlCompilerSubject.canHandle(resource, config);
    }*/

    public async process(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
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
        //const importScopeSymbols: string[] = Object.keys(selectedDependencies);

        //1. Load dependencies/imports and components
        //2. Check if any components are in content
        //const dataResource: IProcessResource = resource;

        const componentsSubstitutedRes: FalsyAble<IProcessResource> = await findReplaceTopLevelDetectedComponents(resource, config);

        if (componentsSubstitutedRes) {
            resource = componentsSubstitutedRes;
        }

        resource = setHtmlOutputFormat(resource);
        return addHandlerId(resource, 'compiler', this);
    }
}