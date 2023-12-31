import { z } from "zod";

/**
 * The values for the colors must be within the range of 0-1 as the implementation is based on the color() css function.
 * See information about the color function on: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color.
 * The alpha value is optional, and is also a number within the range 0-1.
 *
 * Example:
 * 		To represent the color "rgb(255 0 0)"" it is writen as "color(srgb 1 0 0)".
 * 		To convert the individual RGB values from the range 0-255 to the range 0-1 one simply has to use the following formula:
 * 			(old value)/255 = new value
 */

const SupportedGamuts = z.enum([
	"srgb",
	"srgb-linear",
	"display-p3",
	"a98-rgb",
	"prophoto-rgb",
	"rec2020",
	"xyz",
	"xyz-d50",
	"xyz-d65",
]);

const ColorWithAlpha = z.tuple([
	SupportedGamuts, // The Color Gamut
	z.number().min(0).max(1), // Red value (Range 0-1)
	z.number().min(0).max(1), // Green value (Range 0-1)
	z.number().min(0).max(1), // Blue value (Range 0-1)
	z.number().min(0).max(1), // Optional alpha value
]);

const ColorWithoutAlpha = z.tuple([
	SupportedGamuts, // The Color Gamut
	z.number().min(0).max(1), // Red value (Range 0-1)
	z.number().min(0).max(1), // Green value (Range 0-1)
	z.number().min(0).max(1), // Blue value (Range 0-1)
]);

const ColorAttribute = z.union([ColorWithoutAlpha, ColorWithAlpha]);

export default ColorAttribute;
