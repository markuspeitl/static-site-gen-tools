import { IGenericResource } from "../../processing-tree/i-processor";

export async function compileSubPathProcessFn(
    procChainId: string[]
) {
    return (
        resource: IGenericResource,
        config: any
    ) => {
        return config.processingTree.processSubPath(
            resource,
            config,
            procChainId
        );
    };
}
