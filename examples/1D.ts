import { howToCutBoards1D } from "stock-cutting"
import * as util from "util"

function print(obj: any) {
	console.log(util.inspect(obj, false, null, true))
}

// Some numbers from a real project:
// https://github.com/ccorcos/couch

const bladeSize = 0.125
const stockSizes = [{ size: 12 * 8, cost: 1 }, { size: 12 * 2, cost: 1 / 4 }]

const input1 = [
	{ size: 7, count: 21 },
	{ size: 76, count: 17 },
	{ size: 80, count: 7 },
]
const output1 = howToCutBoards1D({
	stockSizes: stockSizes,
	bladeSize: bladeSize,
	requiredCuts: input1,
})
print({ stockSizes, input1, output1 })

const input2 = [
	{ size: 11, count: 28 },
	{ size: 21, count: 14 },
	{ size: 84, count: 8 },
	{ size: 3.5, count: 42 },
	{ size: 79.5, count: 4 },
]
const output2 = howToCutBoards1D({
	stockSizes: stockSizes,
	bladeSize: bladeSize,
	requiredCuts: input2,
})
print({ stockSizes, input2, output2 })
