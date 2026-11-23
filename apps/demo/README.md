# fenster-ui demo

Every component of fenster-ui on one page: menus, commands, tree, lists, forms, dialogs, toasts,
appearance settings.

```sh
# from the repository root: npm install && npm run build -w packages/fenster-ui
npm run dev           # development server
npm run build         # dist/
npm run build:single  # one self-contained HTML file: dist-single/index.html
npm run typecheck
```

All wording lives in `src/copy.ts`; the framework ships none. `src/status.tsx` maps the app's states to tones and words.
