import type { IProcessingNodeConfig } from "./pipeline/i-processor";

export function getDefaultProcessingRootNodeConfig(): IProcessingNodeConfig {

    //Tree like processing with edges to next siblings and joining result back at parent
    //(not as good as general graph, but easier to maintain, visualize)
    //Each resource can only processed once by each subProcessor (unless the processorId is removed from handledProcIds)

    //Is a serializeable data structure (can be simply written in a .json file)
    const ssgProcessorConfiguration: IProcessingNodeConfig = {
        id: 'ssg-process',
        inputGuard: undefined,

        srcDirs: [ '../src/processing' ], //where to load shorthand processors from
        strategy: 'serial', //Default strategy == serial
        processors: [
            {
                id: 'reader',
                inputGuard: {
                    matchProp: 'id',
                    matchCondition: true,
                    //matchCondition: '.+\.html'
                    //matchCondition: (id: string) => id.match(/.+\.html/) //Alternative notation
                },

                srcDirs: [ './reading' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'id',
                    strategy: 'serial',
                    fileIdPostfix: '.reader',
                    processors: {
                        '.+\.html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                        '.+\.md': [ 'file' ],
                        '.+\.njk': [ 'file' ],
                        '.+\.ts': [ 'file' ],
                        //'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                        '.+\.jpg': [ 'asset' ], //Checks if file exists, tags outputFormat as 'asset' and set document.target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                        '.+\.scss': [ 'file' ],
                        '.+\.png': [ 'asset'/* { p: 'asset', t: 'image' } */ ],
                        '.+\/': [ 'dir', 'watch' ],
                        '.+': [ 'dir' ],
                        //'\*+': [ 'glob' ], //Can match files and dirs and then, send back to reader stage for more specific handling
                    }
                }
            },
            {
                id: 'extractor',
                inputGuard: {
                    matchProp: 'data.document.inputFormat',
                    matchCondition: true,
                },

                srcDirs: [ './extracting' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'data.document.inputFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.extractor',
                    processors: {
                        'html': [ 'html' ],
                        'md': [ 'md', 'html' ],
                        'njk': [ 'md', 'html' ],
                        'ts': [ 'md', 'ts' ],
                    },
                }
            },
            {
                id: 'compiler',
                inputGuard: {
                    matchProp: 'data.document.inputFormat',
                    matchCondition: true,
                },

                srcDirs: [ './compiling' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'data.document.inputFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.compiler',
                    processors: {
                        'html': [
                            'placeholder',
                            'component',
                            'njk'
                        ], // or 'placeholder', 'component' instead of component
                        'md': [
                            'placeholder',
                            'md',
                            'component',
                            'njk'
                        ],
                        'njk': [
                            'placeholder',
                            'njk',
                            'component',
                            'placeholder',
                            'component',
                        ],
                        'ts': [
                            'ts',
                            'placeholder',
                            'component',
                            'html'
                        ],
                        /*'scss': [
                            'scss'
                        ],*/
                    }
                }
            },
            {
                id: 'writer',
                inputGuard: {
                    matchProp: 'data.document.outputFormat',
                    matchCondition: true,
                },
                srcDirs: [ './writing' ],
                strategy: 'firstMatch',

                fileProcessorChains: {
                    matchProp: 'id',
                    strategy: 'serial',
                    fileIdPostfix: '.writer',
                    processors: {
                        '.+\.html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                        '.+\.md': [ 'file' ],
                        '.+\.njk': [ 'file' ],
                        '.+\.ts': [ 'file' ],
                        //'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                        '.+\.jpg': [ 'copy' ], //Checks if file exists, tags outputFormat as 'asset' and set document.target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                        //'.+\.scss': [ 'file' ],
                        //'.+\/': [ 'dir' ],
                        //'.+': [ 'dir' ],
                        '.+.png': [ 'copy'/* { p: 'asset', t: 'image' } */ ],
                        //'\*+': [ 'glob' ], //Can match files and dirs and then, send back to reader stage for more specific handling
                    }
                }
            }
        ]
    };

    return ssgProcessorConfiguration;
}
