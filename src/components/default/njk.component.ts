import { NunjucksRunner } from '../../compilers/njk.runner';
import { CompileRunner } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { BaseRunnerComponent } from '../base-runner-component';

export class NunjucksComponent extends BaseRunnerComponent {
    public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'njk html';
    }
    /*public getRunner(config?: SsgConfig): CompileRunner | null {
        return new NunjucksRunner();
    }*/
}