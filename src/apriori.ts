/**
 * A template tag that will resolve only after all
 * interpolated promises have been resolved, finally returning the
 * intended string.
 *
 * @example
 * const t = tag`I will wait for this ${Promise.resolve("promise")}!!!`
 * // t === 'I will wait for this promise!!!'
 *
 * @param {Array<string>} strings
 * @param  {...any} expressions
 * @returns {Promise<string>}
 */
export async function tag(
  strings: Array<string>,
  ...expressions: any[]
): Promise<string> {
  const promiseExpressions: unknown[] = [];

  for (let [i, exp] of Array.from(expressions.entries())) {
    if (exp instanceof Promise) promiseExpressions.push(exp);
    else promiseExpressions.push(Promise.resolve(exp));
  }

  const resolvedExpressions = await Promise.all(promiseExpressions);
  return (
    resolvedExpressions.map((exp, i) => `${strings[i]}${exp}`).join("") +
    strings[resolvedExpressions.length]
  );
}

/**
 * Effectively creates a template literal out of an existing template string and wraps it in a function
 * which can be called multiple times to 'render' the template with the given arguments.
 *
 * @example
 * const t = await apriori.template('I will render this ${"guy"} immediately!!!')();
 * // t === 'I will render this guy immediately!!!'
 *
 * @param {string} templateStr the template string
 * @param {Array<string>} argNames tThe names of the parameters of the returned function (which can be 'seen' inside the template string)
 * @returns {(...any): string}
 */
export function template(
  templateStr: string,
  argNames?: Array<string>,
): (...any) => string {
  if (!argNames) argNames = [];
  return Function(...argNames, `return \`${templateStr}\`;`) as (
    ...any
  ) => string;
}
/**
 * Similar to template but the built template is also 'promise-aware' and will allow them to resolve to string values
 * before interpolating them.
 *
 * @example
 * const t = await apriori.asyncTemplate('I will wait for this ${Promise.resolve("promise")}!!!')();
 * // t === 'I will wait for this promise!!!'
 *
 *
 * @param {string} templateStr the template string
 * @param {Array<string>} argNames The names of the parameters of the returned function (which can be 'seen' inside the template string)
 * @param {string} tagName Supply a tagName argument to change the name of the tag function inside the template string if
 * the default name (T) is present in  argNames.
 * @returns {(...any): string}
 */
export function asyncTemplate(
  templateStr: string,
  argNames: Array<string>,
  tagName: string,
): (...any) => string {
  if (!argNames) argNames = [];
  if (!tagName) tagName = "T";
  if (argNames.includes(tagName)) {
    throw new Error(`The tag name ${tagName} clashes with the name of one of the arguments. 
        Please change the tag name or the argument name to resolve this.`);
  }
  const f = Function(
    tagName,
    ...argNames,
    `return ${tagName}\`${templateStr}\`;`,
  );
  return (...args) => f(tag, ...args);
}

/**
 * The return value of a call to arrayTemplate.
 */
export interface ArrayTemplate {
  (arr: Iterable<any>, ...args: any[]): string;
}

/**
 * Similar to template, but will render an iterable (such as array) of items together instead
 * of rendering each item individually. It improves efficiency in these scenarios.
 *
 * @example
 * const t = arrayTemplate('I will render this ${it}/${other} immediately!!!', ['other'], 'it', ' & ')([1, 2, 3, 4, 5], '(shared)');
 * // t === 'I will render this 1/(shared) immediately!!! & I will render this 2/(shared) immediately!!! & I will render this 3/(shared) immediately!!! & I will render this 4/(shared) immediately!!! & I will render this 5/(shared) immediately!!!'
 *
 * @param {string} templateStr The template string
 * @param {Array<string>} argNames The names of the parameters (after the iterable) of the returned function (which can be 'seen' inside the template string)
 * @param {string} itemName The name of the current item of the iterable as seen inside the template string. Defaults
 * to 'item'
 * @param {string} itemSep The text that goes between the rendered items.
 * Defaults to the empty string.
 * @returns {ArrayTemplate}
 */
export function arrayTemplate(
  templateStr: string,
  argNames: Array<string>,
  itemName: string,
  itemSep: string,
): ArrayTemplate {
  if (!argNames) argNames = [];
  if (!itemName) itemName = "item";
  if (!itemSep) itemSep = "";

  return Function(
    "arr",
    ...argNames,
    `
        const result = [];
        for (let ${itemName} of arr) {
            result.push(\`${templateStr}\`);
        }
        return result.join('${itemSep}')
    `,
  ) as ArrayTemplate;
}

/**
 * Async equivalent of arrayTemplate. The async template tag ('T' by default)
 * is applied to the template string. Use this when there are promises
 * among the arguents that will be passed to the returned function.
 *
 * @example
 * let t = asyncArrayTemplate('I will async render this ${item}')([1, 2, 3, 4, 5].map(i => Promise.resolve(i)));
 * console.log(t instanceof Promise);   // true
 * t = await t
 * // t === 'I will async render this 1I will async render this 2I will async render this 3I will async render this 4I will async render this 5'
 *
 * @param {string} templateStr The template string
 * @param {Array<string>} argNames The names of the parameters (after the iterable) of the returned function (which can be 'seen' inside the template string)
 * @param {string} itemName The name of the current item of the iterable as seen inside the template string. Defaults
 * to 'item'
 * @param {string} itemSep The text that goes between the rendered items.
 * Defaults to the empty string.
 * @param {string} tagName Supply a tagName argument to change the name of the tag function inside the template string if
 * the default name (T) is present in  argNames.
 * @returns {ArrayTemplate}
 */
export function asyncArrayTemplate(
  templateStr: string,
  argNames: Array<string>,
  itemName: string,
  itemSep: string,
  tagName: string,
): ArrayTemplate {
  if (!argNames) argNames = [];
  if (!itemName) itemName = "item";
  if (!itemSep) itemSep = "";
  if (!tagName) tagName = "T";

  if (itemName === tagName) {
    throw new Error(`The tag name ${tagName} is the same as the item name. 
        Please change the tag name or the item name to resolve this.`);
  }
  if (argNames.includes(tagName)) {
    throw new Error(`The tag name ${tagName} clashes with the name of one of the arguments. 
        Please change the tag name or the argument name to resolve this.`);
  }

  const f = Function(
    tagName,
    "arr",
    ...argNames,
    `
        const result = [];
        for (let ${itemName} of arr) {
            result.push(${tagName}\`${templateStr}\`);
        }
        return Promise.all(result).then(resolved => resolved.join('${itemSep}'));
    `,
  );
  return (arr, ...args) => f(tag, arr, ...args);
}

/**
 * Fetches text (typically markup) from the url. This is only a shorthand
 * for using `fetch`.
 *
 * @example
 * const markup = await apriori.get('./apriori/get.html')
 *
 *
 * @param {string} url  The url to pass to `fetch`
 * @param {boolean} [suppressErrors] Whether to return the empty string if an error occurs.
 * @param {RequestInit} [init]  The `init` argument for `fetch`
 * @returns {Promise<string>}
 */
export async function get(
  url: string,
  suppressErrors?: boolean,
  init?: RequestInit,
): Promise<string> {
  let result = fetch(url, init).then((r) => r.text());
  if (suppressErrors) result = result.catch((r) => "");
  return result;
}

/**
 * Shorthand for creating a DocumentFragment from markup. If the
 * fragment has only one child, the child is returned instead.
 * So this is also a shorthand for creating single elements.
 *
 * @example
 * const frag1 = apriori.createFragment(`
 *    <p>Para 1</p>
 *    <p>Para 2</p>
 *`)
 * // <p>Para 1</p><p>Para 2</p>
 *
 * @param {string} markup The `outerHTML` of what to create
 * @returns {Node}
 */
export const createFragment = function (markup: string): Node {
  const temp = document.createElement("template");
  temp.innerHTML = markup;
  let result = temp.content;
  if (result.children.length === 1) return result.children[0];
  return result;
};
