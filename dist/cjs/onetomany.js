'use strict';

/**
 * Creates a One object which transmits a call, method dispatch, property 
 * get or set applied to the 'one' object to the 'many' objects. 
 * 
 * The recursive arg is used to ensure that getting properties always 
 * wraps the array results with One also.
 * 
 * The context arg will be passed to all delegated calls. A new object 
 * is created if it is not provided.
 * 
 * @param {*} many 
 * @param {*} recursive 
 * @param {*} context 
 * @returns 
 */
function one(many, recursive, context) {
    return new Proxy(new One(many, recursive, context, one), oneTrap);
}

const PURE = Symbol();

function unWrap(one) {
    return one[PURE] || one;
}

const oneTrap = {
    get(target, p) {
        if (p === PURE) return target;
        let result = target.get(p);
        if (result.length && typeof result[0] === 'function') {
            result = (...args) => target.call(args, p);
        }
        return result;
    },
    set(target, p, value) {
        target.set(p, value);
        return true;
    }
};

class One {
    constructor(many, recursive, context, ctor) {
        this.many = many; this.recursive = recursive, this.ctor = ctor;
        this.context = context || {};
    };
    /**
     * Gets corresponding properties from all the objects in many
     * 
     * @param {*} prop 
     * @returns 
     */
    get(prop) {
        const results = [];
        const length = this.many.length;
        if (prop !== undefined) {
            for (let i = 0; i < length; i++) results.push(this.many[i][prop]);
        } else {
            for (let i = 0; i < length; i++) results.push(this.many[i]);
        }
        return (this.recursive)? (this.ctor || new One)(results, this.recursive, this.context, this.ctor): results;
    };
    /**
     * Sets corresponding property values in the objects in many.
     * 'values' are treated similarly to 'args' in the call method.
     * 
     * @param {*} values 
     * @param {*} prop 
     */
    set(prop, values) {
        if (values === undefined) return this.set(prop, this.get(prop));  
        // simply reset existing values, probably to trigger proxy handlers or setters
        
        const length = this.many.length;
        const j = values.length;
        if (prop !== undefined) {
            for (let i = 0; i < length; i++) this.many[i][prop] = values[Math.min(i, j - 1)];
        } else {
            for (let i = 0; i < length; i++) this.many[i] = values[Math.min(i, j - 1)];
        }
    };
    /**
     * Delete the property from all objects in many.
     * 
     * @param {*} prop 
     */
    delete(prop) {
        for (let many of this.many) delete many[prop];
    };
    /**
     * Calls all the items in many (if method is not specified) or the 
     * corresponding methods in many (if  method is specified).
     * 
     * args will be (or be coerced into) an array of argument for 
     * corresponding items in many:
     * 
     * args = [many1Args, many2Args, many3Args, ...].
     * 
     * When One is created with the one function, the outer array can 
     * be omitted in the calls since there is no explicit need to 
     * secify a method in this case (it is infered by the wrapping proxy)
     * 
     * 
     * @param {*} args 
     * @param {*} method 
     * @returns 
     */
    call(args, method) {
        if (args === undefined) args = [[]];
        const results = [];
        const length = this.many.length;
        const j = args.length;
        let iArgs, result;
        if (method !== undefined) {
            for (let i = 0; i < length; i++) {
                iArgs = args[Math.min(i, j - 1)] || [];
                result = this.many[i][method](...iArgs, this.context);
                results.push(result);
            }
        } else {
            for (let i = 0; i < length; i++) {
                iArgs = args[Math.min(i, j - 1)] || [];
                result = this.many[i](...iArgs, this.context);
                results.push(result);
            }
        }
        return results;
    };
}

exports.One = One;
exports.one = one;
exports.unWrap = unWrap;