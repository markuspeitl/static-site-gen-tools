import { StaticAssembledFileComponent } from "../../../src/components/base/common-components";

export class StaticFileComponent extends StaticAssembledFileComponent {
    public files: Record<string, string> = {
        data: './file.json',
        style: './file.css',
        clientCode: './file.js',
        render: './file.html',
    };
}

const fileComponent: StaticFileComponent = new StaticFileComponent();

export default fileComponent;