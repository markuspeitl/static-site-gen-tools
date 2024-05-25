import lodash from 'lodash';
import type { IInternalComponent } from '../../components/base-component';
import type { SsgConfig } from "../../config";
import { forkResourceScope } from '../../manage-scopes';
import { cheerioReplaceElem } from '../../utils/cheerio-util';
import { removeBaseBlockIndent } from '../../utils/string-util';
import { HtmlCompiler } from './html.compiler';
import { settleValueOrNull } from '../../utils/promise-util';
import type { IProcessingNode, IProcessResource, IResourceProcessor } from '../../pipeline/i-processor';
import { resolveDataFromParentResource } from '../../components/resolve-component-path-refs';
import { getResourceImportsCache } from '../../components/component-imports';
import { DeferCompileArgs } from '../../components/deferred-component-compiling';

export class ComponentCompiler implements IResourceProcessor {
    id: string = 'component.compiler';

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
        console.log(`Compiling ${this.id}: ${resource.data?.document?.src}`);

        /*resource = await resolveResourceImports(resource, config);
        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);
        const importScopeSymbols: string[] = Object.keys(selectedDependencies);*/
        //1. Load dependencies/imports and components
        //2. Check if any components are in content
        //const dataResource: IProcessResource = resource;

        let selectedDependencies: Record<string, IInternalComponent> = getResourceImportsCache(resource, config);

        if (!resource.data.compileAfter) {
            return resource;
        }

        const preparedSubComponentResources = resource.data.compileAfter.map(
            (pendingArgs: DeferCompileArgs) => {
                //const pendingArgs: DeferCompileArgs = pendingCompileArgs;

                //const mergedResource: IProcessResource = lodash.merge({}, resource, transformedResource);
                let componentToCompileResource: IProcessResource = forkResourceScope(resource);

                componentToCompileResource.content = pendingArgs.content;
                componentToCompileResource.id = undefined;
                if (componentToCompileResource.data) {

                    componentToCompileResource.data.compileAfter = [];

                    //componentToCompileResource.data.importCache = resource.data.importCache;
                    /*componentToCompileResource.data.document = {
                        inputFormat: 'html'
                    };*/

                    componentToCompileResource.data.placeholder = pendingArgs.placeholder;
                    componentToCompileResource.data.componentTag = pendingArgs.name;
                    componentToCompileResource.data.componentId = pendingArgs.id;
                    Object.assign(componentToCompileResource.data, pendingArgs.attrs);

                    componentToCompileResource = resolveDataFromParentResource(resource, componentToCompileResource, config);
                }

                return componentToCompileResource;
            }
        );

        resource.data.compileAfter = [];


        const processSubResourcePromises: Promise<IProcessResource>[] = preparedSubComponentResources.map(async (componentResource: IProcessResource) => {
            //const componentResource: IProcessResource = await processResource(resource, config, false);
            //const compiledComponentResource: IProcessResource = await processResource(componentResource, config, false);

            const selectedSubComponent: IInternalComponent = selectedDependencies[ componentResource.data?.componentTag ];

            //TODO merge data from component
            //selectedSubComponent.data();

            //component should call 'processResource' if necessary
            //its mainly necessary if wanting to render a different syntax -> render njk brackets, render md encoded text to html, detect and render sub components
            //

            componentResource.content = removeBaseBlockIndent(componentResource.content);


            let dataExtractedDocument: IProcessResource = await selectedSubComponent.data(componentResource, config);
            if (!dataExtractedDocument) {
                dataExtractedDocument = {};
            }
            const mergedDataResource: IProcessResource = lodash.merge({}, resource, dataExtractedDocument);

            //const compiledComponentResource: IProcessResource = await selectedSubComponent.render(mergedDataResource, config);

            return selectedSubComponent.render(mergedDataResource, config);
        });

        const compiledComponentResources: Array<any | null> = await settleValueOrNull(processSubResourcePromises);



        for (let compiledComponentResource of compiledComponentResources) {

            if (compiledComponentResource) {

                const pendingCompileComponentId: string = compiledComponentResource.data?.componentId;
                //const componentReplacedContent: string = resource.content.replace(compiledComponentResource.data?.placeholder, compiledComponentResource.content);
                const componentReplacedContent: string = cheerioReplaceElem(resource.content, pendingCompileComponentId, compiledComponentResource.content);
                resource.content = componentReplacedContent;
            }

            //console.log(resource.content);

            //pendingArgs.compiled = `I would be the replaced placeholder: ${pendingArgs.name}`;
            //resource.content = resource.content.replace(pendingArgs.placeholder, pendingArgs.compiled);
            //resource.content = resource.content.replace(pendingArgs.placeholder, componentResource.content);
        }

        return resource;

        /*resource = await substituteComponentsPlaceholder(resource, config);
        resource = await this.compileRootDocument(resource as IProcessResource, config);
        resource = await compileDeferredInsertToPlaceholder(resource as IProcessResource, config);*/


        //resource = setHtmlOutputFormat(resource);
        //return addHandlerId(resource, 'compiler', this);
    }
}