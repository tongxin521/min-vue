import { extend, isArray, isObject, toNumber } from "@vue/shared";

const TRANSITION = 'transition';
const ANIMATION = 'animation';

export const vtcKey = Symbol('vtc');
export const Transition = (props,{ slots }) => h(BaseTransition, resolveTransitionProps(props), slots);

Transition.displayName = 'Transition'


const DOMTransitionPropsValidators = {
    name: String,
    type: String,
    css: {
      type: Boolean,
      default: true,
    },
    duration: [String, Number, Object],
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    appearFromClass: String,
    appearActiveClass: String,
    appearToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String,
  }

export function resolveTransitionProps(rawProps) {
    const baseProps: any = {};
    for(const key in rawProps) {
        if (!(key in DOMTransitionPropsValidators)) {
            baseProps[key] = rawProps[key];
        }
    }

    if (rawProps.css === false) {
        return baseProps;
    }

    const {
        name = 'v',
        type,
        duration,
        enterFromClass = `${name}-enter-from`,
        enterActiveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        appearFromClass = enterFromClass,
        appearActiveClass = enterActiveClass,
        appearToClass = enterToClass,
        leaveFromClass = `${name}-leave-from`,
        leaveActiveClass = `${name}-leave-active`,
        leaveToClass = `${name}-leave-to`,
    } = rawProps

    const durations = normalizeDuration(duration);
    const enterDuration = durations && durations[0];
    const leaveDuration = durations && durations[1];

    const {
        onBeforeEnter,
        onEnter,
        onEnterCancelled,
        onLeave,
        onLeaveCancelled,
        onBeforeAppear = onBeforeEnter,
        onAppear = onEnter,
        onAppearCancelled = onEnterCancelled,
    } = baseProps;

    const finishEnter = (el, isAppear, done?) => {
        removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
        removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
        done && done();
    };

    const finishLeave = (el, done?) => {
        el._isLeaving = false;
        removeTransitionClass(el, leaveFromClass);
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass)
        done && done();
    };

    const makeEnterHook = (isAppear) => {
        return (el, done) => {
            const hook = isAppear ? onAppear : onEnter;
            const resolve = () => finishEnter(el, isAppear, done)

            removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);

            addTransitionClass(el, isAppear ? appearToClass : enterToClass);

            if (!hasExplicitCallback(hook)) {
                whenTransitionEnds(el, type, enterDuration, resolve)
            }
        };
    }

    return extend(baseProps, {
        onBeforeEnter(el) {
            callHook(onBeforeEnter, [el]);
            addTransitionClass(el, enterFromClass);
            addTransitionClass(el, enterActiveClass)
        },
        onBeforeAppear(el) {
            callHook(onBeforeAppear, [el]);
            addTransitionClass(el, appearFromClass);
            addTransitionClass(el, appearActiveClass)
        },
        onEnter: makeEnterHook(false),
        onAppear: makeEnterHook(true),
        onLeave(el, done) {
            el._isLeaving = true;
            const resolve = () => finishLeave(el, done);
            addTransitionClass(el, leaveFromClass);
            addTransitionClass(el, leaveActiveClass);
            forceReflow();
            nextFrame(() => {
                if (!el._isLeaving) {
                  // cancelled
                  return
                }
                removeTransitionClass(el, leaveFromClass)
                addTransitionClass(el, leaveToClass)
                if (!hasExplicitCallback(onLeave)) {
                  whenTransitionEnds(el, type, leaveDuration, resolve)
                }
            })
            callHook(onLeave, [el, resolve])
        },
        onEnterCancelled(el) {
            finishEnter(el, false)
            callHook(onEnterCancelled, [el])
        },
        onAppearCancelled(el) {
            finishEnter(el, true)
            callHook(onAppearCancelled, [el])
        },
        onLeaveCancelled(el) {
            finishLeave(el)
            callHook(onLeaveCancelled, [el])
        }
    })

}

function normalizeDuration(duration) {
    if (duration == null) {
        return null;
    }
    else if (isObject(duration)) {
        return [Number(duration.enter), Number(duration.leave)];
    }
    else {
        const n = NumberOf(duration);
        return [n, n];
    }
}

function NumberOf(val) {
    const res = toNumber(val);

    return res;
}

export function removeTransitionClass(el, cls) {
    cls.split(/\s+/).forEach(c => {
        c && el.classList.remove(c);
    });

    const _vtc = el[vtcKey];

    if (_vtc) {
        _vtc.delete(cls);
        if (_vtc.size) {
            el[vtcKey] = undefined
          }
    }
}

export function addTransitionClass(el, cls) {
    cls.split(/\s+/).forEach(c => {
        c && el.classList.add(c);
    });

    const _vtc = el[vtcKey] || (el[vtcKey] = new Set());

    _vtc.add(cls);
}

const callHook = (hook, args) => {
    if (isArray(hook)) {
        hook.forEach(h => h(...args));
    }
    else if (hook) {
        hook(...args);
    }
}

const hasExplicitCallback = (hook) => {
    return hook
      ? isArray(hook)
        ? hook.some(h => h.length > 1)
        : hook.length > 1
      : false;
}

export function forceReflow() {
    return document.body.offsetHeight
}

let endId = 0
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
    const id = (el._endId = ++endId);
    const resolveIfNotStale = () => {
        if (id === el._endId) {
            resolve();
        }
    }

    if (explicitTimeout) {
        return setTimeout(resolveIfNotStale, explicitTimeout);
    }

    const {type, timeout, propCount} = getTransitionInfo(el, expectedType);

    if (!type) {
        return resolve();
    }

    const endEvent = type + 'end'

    let ended = 0

    const end = () => {
        // 移除结束事件监听器
        el.removeEventListener(endEvent, onEnd)
        // 调用resolveIfNotStale函数
        resolveIfNotStale()
    }

    const onEnd = (e) => {
        if (e.target === el && ++ended >= propCount) {
          end()
        }
    }

    setTimeout(() => {
        // 如果结束计数器小于属性计数器
        if (ended < propCount) {
          end()
        }
    }, timeout + 1);

    el.addEventListener(endEvent, onEnd);
}

function nextFrame(cb) {
    requestAnimationFrame(() => {
        requestAnimationFrame(cb);
    });
}


export function getTransitionInfo(el, expectedType) {
    const styles = window.getComputedStyle(el)
    const getStyleProperties = (key) => (styles[key] || '').split(', ');

    const transitionDelays = getStyleProperties(`${TRANSITION}Delay`);
    const transitionDurations = getStyleProperties(`${TRANSITION}Duration`)
    const transitionTimeout = getTimeout(transitionDelays, transitionDurations)
    const animationDelays = getStyleProperties(`${ANIMATION}Delay`)
    const animationDurations = getStyleProperties(`${ANIMATION}Duration`)
    const animationTimeout = getTimeout(animationDelays, animationDurations)

    let type = null;
    let timeout = 0
    let propCount = 0

    if (expectedType === TRANSITION) {
        if (transitionTimeout > 0) {
            type = TRANSITION
            timeout = transitionTimeout
            propCount = transitionDurations.length
        }
    }
    else if (expectedType === ANIMATION) {
        if (animationTimeout > 0) {
            type = ANIMATION
            timeout = animationTimeout
            propCount = animationDurations.length
        }
        else {
            timeout = Math.max(transitionTimeout, animationTimeout);
            type =
              timeout > 0
                ? transitionTimeout > animationTimeout
                  ? TRANSITION
                  : ANIMATION
                : null
            propCount = type
              ? type === TRANSITION
                ? transitionDurations.length
                : animationDurations.length
              : 0
        }
    }

    const hasTransform =
    type === TRANSITION &&
    /\b(transform|all)(,|$)/.test(
      getStyleProperties(`${TRANSITION}Property`).toString(),
    );

    return {
        type, // 过渡类型
        timeout, // 过渡时间
        propCount, // 过渡属性数量
        hasTransform, // 是否包含变换属性
    };
}


function getTimeout(delays, durations) {
    while (delays.length < durations.length) {
        delays = delays.concat(delays);
    }

    return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])))
}

function toMs(s) {
    if (s === 'auto') return 0;
    return Number(s.slice(0, -1).replace(',', '.')) * 1000
}