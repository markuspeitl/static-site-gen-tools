import type { SsgConfig } from './../config/ssg-config';
import type { IProcessResource } from './../processors/shared/i-processor-resource';
import { filterFalsy, mapDictListProp } from '@markus/ts-node-util-mk1';
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
