import type { SsgConfig } from './src/config';
import { parseArgsSetupInitializeConfig } from './src/setup-config';
import { processFsNodeAtPath } from './src/processing/process-resource';
import type { IProcessResource } from './src/pipeline/i-processor';

async function main() {
    /*const parser = new ArgumentParser({
        description: 'Generated a populated container from a template'
    });

    parser.add_argument('sourceFilePath', { help: 'Source path to consume' });
    parser.add_argument('targetFilePath', { help: 'Target path to write to' });

    parser.add_argument('-ca', '--cacheDir', { help: 'Which directory to use to store the fragment cache for compiled components' });
    parser.add_argument('-runners', '--runner_files', {
        help: 'List of activated runner files for this run -> when this is specified default runners that are not in the list get deactivated',
        nargs: '+'
    });

    parser.add_argument('-drp', '--defaultRunnersRoot', {
        help: `Where from which dir are the default runners located and loaded from when they are needed (mostly for internal use)`,
        nargs: '+',
        default: path.join(__dirname, 'src', 'compilers'),
    });

    //Example: [ path.join(process.cwd(), 'mysite', 'mycustomrunners') ]
    parser.add_argument('-rrp', '--runnerResolvePaths', {
        help: `Additional paths from which to try to resolve runners/compilers from, can for instance be used
        to provide an additional runners dir, with your own custom runners`,
        nargs: '+'
    });

    //Example: [ path.join(process.cwd(), 'mysite', 'mycustomrunners') ]
    parser.add_argument('-crp', '--componentResolvePaths', {
        help: `Additional paths from which to try to resolve components/layouts from, in order to reference them without having to
        specify the full path, particularly when loading them as layouts`,
        nargs: '+'
    });

    parser.add_argument('-data', '--data', {
        help: `JSON encoded string of the initial data passed to the component to be compiled`,
        nargs: '+'
    });


    const args: any = parser.parse_args();

    const dataString = args.data;
    let data = {};
    if (dataString) {
        data = JSON.parse(dataString);
    }

    const config: SsgConfig = {
        cacheDir: args.cacheDir,
        defaultRunnersRoot: args.defaultRunnersRoot,
        runnerResolvePaths: args.runnerResolvePaths,
        componentResolvePaths: args.componentResolvePaths,
        fragmentCacheDisabled: true,
    };*/

    console.time('fullstartup');

    let config: SsgConfig = {
        fragmentCacheDisabled: true
    };
    config = await parseArgsSetupInitializeConfig(config);

    if (!config.sourcePath || !config.targetPath) {
        throw new Error('Source and target path need to be specified to compile component');
    }

    const toCompileResource: IProcessResource = {
        content: null,
        data: {
            src: config.sourcePath,
            target: config.targetPath
        }
    };

    console.timeEnd('fullstartup');
    //Startup is about 1.3 seconds
    //800msec compiling the processing tree
    //460msec loading the default components from disk (could probably be reduced a lot by bundling them together, minifying
    //i am guessing that the issue are the many IO calls for checking the filesystem and dynamically importing every found default component seperately
    //Same with building the processing tree


    console.time('compile');


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
        tryMultiFileCompilePromises.push(processFsNodeAtPath(config.sourcePath, config.targetPath, config));
    }
    await Promise.all(tryMultiFileCompilePromises);*/

    await processFsNodeAtPath(config.sourcePath, config.targetPath, config);


    //TODO seperate file and buffer compile
    /*const resultDoc: FalsyAble<IProcessResource> = await config.masterCompileRunner?.compile(toCompileResource, config);
    if (resultDoc) {
        console.log("Compiled doc Content:");
        console.log(resultDoc.content);
        console.log("Compiled doc data:");
        console.log(resultDoc.data);
    }*/

    console.timeEnd('compile');

    //return compileFileTo(args.sourceFilePath, args.targetFilePath, data, config);
    //return compileResourceTo(config.sourcePath, config.targetPath, config.data, config);
}

if (require.main?.filename === __filename) {
    const testRender = main();
    console.log(testRender);
}

//npx ts-node cli.ts sample/sample-markdown.md sample/dist/sample-markdown.html