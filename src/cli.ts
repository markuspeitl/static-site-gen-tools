import type { SsgConfig } from './config/ssg-config';
import type { IProcessResource } from './processors/shared/i-processor-resource';
import { filterFalsy, mapDictListProp } from '@markus/ts-node-util-mk1';
import { parseArgsSetupInitializeConfig } from './config/setup-config';
import http from 'node:http';
import path from 'path';


export async function serveProcessedResults(
    processedResource: IProcessResource,
    config: SsgConfig
) {
    const processedDocuments: any[] = filterFalsy(config.processedDocuments);

    const docSources = mapDictListProp(processedDocuments, 'src');
    console.log(docSources.join('\n'));
    console.log("Processed doc File urls: ");
    const documentTargets: string[] = mapDictListProp(processedDocuments, 'target');
    const fileUrls = documentTargets.map((target: string) => "file://" + path.resolve(target));
    console.log(fileUrls.join('\n'));

    const requestListener = function (req, res) {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end("My first server!");
    };
    const server = http.createServer(requestListener);

    const host = '127.0.0.1';
    const port = 8222;
    server.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
    });
}

export async function printProcessedDocuments(
    processedResource: IProcessResource,
    config: SsgConfig
) {
    const processedDocuments: any[] = filterFalsy(config.processedDocuments);
    console.log("Processed documents: ");

    for (let procDocument of processedDocuments) {
        if (typeof procDocument === 'object') {
            const docSrc: string = procDocument.src || '';
            const docTarget: string = procDocument.target || '';
            console.log(`Processed doc: '${docSrc}' --> '${docTarget}'`);
        }
    }
}

async function main() {
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

    const toCompileResource: IProcessResource = {
        content: null,
        document: {
            src: sourcePath,
            target: targetPath
        }
    };

    console.timeEnd('run_startup_time');
    //Startup is about 1.3 seconds
    //800msec compiling the processing tree
    //460msec loading the default components from disk (could probably be reduced a lot by bundling them together, minifying
    //i am guessing that the issue are the many IO calls for checking the filesystem and dynamically importing every found default component seperately
    //Same with building the processing tree


    console.time('run_compile_time');

    //console.time('full_processing');
    const processedResource: IProcessResource = await config.processor.processDocumentTo(sourcePath, targetPath, config);
    //console.timeEnd('full_processing');

    //printProcessedDocuments(processedResource, config)
    //serveProcessedResults(processedResource, config);
    console.timeEnd('run_compile_time');

    return processedResource;


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
}

if (require.main?.filename === __filename) {
    const testRender = main();
    console.log(testRender);
}

//npx ts-node cli.ts sample/sample-markdown.md sample/dist/sample-markdown.html