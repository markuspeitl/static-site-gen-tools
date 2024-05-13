import { HtmlRunner } from "../../compilers/html.runner";
import { CompileRunner } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseCompileContentFormatComponent } from "../base-body-compile-component";
import { BaseRunnerComponent } from "../base-runner-component";

export class HtmlComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'html';

    /*public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'html';
    }
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new HtmlRunner();
    }*/
}