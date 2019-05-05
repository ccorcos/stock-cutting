import * as _ from "lodash"
import * as solver from "javascript-lp-solver/src/solver"
import * as util from "util"

export type StockSize1D = { size: number; cost: number }

export type RequiredCuts1D = Array<{ size: number; count: number }>

export type ResultCuts1D = Array<{
	stock: StockSize1D
	count: number
	decimal: number
	cuts: Array<number>
}>

function isSubset(a: Array<number>, b: Array<number>) {
	const a2 = [...a]
	for (const n of b) {
		const i = a2.indexOf(n)
		if (i !== -1) {
			a2.splice(i, 1)
			if (a2.length === 0) {
				return true
			}
		}
	}
	return a2.length === 0
}

/**
 * Given a board of `size` and a list of `cuts` you
 * can make out of the board, how many unique ways of cutting the board
 * are there?
 */
export function howManyWays1D(
	args: {
		size: number
		bladeSize: number
		cuts: Array<number>
	},
	state: Array<number> = []
): Array<Array<number>> {
	const { size, bladeSize, cuts } = args
	const waysToCut = _.flatten(
		cuts.map(cut => {
			const remainder = size - cut
			if (remainder >= 0) {
				return howManyWays1D(
					{
						// Subtract bladeSize after because we might have a
						// perfect fit with the remainder.
						size: remainder - bladeSize,
						bladeSize: bladeSize,
						cuts: cuts,
					},
					[...state, cut]
				)
			} else {
				return [state]
			}
		})
	)

	let results: Array<Array<number>> = []
	for (const wayToCut of waysToCut) {
		// If existing cuts that are a subset of the new way to cut.
		results = results.filter(
			existingWayToCut => !isSubset(existingWayToCut, wayToCut)
		)
		// Add new way to cut if it is not a subset of an existing cut.
		const isSubsetOfExistingCut = results.some(existingWayToCut =>
			isSubset(wayToCut, existingWayToCut)
		)
		if (!isSubsetOfExistingCut) {
			results.push(wayToCut)
		}
	}
	return results
}

/**
 * Given a stock side of wood you and buy, how many do I need and how do I cut it
 * in order to make enough pieces of with at the given sizes.
 */
export function howToCutBoards1D(args: {
	stockSizes: Array<StockSize1D>
	bladeSize: number // AKA Kerf.
	requiredCuts: RequiredCuts1D
}): ResultCuts1D {
	const { stockSizes, bladeSize, requiredCuts } = args
	const cutSizes = requiredCuts.map(({ size }) => size)

	const waysOfCuttingStocks = stockSizes.map(({ size, cost }) => {
		const waysOfCutting = howManyWays1D({
			size: size,
			cuts: cutSizes,
			bladeSize: bladeSize,
		})

		// Transform [1,1,2,3] into {cut1: 2, cut2: 1, cut3: 3}.
		// Each will be the different versions of cutting the stock board.
		const versions = waysOfCutting.map(way => {
			const stockCut = {}
			for (const cut of cutSizes) {
				stockCut["cut" + cut] = 0
			}
			for (const cut of way) {
				stockCut["cut" + cut] = stockCut["cut" + cut] + 1
			}
			// stockCut["remainder"] = stockSize - _.sum(way)
			return stockCut
		})

		return { size, cost, versions, waysOfCutting }
	})

	// console.log(util.inspect(waysOfCuttingStocks, false, null))

	// Create a variable for each version with a count: 1 which we will minimize.
	const variables = _.flatten(
		waysOfCuttingStocks.map(({ size, cost, versions }) =>
			versions.map((cut, index) => ({
				[size + "version" + index]: { ...cut, cost: cost },
			}))
		)
	).reduce((acc, next) => ({ ...acc, ...next }))

	// We can't puchase part of a board, so the result but me an int, not a float.
	const ints = _.flatten(
		waysOfCuttingStocks.map(({ size, versions }) =>
			versions.map((cut, index) => ({
				[size + "version" + index]: 1,
			}))
		)
	).reduce((acc, next) => ({ ...acc, ...next }))

	// Create constraints from the required cuts with a min on the count required.
	const constraints = requiredCuts
		.map(({ size, count }) => ({ ["cut" + size]: { min: count } }))
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

	// console.log(model)
	// console.log(results)

	if (!results.feasible) {
		throw new Error("Didn't work")
	}

	const resultCuts: ResultCuts1D = []

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
					cuts: waysOfCutting[i],
				})
			}
		}
	}

	return resultCuts
}
