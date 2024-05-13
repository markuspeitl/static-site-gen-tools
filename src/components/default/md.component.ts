import { MarkdownRunner } from '../../compilers/md.runner';
import { CompileRunner } from '../../compilers/runners';
import { SsgConfig } from '../../config';
import { BaseCompileContentFormatComponent } from '../base-body-compile-component';
import { BaseRunnerComponent } from '../base-runner-component';

export class MarkDownComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'md';
    /*public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'md html';
    }
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new MarkdownRunner();
    }*/
}