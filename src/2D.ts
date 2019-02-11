import * as _ from "lodash"
import * as solver from "javascript-lp-solver/src/solver"

function memoize<I extends any[], O, K>(
	fn: (...args: I) => O,
	makeKey: (...args: I) => K
) {
	const cache: Map<K, O> = new Map()
	return (...args: I): O => {
		const key = makeKey(...args)
		if (cache.has(key)) {
			return cache.get(key)
		} else {
			const result = fn(...args)
			cache.set(key, result)
			return result
		}
	}
}

export type StockSize2D = { size: [number, number]; cost: number }

export type RequiredCuts2D = Array<{
	size: [number, number]
	count: number
}>

export type ResultCuts2D = Array<{
	stock: StockSize2D
	count: number
	decimal: number
	cuts: Array<[number, number]>
	tree: CutTree2D
}>

export type CutTreeLeaf2D = {
	size: [number, number]
	pieces?: undefined
}

export type CutTreeNode2D = {
	size: [number, number]
	pieces: [
		// topLeft
		CutTreeNode2D,
		// bottomLeft
		CutTreeNode2D,
		// topRight
		CutTreeNode2D,
		// bottomRight
		CutTreeNode2D
	]
}

export type CutTree2D = CutTreeLeaf2D | CutTreeNode2D

export function boundsCheck({ size }: CutTreeLeaf2D): CutTreeLeaf2D {
	if (size[0] <= 0 || size[1] <= 0) {
		return { size: [0, 0] }
	} else {
		return { size }
	}
}

export const cut2D = memoize(
	(
		bigger: [number, number],
		smaller: [number, number],
		bladeSize: number
	): CutTree2D => {
		if (isEqual2D(bigger, smaller)) {
			return { size: smaller }
		} else if (bigger[0] >= smaller[0] && bigger[1] >= smaller[1]) {
			return {
				size: bigger,
				pieces: [
					// topLeft
					boundsCheck({ size: smaller }) as CutTreeNode2D,
					// bottomLeft
					boundsCheck({
						size: [smaller[0], bigger[1] - smaller[1] - bladeSize],
					}) as CutTreeNode2D,
					// topRight
					boundsCheck({
						size: [bigger[0] - smaller[0] - bladeSize, smaller[1]],
					}) as CutTreeNode2D,
					// bottomRight
					boundsCheck({
						size: [
							bigger[0] - smaller[0] - bladeSize,
							bigger[1] - smaller[1] - bladeSize,
						],
					}) as CutTreeNode2D,
				],
			}
		} else if (bigger[1] >= smaller[0] && bigger[0] >= smaller[1]) {
			// Rotate the smaller board and cut it that way.
			const smallerT = [smaller[1], smaller[0]] as [number, number]
			return {
				size: bigger,
				pieces: [
					// topLeft
					boundsCheck({ size: smallerT }) as CutTreeNode2D,
					// bottomLeft
					boundsCheck({
						size: [smallerT[0], bigger[1] - smallerT[1] - bladeSize],
					}) as CutTreeNode2D,
					// topRight
					boundsCheck({
						size: [bigger[0] - smallerT[0] - bladeSize, smallerT[1]],
					}) as CutTreeNode2D,
					// bottomRight
					boundsCheck({
						size: [
							bigger[0] - smallerT[0] - bladeSize,
							bigger[1] - smallerT[1] - bladeSize,
						],
					}) as CutTreeNode2D,
				],
			}
		} else {
			return { size: bigger }
		}
	},
	(bigger, smaller) => [bigger.sort(), smaller.sort()].toString()
)

export function permute<T>(values: Array<Array<T>>): Array<Array<T>> {
	if (values.length === 1) {
		return values[0].map(item => [item])
	} else {
		const [first, ...rest] = values
		return _.flatten(
			first.map(item => permute(rest).map(others => [item, ...others]))
		)
	}
}

export const getLeaves = memoize(
	(tree: CutTree2D): Array<[number, number]> => {
		if (!tree.pieces) {
			return [tree.size]
		}
		return _.flatten(tree.pieces.map(getLeaves))
	},
	tree => tree
)

const getLeafCuts = memoize(
	(tree: CutTree2D, cuts: Array<[number, number]>) => {
		return getLeaves(tree).filter(n => cuts.some(m => isEqual2D(n, m)))
	},
	// WARNING: dropping cuts because it will always be the same.
	tree => tree
)

export const isEqual2D = (
	[x, y]: [number, number],
	[n, m]: [number, number]
) => {
	return (x === n && m === y) || (x === m && n === y)
}

// HERE: this is where all the time is spent. Doing the uniq thing.
function isSubset2D(a: Array<[number, number]>, b: Array<[number, number]>) {
	if (a.length > b.length) {
		return false
	}
	const bMap = {}
	for (const elm of b) {
		if (!(elm[0] in bMap)) {
			bMap[elm[0]] = {}
		}
		if (elm[1] in bMap[elm[0]]) {
			bMap[elm[0]][elm[1]] = bMap[elm[0]][elm[1]] + 1
		} else {
			bMap[elm[0]][elm[1]] = 1
		}
	}

	for (const [x, y] of a) {
		if (!bMap[x]) {
			return false
		}
		if (!bMap[x][y]) {
			return false
		}
		bMap[x][y] = bMap[x][y] - 1
		if (bMap[x][y] < 0) {
			return false
		}
	}
	return true

	// const a2 = [...a]
	// for (const n of b) {
	// 	const i = a2.findIndex(m => isEqual2D(n, m))
	// 	if (i !== -1) {
	// 		a2.splice(i, 1)
	// 		if (a2.length === 0) {
	// 			return true
	// 		}
	// 	}
	// }
	// return a2.length === 0
}

export const howManyWays2D = memoize(
	(args: {
		size: [number, number]
		bladeSize: number
		cuts: Array<[number, number]>
	}): Array<CutTree2D> => {
		const { size, bladeSize, cuts } = args
		const cutTrees = _.flatten(
			cuts.map(piece => {
				// TODO: we need to prune some results that we are pretty sure
				// are going to be bad. We want efficient cuts.
				// Maybe start with the large pieces first?
				// We should be able to solve this more realistically by using the big
				// pieces and moving on to the smaller ones when we need to.
				const tree = cut2D(size, piece, bladeSize)
				if (!tree.pieces) {
					return [tree]
				}

				// How many ways to cut each child.
				const childCuts = tree.pieces.map(child => {
					const childCuts = howManyWays2D({
						size: child.size,
						bladeSize: bladeSize,
						cuts: cuts,
					})
					return childCuts
				})

				// Permute through all was of cutting the children.
				const cutOptions = permute(childCuts).map(
					pieces =>
						({
							size: tree.size,
							pieces: pieces,
						} as CutTree2D)
				)
				return cutOptions
			})
		)

		return _.uniqWith(
			cutTrees,
			(x, y) =>
				isSubset2D(getLeaves(x), getLeaves(y)) ||
				isSubset2D(getLeaves(y), getLeaves(x))
		)
	},
	({ size }) => size.sort().toString()
)

export function howToCutBoards2D(args: {
	stockSizes: Array<StockSize2D>
	bladeSize: number // AKA Kerf.
	requiredCuts: RequiredCuts2D
}): ResultCuts2D {
	const { stockSizes, bladeSize, requiredCuts } = args
	const cutSizes = requiredCuts.map(({ size }) => size)

	const waysOfCuttingStocks = stockSizes.map(({ size, cost }) => {
		const waysOfCutting = howManyWays2D({
			size: size,
			cuts: cutSizes,
			bladeSize: bladeSize,
		})

		// Transform [[1,1], [1,2], [2,2]] into {cut1-1: 2, cut1-2: 1, cut2-2: 3}.
		// Each will be the different versions of cutting the stock board.
		const versions = waysOfCutting.map(tree => {
			const stockCut = {}
			for (const cut of cutSizes) {
				stockCut["cut" + cut.sort().join("-")] = 0
			}
			const way = getLeafCuts(tree, cutSizes)
			for (const cut of way) {
				stockCut["cut" + cut.sort().join("-")] =
					stockCut["cut" + cut.sort().join("-")] + 1
			}
			return stockCut
		})

		return { size, cost, versions, waysOfCutting }
	})

	// Create a variable for each version with a count: 1 which we will minimize.
	const variables = _.flatten(
		waysOfCuttingStocks.map(({ size, cost, versions }) =>
			versions.map((cut, index) => ({
				[size.sort().join("-") + "version" + index]: { ...cut, cost: cost },
			}))
		)
	).reduce((acc, next) => ({ ...acc, ...next }))

	// We can't puchase part of a board, so the result but me an int, not a float.
	const ints = _.flatten(
		waysOfCuttingStocks.map(({ size, versions }) =>
			versions.map((cut, index) => ({
				[size.sort().join("-") + "version" + index]: 1,
			}))
		)
	).reduce((acc, next) => ({ ...acc, ...next }))

	// Create constraints from the required cuts with a min on the count required.
	const constraints = requiredCuts
		.map(({ size, count }) => ({
			["cut" + size.sort().join("-")]: { min: count },
		}))
		.reduce((acc, next) => ({ ...acc, ...next }))

	// Create out model for the simplex linear programming solver.
	// https://github.com/JWally/jsLPSolver
	const model = {
		optimize: "cost",
		opType: "min",
		variables: variables,
		int: ints,
		constraints: constraints,
	}

	// Run the program
	const results = solver.Solve(model)

	if (!results.feasible) {
		throw new Error("Didn't work")
	}

	const resultCuts: ResultCuts2D = []

	for (const { size, cost, waysOfCutting } of waysOfCuttingStocks) {
		for (let i = 0; i < waysOfCutting.length; i++) {
			const number = results[size + "version" + i]
			if (number !== undefined && number > 0) {
				// Need to take the ceiling because even though we're using integer mode,
				// the final cuts will still have a remainder balance which computes to
				// the remainder decimal. We'll store the raw decimal in there in case you
				// want to use it somewhere else.
				// https://github.com/JWally/jsLPSolver/issues/84
				resultCuts.push({
					stock: { size, cost },
					count: Math.ceil(number),
					decimal: number,
					cuts: getLeafCuts(waysOfCutting[i], cutSizes),
					tree: waysOfCutting[i],
				})
			}
		}
	}

	return resultCuts
}
