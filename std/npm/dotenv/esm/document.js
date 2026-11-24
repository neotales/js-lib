/**
 * The `document` module provides functionality to represent and manipulate a document
 * for environment variables, allowing for the addition of tokens such as comments,
 * newlines, and key-value pairs. It also provides methods to convert the document
 * to an array or an object representation.
 *
 * @module
 */
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
var _DotEnvDocument_tokens;
/**
 * Represents a document for environment variables, providing methods to manipulate and iterate over tokens.
 * Implements the Iterable interface for Token objects.
 */
export class DotEnvDocument {
    /**
     * Initializes a new instance of the DotEnvDocument class.
     */
    constructor() {
        /**
         * Array to store tokens.
         */
        _DotEnvDocument_tokens.set(this, []);
        __classPrivateFieldSet(this, _DotEnvDocument_tokens, [], "f");
    }
    /**
     * Gets the number of tokens in the document.
     * @returns The number of tokens.
     */
    get length() {
        return __classPrivateFieldGet(this, _DotEnvDocument_tokens, "f").length;
    }
    /**
     * Retrieves the token at the specified index.
     * @param index - The index of the token to retrieve.
     * @returns The token at the specified index.
     */
    at(index) {
        return __classPrivateFieldGet(this, _DotEnvDocument_tokens, "f")[index];
    }
    /**
     * Adds a token to the document.
     * @param token - The token to add.
     * @returns The current instance of DotEnvDocument.
     */
    token(token) {
        __classPrivateFieldGet(this, _DotEnvDocument_tokens, "f").push(token);
        return this;
    }
    /**
     * Adds a comment token to the document.
     * @param value - The comment text.
     * @returns The current instance of DotEnvDocument.
     */
    comment(value) {
        this.token({ kind: "comment", value });
        return this;
    }
    /**
     * Adds a newline token to the document.
     * @returns The current instance of DotEnvDocument.
     */
    newline() {
        this.token({ kind: "newline" });
        return this;
    }
    /**
     * Adds an item token to the document.
     * @param key - The key of the item.
     * @param value - The value of the item.
     * @returns The current instance of DotEnvDocument.
     */
    item(key, value) {
        this.token({ kind: "item", key, value });
        return this;
    }
    /**
     * Returns an iterator for the tokens in the document.
     * @returns An iterator for the tokens.
     */
    [(_DotEnvDocument_tokens = new WeakMap(), Symbol.iterator)]() {
        return __classPrivateFieldGet(this, _DotEnvDocument_tokens, "f")[Symbol.iterator]();
    }
    /**
     * Converts the tokens to an array.
     * @returns An array of tokens.
     */
    toArray() {
        return __classPrivateFieldGet(this, _DotEnvDocument_tokens, "f").slice();
    }
    /**
     * Converts the tokens to an object where item tokens are represented as key-value pairs.
     * @returns An object representation of the item tokens.
     */
    toObject() {
        const obj = {};
        for (const token of this) {
            if (token.kind === "item") {
                const pair = token;
                obj[pair.key] = pair.value;
            }
        }
        return obj;
    }
}
