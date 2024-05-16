export async function settleValueOrNull(promises: Promise<any>[]): Promise<Array<any | null>> {

    const settledPromises: PromiseSettledResult<any>[] = await Promise.allSettled(promises);
    return settledPromises.map((settledCompile: PromiseSettledResult<any>) => {
        if (settledCompile.status === 'rejected') {
            return null;
        }

        return settledCompile.value;
    });
}