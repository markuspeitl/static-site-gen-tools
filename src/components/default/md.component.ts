
import { BaseCompileContentFormatComponent } from '../base/base-body-compile-component';
import { compileSubPathProcessFn } from '../base/component-proc';
export class MarkDownComponent extends BaseCompileContentFormatComponent {
    public contentFormat: string = 'md';
}

/*export const id: string = 'md';

export const procChainId: string[] = [
    'extracting/' + id,
    'compiling/' + id
];

export const process = compileSubPathProcessFn(procChainId)*/


/*export async function process(
    resource: IProcessResource,
    config: SsgConfig
): Promise<IProcessResource> {

    return processingTree.processSubPath(
        'extracting/md',
        'compiling/md'
    );

    md_extractor: IProcessingNode = config.processingTree.get('extracting/md')
    md_compiler: IProcessingNode = config.processingTree.get('compiling/md')
    config.processingTree.runChain(
        md_extractor,
        md_compiler
    )

    //MarkdownExtractor.prototype.process(resource, config)
    //MarkdownCompiler.prototype.process(resource, config)
    //return resource;
}*/