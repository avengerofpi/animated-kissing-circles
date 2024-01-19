# Moving Kissing Circles

The goal of this project is create a small web application that will render
a `<canvas>` element with bunch of **kissing circles**
that shift around while always staying kissing circles. Kissing circles are circles
that are tangential to each other. See, for example,
[Descartes' Theorem](https://en.wikipedia.org/wiki/Descartes%27_theorem).

## Design Brainstorming

My initial thought for implementation is
* Generate random set of points that will be the centers of the circles
* Determine radiuses for circles to make them kissing circles. This method should
    * Be a deterministic method. The same set of input points should always
generate the same set of kissing circles with those input points as centers.
    * Be "smooth" under small peterbations of the input center points. This way we
can smoothly move the center points to new locations and have the circles look
like they are moving  smoothly as well.
* Determine new points to move the center points to.
* Animate the transition.
    * Move the center points steadily/smoothly from starting position to their
new positions, and regenerate the kissing circles for each step along the way.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
