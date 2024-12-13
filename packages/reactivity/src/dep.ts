export function createDep(cleanup) {
    const dep = new Map() as any;
    dep.cleanup = cleanup;
    return dep;

}