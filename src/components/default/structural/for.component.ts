import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../pipeline/i-processor";
import { processTreeStages } from "../../../processing-tree-wrapper";
import { BaseComponent, IInternalComponent } from "../../base-component";
import { getKeyFromDict } from "../../helpers/dict-util";

export abstract class ForComponent implements BaseComponent, IInternalComponent {

    public canCompile(resource: IProcessResource, config?: SsgConfig): boolean {
        if (!resource.data) {
            console.error("Can not compile 'for' component -> data needs to be set");
            return false;
        }

        if (!resource.data.it) {
            console.error("Invalid 'for' component -> needs to have a condition with the 'it' attribute");
            return false;
        }
        if (!resource.data.of) {
            console.error("Invalid 'for' component -> needs to have a condition with the 'of' attribute");
            return false;
        }

        return true;
    }

    public async data(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        return resource;
    }

    public async render(resource: IProcessResource, config: SsgConfig = {}): Promise<IProcessResource> {
        if (!this.canCompile(resource, config)) {
            return resource;
        }
        const data: any = resource.data;

        if (!data.it || !data.of) {
            console.log("Invalid 'for' component -> needs to have 'item' and 'of attribute");
        }
        const iteratorItemName: string = data.it;
        const listItemName: string = data.of;
        //const loopBody: string = resource.content;

        const selectedArray: Array<any> = getKeyFromDict(data, listItemName);

        if (!selectedArray) {
            console.error(`Failed to select '${listItemName}' property from resource data --> not iterable --> skipping for`);
            return resource;
        }

        const renderedIterations: string[] = [];
        for (const itemValue of selectedArray) {

            //Set local variable for current iteration
            (resource.data as any)[ iteratorItemName ] = itemValue;

            //const renderedIterationResource: FalsyAble<IProcessResource> = await processResource(resource, config, true);

            const stagesRunId: string = "__loop-iteration_" + itemValue + "_of_" + listItemName;
            const renderedIterationResource: IProcessResource = await processTreeStages([ 'extractor', 'compiler' ], resource, config, stagesRunId);
            const renderedBody = renderedIterationResource?.content || '';
            //const renderedBody = forkedResource.content;

            renderedIterations.push(renderedBody);

            /*const renderedLoopDocument: FalsyAble<IProcessResource> = await config.masterCompileRunner?.compileWith(
                'html njk',
                {
                    content: loopBody,
                    data: subDataCtx
                },
                config
            );*/

            //const htmlComponent: BaseComponent = getComponent('html', config);
            //TODO improve + update
            /*const htmlRunner: HtmlRunner = new HtmlRunner();
            htmlRunner.extractData(
                {
                    content: loopBody,
                    data: subDataCtx
                },
                config
            );*/
        }

        const combinedIterRenderBody = renderedIterations.join('\n');
        resource.content = combinedIterRenderBody;
        return resource;
    }
}


/*<for it="tag" of="tags">
    <tag bind="tag-component"></tag>
    <tag-component>{ tag }</tag-component>

    <e-if of="item-data" is="education">
        Condition that item tag is 'education' was met
    </e-if>

</for>*/