import { toCharArray } from "./utils.ts";
import { equalFold } from "./equal.ts";

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
export class Tokens implements Iterable<Uint32Array> {
  #set: Array<Uint32Array>;

  /**
   * Creates a new instance of the `Tokens` class.
   */
  constructor() {
    this.#set = new Array<Uint32Array>();
  }

  /**
   * Gets the tokens in the collection.
   * @returns An iterator that iterates over the tokens in the collection.
   */
  [Symbol.iterator](): Iterator<Uint32Array> {
    return this.#set[Symbol.iterator]();
  }

  /**
   * Gets the number of tokens in the collection.
   */
  get length(): number {
    return this.#set.length;
  }

  /**
   * Adds a token to the collection.
   * @param word The word to add to the collection.
   * @returns The updated `Tokens` instance.
   */
  addString(word: string): this {
    this.add(toCharArray(word));
    return this;
  }

  /**
   * Gets the index of a token in the collection.
   * @param word The word to add to the collection.
   * @returns The updated `Tokens` instance.
   */
  indexOf(word: Uint32Array): number {
    for (let i = 0; i < this.#set.length; i++) {
      if (equalFold(word, this.#set[i])) {
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
  add(word: Uint32Array): this {
    if (this.indexOf(word) === -1) {
      this.#set.push(word);
    }

    return this;
  }
}
