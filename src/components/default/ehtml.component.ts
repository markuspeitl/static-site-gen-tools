import { BaseCompileContentFormatComponent } from "../base-body-compile-component";

export class EHtmlComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'html';

    /*public getRunnerIds(config?: SsgConfig | undefined): string | string[] {
        return 'html';
    }
    public getRunner(config?: SsgConfig): CompileRunner | null {
        return new HtmlRunner();
    }*/
}