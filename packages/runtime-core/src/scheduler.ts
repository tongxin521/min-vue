import { isArray } from "@vue/shared";

const queue = [];
let isFlushing = false;
let isFlushPending = false;
let currentFlushPromise = null;
const resolvedPromise = Promise.resolve();
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;


export function queueJob(cb) {
    if (queue.length === 0 || !queue.includes(cb)) {
        queue.push(cb);
    }

    queueFlush();
}


function queueFlush() {
    if (!isFlushing && !isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvedPromise.then(flushJobs);
    }
}

function flushJobs() {
    isFlushPending = false;
    isFlushing = true;
    try {
        for (let i = 0; i < queue.length; i++) {
            queue[i]();
        }
    }
    finally {
        queue.length = 0;
        flushPostFlushCbs()
        isFlushing = false;
        currentFlushPromise = null;
        if (queue.length || pendingPostFlushCbs.length) {
            flushJobs();
        }
    }
}


export function queuePostFlushCb(cb) {
    if (!isArray(cb)) {
        if (!activePostFlushCbs.length || !activePostFlushCbs.includes(cb)) {
            activePostFlushCbs.push(cb);
        }
    }
    else {
        pendingPostFlushCbs.push(...cb);
    }

    queueFlush();
}

function flushPostFlushCbs() {
    if (pendingPostFlushCbs.length) {
        const deduped = [...new Set(pendingPostFlushCbs)];
        pendingPostFlushCbs.length = 0;
        if (activePostFlushCbs) {
            activePostFlushCbs.push(...deduped);
            return;
        }

        activePostFlushCbs = deduped;
        for (let i = 0; i < activePostFlushCbs.length; i++) {
            activePostFlushCbs[i]();
        }

        activePostFlushCbs = null;
    }

}
