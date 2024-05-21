
export function getDefaultProcessingStages(): ProcessingStagesInfo {

    //Tree like processing with edges to next siblings and joining result back at parent
    //(not as good as general graph, but easier to maintain, visualize)
    //Each resource can only processed once by each subProcessor (unless the processorId is removed from handledProcIds)

    const ssgProcessorConfig: ProcessingTreeConfig = {
        id: 'ssg-process',
        guard: '',
        processStrategy: 'serial',
        srcDir: './processing', //where to load shorthand processors from
        processors: {
            reader: {
                id: 'reader',
                guard: '.id',
                matchProperty: '.id',
                processStrategy: 'firstMatch',
                matchProcessorIds: './reader/*.reader.ts',
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
                postProcess: resolveDataFromSrc,
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
                preProcess: resolveDataFromSrc,
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

    const processingStages: ProcessingStagesInfo = {
        reader: {
            inputProp: 'id',
            matchChains: {
                '.+\.html': [ 'file' ],
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
            inputProp: 'data.document.inputFormat',
            matchChains: {
                'html': [ 'html' ],
                'md': [ 'md', 'html' ],
                'njk': [ 'md', 'html' ],
                'ts': [ 'md', 'ts' ],
            },
            postProcess: resolveDataFromSrc,
        },
        compiler: {
            preProcess: resolveDataFromSrc,
            inputProp: 'data.document.inputFormat',
            matchChains: {
                'html': [ 'placeholder', 'component' ], // or 'placeholder', 'component' instead of component
                'md': [ 'placeholder', 'md', 'component', 'njk' ],
                'njk': [ 'placeholder', 'njk', 'component' ],
                'ts': [ 'placeholder', 'component', 'ts', 'html' ],
                'scss': [ 'scss' ],
            }
        },
        writer: {
            inputProp: 'data.document.outputFormat',
            matchChains: {
                'html': [ 'file' ],
                'md': [ 'file' ],
                'njk': [ 'file' ],
                'ts': [ 'file' ],
                'asset': [ 'copy' ], //Receives all files tagged as asset -> uses document.src and document.target to copy file
                'scss': [ 'file' ],
                '.+': [ 'dir' ],
            }
        }
    };

    for (const stageName in processingStages) {
        const currentStageInfo: StageInfo = processingStages[ stageName ];
        currentStageInfo.id = stageName;
    }

    return processingStages;
}

//which compile runners to use for reading component data (needs to go through the extraction chain before compiling, to make sure all data is set up)
//before inflating view from data pieces
/*config.resMatchDataExtractorsDict = {
    '.+.html': [
        'html',
    ],
    '.+.ehtml': [
        'html'
    ],
    '.+.md': [
        'md',
        'html',
    ],
    '.+.njk': [
        'md',
        'html'
    ],
    '.+.ts': [
        "ts",
    ]
};
config.resMatchCompileRunnersDict = {
    '.+.html': [
        'html',
        'njk',
    ],
    '.+.ehtml': [
        'html'
        //'njk',
    ],
    '.+.md': [
        //'md',
        //'njk',
        'html',
        //'njk',
        //'md',
    ],
    '.+.njk': [
        'njk',
        'html'
    ],
    '.+.ts': [
        "ts",
        //"md",
        //'njk',
        'html',
    ],
};*/
