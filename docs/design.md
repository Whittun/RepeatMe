English | [Русский](design.ru.md)

# Visual direction

RepeatMe uses a pixel-art interface with orange accents, a dark violet navigation panel, warm paper surfaces, square state indicators, and buttons with hard shadows and a pressed state. The reference direction is retro console menus and inventory screens.

## References

- [NES.css](https://nostalgic-css.github.io/NES.css/): pixel borders and tactile buttons.
- [SNES.css](https://snes-css.sadlative.com/): console-inspired typography, panels, and restrained palettes.

These are visual references. The application uses its own CSS Modules rather than importing either framework.

## Assets and typography

- [Russo One](https://github.com/google/fonts/tree/main/ofl/russoone) provides detailed, angular game-style headings and numbers, including Cyrillic. It is bundled locally in `apps/web/src/assets/fonts`; its SIL Open Font License is included as `OFL-RussoOne.txt`. Small labels use a system monospace font to keep the retro feel without coarse pixel lettering.
- Body text, review criteria, and Markdown use a system sans-serif font for readability. Code uses a monospace font.
- `PixelIcons.tsx`, `PixelScene.tsx`, and `public/favicon.svg` contain original SVG artwork on a consistent pixel grid.

Game styling does not add levels, XP, invented progress, or new scheduling rules. Statistics still reflect backend data. State colors retain text labels and accessible descriptions. Reduced-motion preferences disable transitions.
