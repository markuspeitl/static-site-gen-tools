import lodash from 'lodash';
import { DeferCompileArgs, getResourceImportsCache, resolveResourceImports } from '../../compilers/resolve-sub-html.runner';
import { DataParsedDocument } from '../../compilers/runners';
import { BaseComponent, IInternalComponent } from '../../components/base-component';
import { SsgConfig } from "../../config";
import { getLibInstance } from "../../dependencies/module-instances";
import { forkDataScope, forkResourceScope } from '../../manage-scopes';
import { cheerioReplaceElem } from '../../utils/cheerio-util';
import { removeBaseBlockIndent } from '../../utils/string-util';
import { addHandlerId, IResourceProcessor } from "../i-resource-processor";
import { processResource } from '../process-resource';
import { HtmlCompiler } from './html.compiler';
import { setHtmlOutputFormat } from './output-format';

export class ComponentCompiler implements IResourceProcessor {
    id: string = 'component';

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

        /*resource = await resolveResourceImports(resource, config);
        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
        const importScopeSymbols: string[] = Object.keys(selectedDependencies);*/
        //1. Load dependencies/imports and components
        //2. Check if any components are in content
        //const dataResource: DataParsedDocument = resource;

        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);

        if (resource.data.compileAfter) {

            const preparedSubComponentResources = resource.data.compileAfter.map(
                (pendingArgs: DeferCompileArgs) => {
                    //const pendingArgs: DeferCompileArgs = pendingCompileArgs;

                    //const mergedResource: DataParsedDocument = lodash.merge({}, resource, transformedResource);
                    const componentToCompileResource: DataParsedDocument = forkResourceScope(resource);

                    componentToCompileResource.content = pendingArgs.content;
                    componentToCompileResource.id = undefined;
                    if (componentToCompileResource.data) {

                        componentToCompileResource.data.compileAfter = [];

                        //componentToCompileResource.data.importCache = resource.data.importCache;
                        componentToCompileResource.data.document = {
                            inputFormat: 'html'
                        };

                        componentToCompileResource.data.placeholder = pendingArgs.placeholder;
                        componentToCompileResource.data.componentTag = pendingArgs.name;
                        componentToCompileResource.data.componentId = pendingArgs.id;
                        Object.assign(componentToCompileResource.data, pendingArgs.attrs);
                    }

                    return componentToCompileResource;
                }
            );

            resource.data.compileAfter = [];

            for (const componentResource of preparedSubComponentResources) {

                //const componentResource: DataParsedDocument = await processResource(resource, config, false);
                //const compiledComponentResource: DataParsedDocument = await processResource(componentResource, config, false);

                const selectedSubComponent: IInternalComponent = selectedDependencies[ componentResource.data?.componentTag ];

                //TODO merge data from component
                //selectedSubComponent.data();

                //component should call 'processResource' if necessary
                //its mainly necessary if wanting to render a different syntax -> render njk brackets, render md encoded text to html, detect and render sub components
                //

                componentResource.content = removeBaseBlockIndent(componentResource.content);

                const pendingCompileComponentId: string = componentResource.data?.componentId;

                let dataExtractedDocument: DataParsedDocument = await selectedSubComponent.data(componentResource, config);
                if (!dataExtractedDocument) {
                    dataExtractedDocument = {};
                }

                const mergedDataResource: DataParsedDocument = lodash.merge({}, resource, dataExtractedDocument);

                const compiledComponentResource: DataParsedDocument = await selectedSubComponent.render(mergedDataResource, config);

                //const componentReplacedContent: string = resource.content.replace(compiledComponentResource.data?.placeholder, compiledComponentResource.content);
                const componentReplacedContent: string = cheerioReplaceElem(resource.content, pendingCompileComponentId, compiledComponentResource.content);

                resource.content = componentReplacedContent;

                console.log(resource.content);

                //pendingArgs.compiled = `I would be the replaced placeholder: ${pendingArgs.name}`;
                //resource.content = resource.content.replace(pendingArgs.placeholder, pendingArgs.compiled);
                //resource.content = resource.content.replace(pendingArgs.placeholder, componentResource.content);
            }
        }


        return resource;

        /*resource = await substituteComponentsPlaceholder(resource, config);
        resource = await this.compileRootDocument(resource as DataParsedDocument, config);
        resource = await compileDeferredInsertToPlaceholder(resource as DataParsedDocument, config);*/


        //resource = setHtmlOutputFormat(resource);
        //return addHandlerId(resource, 'compiler', this);
    }
}