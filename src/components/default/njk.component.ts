import { NunjucksRunner } from '../../compilers/njk.runner';
import { CompileRunner } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { BaseCompileContentFormatComponent } from '../base-body-compile-component';
import { BaseRunnerComponent } from '../base-runner-component';

export class NunjucksComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'njk';

    /*public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'njk html';
    }
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new NunjucksRunner();
    }*/
}