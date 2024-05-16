import { DataParsedDocument } from "../../compilers/runners";
import { SsgConfig } from "../../config";

export async function postProcessReading(resource: DataParsedDocument, config: SsgConfig): Promise<DataParsedDocument> {
    return resource;
}