/**
 * This function adds pluralization support to every String object.
 * @param str The subject string.
 * @param plural Overrides normal output with said String.(optional)
 * @returns Singular English language nouns are returned in plural form.
 * @example
 *
 *     const inflection = require( 'inflection' );
 *
 *     inflection.pluralize( 'person' ); // === 'people'
 *     inflection.pluralize( 'octopus' ); // === 'octopuses'
 *     inflection.pluralize( 'Hat' ); // === 'Hats'
 *     inflection.pluralize( 'person', 'guys' ); // === 'guys'
 */
export declare function pluralize(str: string, plural?: string): string;
/**
 * This function adds singularization support to every String object.
 * @param str The subject string.
 * @param singular Overrides normal output with said String.(optional)
 * @returns Plural English language nouns are returned in singular form.
 * @example
 *
 *     const inflection = require( 'inflection' );
 *
 *     inflection.singularize( 'people' ); // === 'person'
 *     inflection.singularize( 'octopuses' ); // === 'octopus'
 *     inflection.singularize( 'Hats' ); // === 'Hat'
 *     inflection.singularize( 'guys', 'person' ); // === 'person'
 */
export declare function singularize(str: string, singular?: string): string;
/**
 * Converts a word to singular or plural form based on a count.
 * @param str The word to inflect.
 * @param count The count used to choose singular (`1`) or plural (all other numbers).
 * @param singular Optional singular override.
 * @param plural Optional plural override.
 * @returns The inflected word.
 * @example
 * ```typescript
 * import { inflect } from "@neotales/strings";
 *
 * inflect("people", 1); // "person"
 * inflect("person", 2); // "people"
 * ```
 */
export declare function inflect(str: string, count: number, singular?: string, plural?: string): string;
