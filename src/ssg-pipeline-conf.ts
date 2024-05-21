import { resolveDataFromSrc } from "./compilers/resolve-sub-html.runner";
import { IProcessingNodeConfig } from "./pipeline/resource-pipeline";

export function getDefaultProcessingRootNodeConfig(): IProcessingNodeConfig {

    //Tree like processing with edges to next siblings and joining result back at parent
    //(not as good as general graph, but easier to maintain, visualize)
    //Each resource can only processed once by each subProcessor (unless the processorId is removed from handledProcIds)

    const ssgProcessorConfig: IProcessingNodeConfig = {
        id: 'ssg-process',
        guard: '',
        processStrategy: 'serial',
        srcDir: './src/processing', //where to load shorthand processors from
        processors: {
            reader: {
                id: 'reader',
                guard: '.id',
                matchProperty: '.id',
                processStrategy: 'firstMatch',
                //matchProcessorFiles: './reader/*.reader.ts',
                processors: {
                    '.+\.html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                    '.+\.md': [ 'file' ],
                    '.+\.njk': [ 'file' ],
                    '.+\.ts': [ 'file' ],
                    'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                    '.+/.+.jpg': [ 'asset' ], //Checks if file exists, tags outputFormat as 'asset' and set document.target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                    '.+\.scss': [ 'file' ],
                    '.+\/': [ 'dir' ],
                    '.+': [ 'dir' ],
                    '.+.png': [ 'asset'/* { p: 'asset', t: 'image' } */ ],
                    //'\*+': [ 'glob' ], //Can match files and dirs and then, send back to reader stage for more specific handling    
                }
            },
            extractor: {
                id: 'extractor',
                guard: 'data.document.inputFormat',
                matchProperty: 'data.document.inputFormat',
                processStrategy: 'firstMatch',
                processors: {
                    'html': [ 'html' ],
                    'md': [ 'md', 'html' ],
                    'njk': [ 'md', 'html' ],
                    'ts': [ 'md', 'ts' ],
                },
                //postProcess: resolveDataFromSrc,
            },
            compiler: {
                id: 'compiler',
                guard: 'data.document.inputFormat',
                matchProperty: 'data.document.inputFormat',
                processStrategy: 'firstMatch',
                processors: {
                    'html': [ 'placeholder', 'component' ], // or 'placeholder', 'component' instead of component
                    'md': [ 'placeholder', 'md', 'component', 'njk' ],
                    'njk': [ 'placeholder', 'njk', 'component' ],
                    'ts': [ 'placeholder', 'component', 'ts', 'html' ],
                    'scss': [ 'scss' ],
                },
                //preProcess: resolveDataFromSrc,
            },
            writer: {
                id: 'writer',
                guard: 'data.document.outputFormat',
                matchProperty: 'data.document.outputFormat',
                processStrategy: 'firstMatch',
                processors: {
                    'html': [ 'file' ],
                    'md': [ 'file' ],
                    'njk': [ 'file' ],
                    'ts': [ 'file' ],
                    'asset': [ 'copy' ], //Receives all files tagged as asset -> uses document.src and document.target to copy file
                    'scss': [ 'file' ],
                    '.+': [ 'dir' ],
                }
            }
        }
    };

    return ssgProcessorConfig;
}
