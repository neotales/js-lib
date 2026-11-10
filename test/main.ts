import "../std/jsr/chars/equal_fold.test.ts";
import "../std/jsr/chars/is_ascii.test.ts";
import "../std/jsr/chars/is_char.test.ts";
import "../std/jsr/chars/is_control.test.ts";
import "../std/jsr/chars/is_digit.test.ts";
import "../std/jsr/chars/is_latin1.test.ts";
import "../std/jsr/chars/is_letter.test.ts";
import "../std/jsr/chars/is_letter_or_digit.test.ts";
import "../std/jsr/chars/is_lower.test.ts";
import "../std/jsr/chars/is_punc.test.ts";
import "../std/jsr/chars/is_space.test.ts";
import "../std/jsr/chars/is_symbol.test.ts";
import "../std/jsr/chars/is_upper.test.ts";
import "../std/jsr/chars/simple_fold.test.ts";
import "../std/jsr/chars/to_lower.test.ts";
import "../std/jsr/chars/to_upper.test.ts";
import { run } from "./run.ts";

const result = run();
if (result.failed > 0) {
  throw new Error(`${result.failed} failed`);
}
