/**
 * Base class for EventListener and MatchListener
 */
class Listener {
  listener;
  listen(eventName, elements, options) {
    for (let element of elements)
      element.addEventListener(eventName, this.listener, options);
  }
  remove(eventName, ...elements) {
    for (let element of elements)
      element.removeEventListener(eventName, this.listener);
  }
}
const defaultRunContext = { running: false };
/**
 * Composes a listener function from the functions in ops. ops may be
 * a single function or an array of functions.
 *
 * The functions are called in the same order when handling events. They
 * will receive as erguments the event object and a run context.
 *
 * The run context can be passed as the second argument to this function
 * (or it will default to the global runContext). The context can be used
 * for communication and it also maintains a running property which will
 * ensure that no 2 handlers using it will run concurrently (providing the
 * API is respected).
 *
 * The API is as follows:
 * If a handler function returns a promise, it is assumed to still be running
 * until the promise resolves or rejects. Neither the handler nor any other
 * handlers using the same run context can start until it stops running.
 *
 * Individual op functions can also terminate event handling by returning the
 * END symbol.
 *
 * @example
 * input.onkeyup = eventListener([onEnter, () => login(input.value), preventDefault]);
 * apply({
 *     '#loginButton': button => {
 *         button.onclick = eventListener(() => login(input.value));
 *     }
 * }, form);
 *
 *
 * @param {Function[] | Function} ops The function or functions making up the handler
 * @param {any} [runContext] The optional run context.
 * @returns
 */
function eventListener(ops, runContext) {
  if (!runContext) runContext = defaultRunContext;
  if (!(ops instanceof Array)) ops = [ops];
  let op;
  async function listener(e) {
    if (runContext.running) return;
    runContext.running = true;
    let result;
    for (op of ops) {
      result = await op(e, runContext);
      if (result === END) break;
    }
    runContext.running = false;
    return result;
  }
  return listener;
}
/**
 * Similar to eventListener function but has methods for attaching
 * and removing itself from multiple elements at the same time.
 *
 * This gives the listener a 'personality' and promotes its reuse
 * (good practice).
 */
class EventListener extends Listener {
  constructor(ops, runContext) {
    super();
    this.listener = eventListener(ops, runContext);
  }
}
/**
 * Symbol which will terminate event handling if returned by any of
 * the functions in the ops chain of an event handler created with
 * `eventHandler`.
 *
 * @example
 * const keyEventBreaker = (e: KeyboardEvent) => (e.key !== key)? END: '';
 */
const END = Symbol();
/**
 * Takes advantage of event bubbling to listen for events on descendant
 * elements to reduce the number of listeners to create.
 *
 * @example
 * table.onclick = matchListener({
 *     'a.lbl': e => select(e.target.parentNode.parentNode),
 *     'span.remove': [removeListener, preventDefault, stopPropagation]
 * }, true);
 *
 * @param {Matcher} matcher Map of event target matcher to associated handler function
 * @param {boolean} wrapListeners Whether to werap the matcher functions with `eventListener`.
 */
function matchListener(matcher, wrapListeners) {
  const listenerMap = {};
  for (let [selector, args] of Object.entries(matcher)) {
    if (wrapListeners || args instanceof Array) {
      let args2;
      if (!(args instanceof Array) || typeof args.at(-1) === "function") {
        args2 = [args, null];
      }
      listenerMap[selector] = args2
        ? eventListener(args2[0], args2[1])
        : eventListener(args[0], args[1]);
    } else listenerMap[selector] = args;
  }
  function listener(e) {
    for (let [selector, fn] of Object.entries(listenerMap)) {
      if (e.target.matches && e.target.matches(selector)) return fn(e);
    }
  }
  return listener;
}
/**
 * Similar to matchListener function but has methods for attaching
 * and removing itself from multiple elements at the same time.
 *
 * This gives the listener a 'personality' and promotes its reuse
 * (good practice).
 */
class MatchListener extends Listener {
  constructor(matcher, wrapListeners) {
    super();
    this.listener = matchListener(matcher, wrapListeners);
  }
}
/**
 * Simply calls `stopPropagation` on the event. Useful for creating one-liner
 * event handlers.
 *
 * @param e The event object
 * @returns
 */
const stopPropagation = (e) => e.stopPropagation();
/**
 * Simply calls `preventDefault` on the event. Useful for creating one-liner
 * event handlers.
 *
 * @param e The event object
 * @returns
 */
const preventDefault = (e) => e.preventDefault();
/**
 * This returns a function which will stop an event handler run (typically for keyup,
 * keydown etc) from continuing if it has not been triggered by the specified key.
 * The returned functions are to be placed before the main handler functions in the `ops`
 * array passed to `eventListener`.
 *
 * @example
 *
 *
 * @returns {Function}
 */
const onKey = (key) => (e) => (e.key !== key ? END : "");
const keys = { enter: "Enter" };
/**
 * This will stop a key(up or down...) event handler run from continuing if
 * it has not been triggered by the enter key.
 */
const onEnter = onKey(keys.enter);

export {
  END,
  EventListener,
  Listener,
  MatchListener,
  eventListener,
  keys,
  matchListener,
  onEnter,
  onKey,
  preventDefault,
  stopPropagation,
};
