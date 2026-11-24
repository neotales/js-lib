/**
 * The `document` module provides functionality to represent and manipulate a document
 * for environment variables, allowing for the addition of tokens such as comments,
 * newlines, and key-value pairs. It also provides methods to convert the document
 * to an array or an object representation.
 *
 * @module
 */
/**
 * Represents a token in a document for environment variables.
 */
export interface Token extends Record<string, string> {
    kind: "comment" | "newline" | "item";
}
/** A comment token in a dotenv document. */
export interface CommentToken extends Token {
    kind: "comment";
    value: string;
}
/** A newline token in a dotenv document. */
export interface NewlineToken extends Token {
    kind: "newline";
}
/**
 * Represents an item token in a document for environment variables.
 */
export interface ItemToken extends Token {
    kind: "item";
    key: string;
    value: string;
}
/** Any token in a dotenv document. */
export type DocumentToken = CommentToken | ItemToken | NewlineToken;
/**
 * Represents a document for environment variables, providing methods to manipulate and iterate over tokens.
 * Implements the Iterable interface for Token objects.
 */
export declare class DotEnvDocument implements Iterable<Token> {
    #private;
    /**
     * Initializes a new instance of the DotEnvDocument class.
     */
    constructor();
    /**
     * Gets the number of tokens in the document.
     * @returns The number of tokens.
     */
    get length(): number;
    /**
     * Retrieves the token at the specified index.
     * @param index - The index of the token to retrieve.
     * @returns The token at the specified index.
     */
    at(index: number): Token;
    /**
     * Adds a token to the document.
     * @param token - The token to add.
     * @returns The current instance of DotEnvDocument.
     */
    token(token: Token): this;
    /**
     * Adds a comment token to the document.
     * @param value - The comment text.
     * @returns The current instance of DotEnvDocument.
     */
    comment(value: string): this;
    /**
     * Adds a newline token to the document.
     * @returns The current instance of DotEnvDocument.
     */
    newline(): this;
    /**
     * Adds an item token to the document.
     * @param key - The key of the item.
     * @param value - The value of the item.
     * @returns The current instance of DotEnvDocument.
     */
    item(key: string, value: string): this;
    /**
     * Returns an iterator for the tokens in the document.
     * @returns An iterator for the tokens.
     */
    [Symbol.iterator](): Iterator<Token>;
    /**
     * Converts the tokens to an array.
     * @returns An array of tokens.
     */
    toArray(): Token[];
    /**
     * Converts the tokens to an object where item tokens are represented as key-value pairs.
     * @returns An object representation of the item tokens.
     */
    toObject(): Record<string, string>;
}
