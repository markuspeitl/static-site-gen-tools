import { filterFalsy } from "./util";

export async function settleValueOrNull(promises: Promise<any>[]): Promise<Array<any | null>> {

    const settledPromises: PromiseSettledResult<any>[] = await Promise.allSettled(promises);
    return settledPromises.map((settledCompile: PromiseSettledResult<any>) => {
        if (settledCompile.status === 'rejected') {
            return null;
        }

        return settledCompile.value;
    });
}

export async function settleValueOrNullFilter(promises: Promise<any>[]): Promise<Array<any>> {
    const results: Array<any | null> = await settleValueOrNull(promises);
    return filterFalsy(results);
}