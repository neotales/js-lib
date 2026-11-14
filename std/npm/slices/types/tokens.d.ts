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
export declare class Tokens implements Iterable<Uint32Array> {
    #private;
    /**
     * Creates a new instance of the `Tokens` class.
     */
    constructor();
    /**
     * Gets the tokens in the collection.
     * @returns An iterator that iterates over the tokens in the collection.
     */
    [Symbol.iterator](): Iterator<Uint32Array>;
    /**
     * Gets the number of tokens in the collection.
     */
    get length(): number;
    /**
     * Adds a token to the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    addString(word: string): this;
    /**
     * Gets the index of a token in the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    indexOf(word: Uint32Array): number;
    /**
     * Adds a token to the collection.
     * @param word The word to add to the collection.
     * @returns The updated `Tokens` instance.
     */
    add(word: Uint32Array): this;
}
