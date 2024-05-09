import { NunjucksRunner } from '../../compilers/njk-runner';
import { CompileRunner } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { BaseRunnerComponent } from '../base-runner-component';

export class NunjucksComponent extends BaseRunnerComponent {
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new NunjucksRunner();
    }
}