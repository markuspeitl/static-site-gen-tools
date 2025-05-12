import { getCleanExt, setKeyInDict } from "@markus/ts-node-util-mk1";
import type { IGenericResource } from "../processing-tree/i-processor";
import type { IProcessingNodeConfig } from "./../processing-tree/i-processor-config";
import type { SsgConfig } from "./ssg-config";
import { defaultForkControlExcludeKeys } from "../data-merge/scope-manager";
import { getReadableResource, IReadResource } from "../processors/shared/document-helpers";

export function getDefaultProcessingRootNodeConfig(): IProcessingNodeConfig {

    //Tree like processing with edges to next siblings and joining result back at parent
    //(not as good as general graph, but easier to maintain, visualize)
    //Each resource can only processed once by each subProcessor (unless the processorId is removed from handledProcIds)

    //Is a serializeable data structure (can be simply written in a .json file)
    const ssgProcessorConfiguration: IProcessingNodeConfig = {
        id: 'ssg-process',
        strategy: 'serial', //Default strategy == serial
        children: {
            fileSrcDirs: [ '../processors' ], //where to load shorthand processors from
            strategy: 'serial',
            inputMatchCondition: true,
            processors: [
                {
                    id: 'reader',
                    inputMatchProp: 'src',
                    //inputMatchCondition: true
                    //matchProp: 'id',
                    //matchCondition: true,
                    //matchCondition: '.+\.html'
                    //matchCondition: (id: string) => id.match(/.+\.html/) //Alternative notation

                    preProcess: async function (resource: IGenericResource, config: SsgConfig) {

                        const readResource: IReadResource | null = getReadableResource(resource);
                        return readResource as IGenericResource;
                    },

                    children: {
                        type: 'file',
                        fileSrcDirs: [ './reading' ],
                        filePostfix: '.reader',
                        fileChainStrategy: 'serial',
                        strategy: 'serial',
                        inputMatchProp: 'srcFormat',
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
                    },


                },
                {
                    id: 'extractor',
                    inputMatchProp: 'srcFormat',

                    preProcess: async function (resource: IGenericResource, config: SsgConfig) {
                        const forkedResource: IGenericResource = config.scopes.forkFromResource(
                            resource,
                            {
                                //id: 'extract__' + resource.src
                                id: this.id + "_" + resource.src
                            },
                            defaultForkControlExcludeKeys
                        );
                        return forkedResource;
                    },
                    postProcess: async (resource: IGenericResource, config: SsgConfig) => {
                        const mergedResource: IGenericResource = config.scopes.mergeToParent(resource);
                        return mergedResource;
                    },

                    children: {
                        type: 'file',
                        fileSrcDirs: [ './extracting' ],
                        filePostfix: '.extractor',
                        fileChainStrategy: 'serial',
                        strategy: 'serial',
                        inputMatchProp: 'srcFormat',
                        processors: {
                            'dir': [ 'dir' ],
                            'html': [ 'html' ],
                            'md': [ 'md', 'html' ],
                            'njk': [ 'md', 'html' ],
                            'ts': [ /*'md',*/ 'ts' ],
                            'js': [ 'data' ],
                            'json': [ 'data' ],
                            'yml': [ 'data' ],
                            'component': [ 'component' ]
                        }
                    },

                    merge: (originalResource: IGenericResource, processedResource: IGenericResource, config: SsgConfig) => {
                        processedResource.parent = originalResource;
                        const mergedResource: IGenericResource = config.scopes.mergeToParent(processedResource);
                        return mergedResource;
                    },
                },
                {
                    id: 'compiler',
                    inputMatchProp: 'srcFormat',

                    preProcess: async function (resource: IGenericResource, config: SsgConfig) {
                        return resource;
                    },
                    postProcess: async (resource: IGenericResource, config: SsgConfig) => {
                        return resource;
                    },

                    children: {
                        type: 'file',
                        fileSrcDirs: [ './compiling' ],
                        filePostfix: '.compiler',
                        fileChainStrategy: 'serial',
                        strategy: 'serial',
                        inputMatchProp: 'srcFormat',
                        /*merge: (originalResource: IGenericResource, processedResource: IGenericResource, config: SsgConfig) => {
                            processedResource.parent = originalResource;
                            const mergedResource: IGenericResource = config.scopes.mergeToParent(processedResource);
                            return mergedResource;
                        },*/
                        processors: {
                            'dir': [
                                'dir'
                            ],
                            'html': [
                                'placeholder',
                                'html',
                                'fragments',
                                'njk'
                            ], // or 'placeholder', 'component' instead of component
                            'md': [
                                'placeholder',
                                'md',
                                'fragments',
                                'njk'
                            ],
                            'njk': [
                                'placeholder',
                                'njk',
                                'fragments',
                                //'placeholder',
                                //'fragments',
                            ],
                            'ts': [
                                'ts',
                                'placeholder',
                                'fragments',
                                'html',
                                'njk'
                            ],
                            'component': [
                                'component',
                                'html'
                            ]
                            /*'scss': [
                                'scss'
                            ],*/
                        }
                    },
                },
                {
                    id: 'writer',
                    inputMatchProp: 'targetFormat',

                    preProcess: async function (resource: IGenericResource, config: SsgConfig) {
                        return resource;
                    },
                    postProcess: async (resource: IGenericResource, config: SsgConfig) => {
                        return resource;
                    },

                    children: {
                        type: 'file',
                        fileSrcDirs: [ './writing' ],
                        filePostfix: '.writer',
                        fileChainStrategy: 'serial',
                        strategy: 'serial',
                        inputMatchProp: 'targetFormat',
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
                    },
                }
            ]
        },
    };

    return ssgProcessorConfiguration;
}

const defaultProcessingTreeConfig: IProcessingNodeConfig = getDefaultProcessingRootNodeConfig();

export default defaultProcessingTreeConfig;