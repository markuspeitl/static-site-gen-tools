import { HtmlRunner } from "../../compilers/html.runner";
import { CompileRunner } from "../../compilers/runners";
import { SsgConfig } from "../../config";
import { BaseRunnerComponent } from "../base-runner-component";

export class HtmlComponent extends BaseRunnerComponent {
    public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'html';
    }
    /*public getRunner(config?: SsgConfig): CompileRunner | null {
        return new HtmlRunner();
    }*/
}