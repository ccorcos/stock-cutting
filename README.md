# Stock Cutting Problem Solver

This program will help you figure out how much wood you need to buy from the store and how to cut that wood to get all the quantities of all the sizes of wood that you need.

## Getting Started

```sh
npm install --save stock-cutting
```

```ts
import { howToCutBoards1D } from "stock-cutting"
```

See [examples](/examples).

## Other Notes

The [Stock Cutting Problem](https://en.wikipedia.org/wiki/Cutting_stock_problem) is an [NP-Hard](https://en.wikipedia.org/wiki/NP-hardness) problem. This means that there's no known "fast" solution to this problem. This program will work reasonably fast for most real use cases, but at the worst case, it has an exponential runtime.

## Development

```sh
npm run build
npm version major
npm publish
```
