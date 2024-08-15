import { StaticAssembledFileComponent } from "../../../src/components/common-components";

export class FileComponent extends StaticAssembledFileComponent {
    public files: Record<string, string> = {
        data: './file.json',
        style: './file.css',
        clientCode: './file.js',
        render: './file.html',
    };
}

const fileComponent: FileComponent = new FileComponent();

export default fileComponent;