import type { SsgConfig } from './config/ssg-config';
import type { IProcessResource } from './processors/shared/i-processor-resource';
import { parseArgsSetupInitializeConfig } from './config/setup-config';
import { printProcessedDocuments, serveProcessedResults } from './serve/results-explore';
import * as lodash from 'lodash';

//Startup is about 1.3 seconds
//800msec compiling the processing tree
//460msec loading the default components from disk (could probably be reduced a lot by bundling them together, minifying
//i am guessing that the issue are the many IO calls for checking the filesystem and dynamically importing every found default component seperately
//Same with building the processing tree
export async function init(): Promise<SsgConfig> {
    console.time('run_startup_time');

    let config: SsgConfig = {
        fragmentCacheDisabled: true
    } as SsgConfig;
    config = await parseArgsSetupInitializeConfig(config);


    const sourcePath: string = config.options.sourcePath;
    const targetPath: string = config.options.targetPath;

    if (!sourcePath || !targetPath) {
        throw new Error('Source and target path need to be specified to compile component');
    }

    console.timeEnd('run_startup_time');

    return config;
}

//The sample/nested-for.md runs converge to about 30msec (30sec for full 1000 documents run) per file compiled for 1000 compiled documents (if no caching is applied)
//In a realistic case this should be even faster, as when using the same file for all runs, then the file IO async tasks would deadlock each other
//So reading and writing can not be done 'async-like' / 'in-parrallel'
//For 100 compiles of nested-for it terminates in 3.4second, which is 34msec per compile
//For 10 it is 484msec, which is 48msec per run
//For 5 it is 296msec, which is 59.2msec per run
//For 1 it is 136msec, which is 136msec per run
//For 5000 pages it is 150670msec, which is 30.134msec per run (roughly equivalent to 100 - 1000 runs)
//4 compile steps are called on the document: 'placeholder', 'md', 'component', 'njk' and there are 2-3 nesting levels containing sub components
//The input and output files are about 1KB in size.
//Application was run with debugger attached and produced console output, things that might have affected performance
/*const tryMultiFileCompilePromises: any[] = [];
for (let i = 0; i < 5000; i++) {
    tryMultiFileCompilePromises.push(processFsNodeAtPath(sourcePath, targetPath, config));
}
await Promise.all(tryMultiFileCompilePromises);*/
export async function run(config: SsgConfig, resource?: IProcessResource): Promise<IProcessResource> {

    const sourcePath: string = config.options.sourcePath;
    const targetPath: string = config.options.targetPath;

    if (!resource) {
        resource = {
            src: sourcePath,
            target: targetPath
        };
    }

    console.time('run_compile_time');

    //console.time('full_processing');
    //const processedResource: IProcessResource = await config.processor.processDocumentTo(sourcePath, targetPath, config);

    /*for (let i = 0; i < 10; i++) {
        let newResource = lodash.cloneDeep(resource);
        const processedResource: IProcessResource = await config.processor.process(newResource, config);
    }*/
    const processedResource: IProcessResource = await config.processor.process(resource, config);
    //console.timeEnd('full_processing');

    //printProcessedDocuments(processedResource, config)
    //serveProcessedResults(processedResource, config);
    console.timeEnd('run_compile_time');
    //const processedResource: IProcessResource = await config.processor.process(resource, config);

    return processedResource;
}

async function main() {
    const config: SsgConfig = await init();
    return run(config);
}

if (require.main?.filename === __filename) {
    main();
    //console.log(testRender);
}

//npx ts-node cli.ts sample/sample-markdown.md sample/dist/sample-markdown.html