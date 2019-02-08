# Stock Cutting Problem Solver

This program will help you figure out how much wood you need to buy from the store and how to cut that wood to get all the quantities of all the sizes of wood that you need.

## How it works

I'm going to steal some numbers from pa real project of mine](https://github.com/ccorcos/couch).

Suppose you need the following pieces of wood (size in inches).

```ts
const requiredPieces = [
	{ size: 11, count: 28 },
	{ size: 21, count: 14 },
	{ size: 84, count: 8 },
	{ size: 3.5, count: 42 },
	{ size: 79.5, count: 4 },
]
```

You go to the store and find out that they sell boards that are 96 inches long. You can find out how many boards you need and how to cut them by running this through optimization progam.

```ts
const stockSize = 96
const result = howToCutBoards1D(stockSize, requiredPieces)
```

The result will look something like this:

```ts
[
	{
		count: 5,
		cuts: [11, 11, 11, 21, 21, 21] },
	{
		count: 1,
		cuts: [ 11, 11, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
	},
	{
		count: 8,
		cuts: [11, 84]
	},
	{
		count: 4,
		cuts: [11, 3.5, 79.5]
	},
	{
		count: 1,
		cuts: [ 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
	},
]
```

Now we know that we will need 19 boards and how to cut all each of them!

## Getting Started

```sh
npm install --save stock-cutting
```

```ts
import { howToCutBoards1D } from "stock-cutting"
```

## Other Notes

The [Stock Cutting Problem](https://en.wikipedia.org/wiki/Cutting_stock_problem) is an [NP-Hard](https://en.wikipedia.org/wiki/NP-hardness) problem. This means that there's no known "fast" solution to this problem. This program will work reasonably fast for most real use cases, but at the worst case, it has an exponential runtime.

## Development

```sh
npm run build
npm version major
npm publish
```

### To Do

- [x] 1d solver
- [x] saw blade size
- [ ] multiple stock sizes optimization
- [ ] 2d