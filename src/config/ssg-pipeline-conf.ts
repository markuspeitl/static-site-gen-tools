import { getCleanExt, setKeyInDict } from "@markus/ts-node-util-mk1";
import type { IGenericResource } from "../processing-tree/i-processor";
import type { IProcessingNodeConfig } from "./../processing-tree/i-processor-config";
import type { SsgConfig } from "./ssg-config";

export function getDefaultProcessingRootNodeConfig(): IProcessingNodeConfig {

    //Tree like processing with edges to next siblings and joining result back at parent
    //(not as good as general graph, but easier to maintain, visualize)
    //Each resource can only processed once by each subProcessor (unless the processorId is removed from handledProcIds)

    //Is a serializeable data structure (can be simply written in a .json file)
    const ssgProcessorConfiguration: IProcessingNodeConfig = {
        id: 'ssg-process',
        inputGuard: undefined,

        srcDirs: [ '../processors' ], //where to load shorthand processors from
        strategy: 'serial', //Default strategy == serial
        processors: [
            {
                id: 'reader',
                inputGuard: {
                    matchProp: 'src',
                    matchCondition: true
                    //matchProp: 'id',
                    //matchCondition: true,
                    //matchCondition: '.+\.html'
                    //matchCondition: (id: string) => id.match(/.+\.html/) //Alternative notation
                },

                preProcess: async function (resource: IGenericResource, config: SsgConfig) {

                    const docSrc: string = resource.src;

                    if (docSrc) {
                        let srcFormat: string = getCleanExt(docSrc);
                        if (docSrc.endsWith('/')) {
                            srcFormat = 'dir';
                        }
                        resource.srcFormat = srcFormat;
                    }

                    return resource;
                },

                srcDirs: [ './reading' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'srcFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.reader',
                    processors: {
                        'html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                        'md': [ 'file' ],
                        'njk': [ 'file' ],
                        'ts': [ 'pass-path' ],
                        'js': [ 'file' ],
                        'yml': [ 'file' ],
                        'json': [ 'file' ],
                        //'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                        'jpg': [ 'asset' ], //Checks if file exists, tags outputFormat as 'asset' and set .target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                        'scss': [ 'file' ],
                        'png': [ 'asset'/* { p: 'asset', t: 'image' } */ ],
                        //'.+\/': [ 'dir', 'watch' ],
                        'dir': [ 'dir' ],
                        //'\*+': [ 'glob' ], //Can match files and dirs and then, send back to reader stage for more specific handling
                    }
                }
            },
            {
                id: 'extractor',
                inputGuard: {
                    matchProp: 'srcFormat',
                    matchCondition: true,
                },

                preProcess: async function (resource: IGenericResource, config: SsgConfig) {
                    const forkedResource: IGenericResource = config.scopes.forkFromResource(resource, {
                        //id: 'extract__' + resource.src
                        id: this.id + "_" + resource.src
                    });
                    return forkedResource;
                },
                postProcess: async (resource: IGenericResource, config: SsgConfig) => {
                    return config.scopes.mergeToParent(resource);
                },

                srcDirs: [ './extracting' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'srcFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.extractor',
                    processors: {
                        'dir': [ 'dir' ],
                        'html': [ 'html' ],
                        'md': [ 'md', 'html' ],
                        'njk': [ 'md', 'html' ],
                        'ts': [ 'md', 'ts' ],

                        'js': [ 'data' ],
                        'json': [ 'data' ],
                        'yml': [ 'data' ],
                    },
                }
            },
            {
                id: 'compiler',
                inputGuard: {
                    matchProp: 'srcFormat',
                    matchCondition: true,
                },

                srcDirs: [ './compiling' ],
                strategy: 'firstMatch',
                fileProcessorChains: {
                    matchProp: 'srcFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.compiler',
                    processors: {
                        'dir': [
                            'dir'
                        ],
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
                    matchProp: 'targetFormat',
                    matchCondition: true,
                },
                srcDirs: [ './writing' ],
                strategy: 'firstMatch',

                fileProcessorChains: {
                    //matchProp: 'id',
                    matchProp: 'targetFormat',
                    strategy: 'serial',
                    fileIdPostfix: '.writer',
                    processors: {
                        'dir': [ 'dir' ],
                        'html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                        'md': [ 'file' ],
                        'njk': [ 'file' ],
                        'ts': [ 'file' ],
                        'jpg': [ 'copy' ], //Checks if file exists, tags outputFormat as 'asset' and set .target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                        'scss': [ 'file' ],
                        'png': [ 'copy'/* { p: 'asset', t: 'image' } */ ],

                        // '.+\.html': [ 'file' ], //Shorthand spec for guard: '.+\.html', processStrategy: 'serial', matchProperty: undefined
                        // '.+\.md': [ 'file' ],
                        // '.+\.njk': [ 'file' ],
                        // '.+\.ts': [ 'file' ],
                        // //'network/[a-zA-Z0-9\.\-\_]+/[a-zA-Z0-9\.\-\_/]+\.[a-zA-Z0-9\.]+': [ 'network' ],
                        // '.+\.jpg': [ 'copy' ], //Checks if file exists, tags outputFormat as 'asset' and set .target to calculated target path (does not set inputFormat --> skips 'extractor' and 'compiler' stage)
                        // //'.+\.scss': [ 'file' ],
                        // //'.+\/': [ 'dir' ],
                        // //'.+': [ 'dir' ],
                        // '.+.png': [ 'copy'/* { p: 'asset', t: 'image' } */ ],
                        // //'\*+': [ 'glob' ], //Can match files and dirs and then, send back to reader stage for more specific handling
                    }
                }
            }
        ]
    };

    return ssgProcessorConfiguration;
}

const defaultProcessingTreeConfig: IProcessingNodeConfig = getDefaultProcessingRootNodeConfig();

export default defaultProcessingTreeConfig;