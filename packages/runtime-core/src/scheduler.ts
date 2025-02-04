const queue = [];
let isFlushing = false;
const resolvePromise = Promise.resolve();




export function queueJob(cb) {
    if (queue.length === 0 || !queue.includes(cb)) {
        queue.push(cb);
    }

    if (!isFlushing) {
        isFlushing = true;
        resolvePromise.then(() => {
            const copy = queue.slice(0);
            queue.length = 0;
            copy.forEach(job => job());
            copy.length = 0;
            isFlushing = false;
        });
    }
}

