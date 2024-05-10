import * as path from 'path';
import * as fs from 'fs';



export async function getFsNodeStat(nodePath: string): Promise<fs.Stats | null> {
    try {
        const stat: fs.Stats = await fs.promises.stat(nodePath);
        return stat;
    }
    catch (error: any) {
        console.log(`Fs node at ${nodePath} does not exist`);

    }
    return null;
}

export async function* walkYieldFiles(dirPath: string): AsyncGenerator<string> {
    if (!dirPath) {
        return;
    }

    for await (const fsNodeStat of await fs.promises.opendir(dirPath)) {
        const entry = path.join(dirPath, fsNodeStat.name);
        if (fsNodeStat.isDirectory()) {
            yield* walkYieldFiles(entry);
        }
        else if (fsNodeStat.isFile()) {
            yield entry;
        }
    }
}
async function findDirPath(rootDir: string, dirName: string): Promise<string | null> {

    for await (const filePath of walkYieldFiles(rootDir)) {

        const filePathParsed = path.parse(filePath);
        const fileDir: string = filePathParsed.dir;
        const fileDirParsed = path.parse(fileDir);

        const fileStat = fs.lstatSync(fileDir);
        //console.log(filePath);

        if (fileStat.isDirectory() && fileDirParsed.name.trim() === dirName.trim()) {
            return fileDir;
        }
    }
    return null;
}