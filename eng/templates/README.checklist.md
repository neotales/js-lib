# Module README checklist

Copy [README.md](./README.md) to `<area>/jsr/<module>/README.md`. Fill it before the module is called done. `bun run transpile` copies that file onto the npm package. Do not edit the npm copy by hand.

## Page

- [ ] Title is `@neotales/<module>`.
- [ ] Overview is short and says what the module does not do.
- [ ] Logo is present. A diagram, gif, or picture is committed beside the README when one is used.
- [ ] JSR and npm badges use this module's name.
- [ ] No runtime badge. The table is the record. There is no badge for these runtimes.
- [ ] Usage imports `@neotales/<module>` and shows one real call.
- [ ] Exports are a table, one line each.
- [ ] License links to `./LICENSE.md`.

## Runtime table

- [ ] The runtime support table is under Installation; every runtime row remains, marks are support decisions, generation details are accurate, and npm keywords are the module name plus plain names of ✅ rows.

## After the edit

- [ ] `bun run transpile` still copies this README. The npm package README matches.
- [ ] The satellite `README.md` does not repeat this table. It points here.
