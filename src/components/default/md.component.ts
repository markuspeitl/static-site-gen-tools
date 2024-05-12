import { MarkdownRunner } from '../../compilers/md.runner';
import { CompileRunner } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { BaseRunnerComponent } from '../base-runner-component';

export class MarkDownComponent extends BaseRunnerComponent {
    public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'md html';
    }
    /*public getRunner(config?: SsgConfig): CompileRunner | null {
        return new MarkdownRunner();
    }*/
}