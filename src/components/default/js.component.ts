import { CompileRunner } from "../../compilers/runners";
import { TsRunner } from "../../compilers/ts.runner";
import { SsgConfig } from "../../config";
import { BaseRunnerComponent } from "../base-runner-component";

export class JavaScriptComponent extends BaseRunnerComponent {
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new TsRunner();
    }
}