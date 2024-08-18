import { curvyTemplate, html } from "@markus/ts-node-util-mk1";
import { BaseComponent, DocumentData } from "../../src/components/base-component";
import { SsgConfig } from "../../src/config";
import { IProcessResource } from "../../src/pipeline/i-processor";

class FunctionStyleDynamicComponent implements BaseComponent {
    async data(dataCtx?: DocumentData | null, config?: SsgConfig): Promise<IProcessResource | DocumentData> {
        return {
            title: 'prop style test',
            description: 'setting component contents through simplified style',
            content: '<div><span><img src="assets/test.png" /></span></div>'
        };
    }
    async render(resource: IProcessResource, config: SsgConfig): Promise<IProcessResource | string> {

        if (!resource) {
            resource = {};
        }

        /*const htmlContent: string = html`
            <h1>${dataCtx.title}</h1>
            <p>${dataCtx.description}</p>
            <div>
                ${dataCtx.content}
            </div>
        `;*/

        let htmlContent: string = curvyTemplate(html`
            <h1>{{title}}</h1>
            <p>{{description}}</p>
            <div>
                {{content}}
            </div>

            <md>
            # Markdown test
                    
            - lets
            - try
            - some
            - bulletpoints
            </md>

        `, resource);

        htmlContent = htmlContent + "\n\n Try njk compile:";
        htmlContent = htmlContent + `\n\n beforenjk <njk> TITLE: {{ title }} -- DESC: {{ description }} </njk> afternjk`;

        resource.content = htmlContent;
        return resource;
    }
}

const fnComponent: FunctionStyleDynamicComponent = new FunctionStyleDynamicComponent();

export default fnComponent;
