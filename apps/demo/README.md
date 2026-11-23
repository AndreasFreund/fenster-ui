# fenster-ui demo

Every component of fenster-ui as a small documentation app: a list of pages on the left, and on each page live
examples with the code that produces them. The window itself is built from the framework's frame, bars and panes.

```sh
# from the repository root: npm install && npm run build -w packages/fenster-ui
npm run dev           # development server
npm run build         # dist/
npm run build:single  # one self-contained HTML file: dist-single/index.html
npm run typecheck
```

`?shot=light` and `?shot=dark` show the Example app page's file browser in a whole window with the name over it. The
pictures in the READMEs (`.github/readme-light.png`, `readme-dark.png`) are that page in a 1000 by 400 window at
twice the pixel density.

`src/pages/index.tsx` lists the pages; each page is a component in `src/pages/`. `#list` in the address opens a page
directly. The wording the framework needs is in `src/copy.ts`; the framework ships none. `src/status.tsx` maps the
app's states to tones and words.
