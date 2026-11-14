var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Tokens_set;
import { toCharArray } from "./utils.js";
import { equalFold } from "./equal.js";
/**
 * A collection of tokens.
 * @remarks
 * This class is used to store a set of tokens, which are represented as
 * `Uint32Array` objects. It provides methods to add tokens, check for their
 * existence, and iterate over them.
 * @example
 * ```ts
 * const tokens = new Tokens();
 * tokens.addString("hello");
 * tokens.addString("world");
 * console.log(tokens.length); // 2
 */
export class Tokens {
    /**
     * Creates a new instance of the `Tokens` class.
     */
    constructor() {
        _Tokens_set.set(this, void 0);
        __classPrivateFieldSet(this, _Tokens_set, new Array(), "f");
    }
    /**
     * Gets the tokens in the collection.
     * @returns An iterator that iterates over the tokens in the collection.
     */
    [(_Tokens_set = new WeakMap(), Symbol.iterator)]() {
        return __classPrivateFieldGet(this, _Tokens_set, "f")[Symbol.iterator]();
    }
    /**
     * Gets the number of tokens in the collection.
     */
    get length() {
        return __classPrivateFieldGet(this, _Tokens_set, "f").length;
    }
    /**
     * Adds a token to the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    addString(word) {
        this.add(toCharArray(word));
        return this;
    }
    /**
     * Gets the index of a token in the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    indexOf(word) {
        for (let i = 0; i < __classPrivateFieldGet(this, _Tokens_set, "f").length; i++) {
            if (equalFold(word, __classPrivateFieldGet(this, _Tokens_set, "f")[i])) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Adds a token to the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    add(word) {
        if (this.indexOf(word) === -1) {
            __classPrivateFieldGet(this, _Tokens_set, "f").push(word);
        }
        return this;
    }
}
