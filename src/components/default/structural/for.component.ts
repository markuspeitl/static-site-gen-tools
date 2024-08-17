import type { SsgConfig } from "../../../config";
import type { IProcessResource } from "../../../pipeline/i-processor";
import { settleValueOrNull } from "@markus/ts-node-util-mk1";
import { BaseComponent, IInternalComponent } from "../../base-component";
import { filterFalsy } from "@markus/ts-node-util-mk1";
import { getKeyFromDict } from "@markus/ts-node-util-mk1";

export abstract class ForComponent implements BaseComponent, IInternalComponent {

    public canCompile(resource: IProcessResource, config: SsgConfig): boolean {
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

    public async data(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
        return resource;
    }

    public async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource> {
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

        /*console.time('parrallel_for');
        const renderLoopItPromises: Promise<IProcessResource>[] = selectedArray.map((itemValue: any) => {
            //Set local variable for current iteration
            (resource.data as any)[ iteratorItemName ] = itemValue;
            const stagesRunId: string = "__loop-iteration_" + itemValue + "_of_" + listItemName;
            return config.processor.processFork([ 'extractor', 'compiler' ], resource, config, stagesRunId);
            //const renderedBody = renderedIterationResource?.content || '';
            //const renderedBody = forkedResource.content;
        });

        const renderedLoopResources: IProcessResource[] = filterFalsy(await settleValueOrNull(renderLoopItPromises));
        const renderedContents: string[] = renderedLoopResources.map((resource: IProcessResource) => resource?.content || '');
        const combinedIterRenderBody2: string = renderedContents.join('\n');
        console.timeEnd('parrallel_for');*/

        console.time('sequential_for' + resource.id);

        const renderedIterations: string[] = [];
        for (const itemValue of selectedArray) {

            //Set local variable for current iteration
            (resource.data as any)[ iteratorItemName ] = itemValue;
            const forkedResourceRunId: string = "__loop-iteration_" + itemValue + "_of_" + listItemName;

            let renderedIterationResource: IProcessResource | null = await config.processor.renderFork(
                resource,
                config,
                /*[
                    'extractor',
                    'compiler'
                ],*/
                forkedResourceRunId
            );

            const renderedBody = renderedIterationResource?.content || '';
            renderedIterationResource = null;
            //const renderedBody = forkedResource.content;

            renderedIterations.push(renderedBody);
        }

        console.timeEnd('sequential_for' + resource.id);

        const combinedIterRenderBody: string = renderedIterations.join('\n');

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