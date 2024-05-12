import { CompileRunner } from "../../compilers/runners";
import { TsRunner } from "../../compilers/ts.runner";
import { SsgConfig } from "../../config";
import { BaseRunnerComponent } from "../base-runner-component";

export class JavaScriptComponent extends BaseRunnerComponent {
    public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'ts html';
    }
    /*public getRunner(config?: SsgConfig): CompileRunner | null {
        return new TsRunner();
    }*/
}