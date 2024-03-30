import { ArgumentParser } from 'argparse';
import { compileFileTo } from './src/document-compile';
import { SsgConfig } from './src/config';
import path from 'path';

function main() {
    const parser = new ArgumentParser({
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
    };
    return compileFileTo(args.sourceFilePath, args.targetFilePath, data, config);
}

if (require.main?.filename === __filename) {
    const testRender = main();
    console.log(testRender);
}

//npx ts-node cli.ts sample/sample-markdown.md sample/dist/sample-markdown.html