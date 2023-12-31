/**
 * @file
 * Code adapted from https://www.npmjs.com/package/@panzoom/panzoom/v/4.5.1
 * The original code is not very optimized for svelte. CSS values are set at runtime instead of compile time, and events are handled outside of the svelte event loop.
 * We have forked the code to integrate it correctly with svelte.
 *
 * PLEASE DO NOT MODIFY unless it is very necessary. This code is intentionally structured to follow the source code, to make future upgrades/debugging easier.
 */

export type PanzoomEvent =
	| "panzoomstart"
	| "panzoomchange"
	| "panzoompan"
	| "panzoomzoom"
	| "panzoomreset"
	| "panzoomend";

export interface PanzoomEventDetail {
	x: number;
	y: number;
	scale: number;
	originalEvent: PointerEvent | TouchEvent | MouseEvent | undefined;
}

export interface PanzoomChangeEvent extends Event {
	detail: PanzoomEventDetail;
}

export interface MiscOptions {
	/** Whether to animate transitions */
	animate: boolean;
	/**
	 * This option treats the Panzoom element's parent
	 * as a canvas. Effectively, Panzoom binds the
	 * down handler to the parent instead of the Panzoom
	 * element, so that pointer events anywhere on the "canvas"
	 * moves its children. See issue #472.
	 *
	 * **Note**: setting this option to `true` also changes
	 * where the `cursor` style is applied (i.e. the parent).
	 */
	canvas: boolean;
	/**
	 * Add elements to this array that should be excluded
	 * from Panzoom handling.
	 * Ancestors of event targets are also checked.
	 * e.g. links and buttons that should not propagate the click event.
	 */
	exclude: Element[];
	/**
	 * Add this class to any element within the Panzoom element
	 * that you want to exclude from Panzoom handling. That
	 * element's children will also be excluded.
	 * e.g. links and buttons that should not propagate the click event.
	 */
	excludeClass: string;
	/**
	 * `force` should be used sparingly to temporarily
	 * override and ignore options such as disablePan,
	 * disableZoom, and panOnlyWhenZoomed.
	 * This option cannot be passed to the
	 * Panzoom constructor or setOptions (to avoid
	 * setting this option globally).
	 *
	 * ```js
	 * // Overrides disablePan and panOnlyWhenZoomed
	 * panzoom.pan(50, 100, { force: true })
	 * // Overrides disableZoom
	 * panzoom.zoom(1, { force: true })
	 * ```
	 */
	force: boolean;
	/**
	 * On the first pointer event, when panning starts,
	 * the default Panzoom behavior is to call
	 * `event.preventDefault()` and `event.stopPropagation()`
	 * on that event. The former is almost certainly a necessity;
	 * the latter enables Panzoom elements within Panzoom elements.
	 *
	 * But there are some cases where the default is
	 * not the desired behavior. Set this option to override that behavior.
	 *
	 * ```js
	 * // Only call preventDefault()
	 * Panzoom(elem, {
	 *   handleStartEvent: (event) => {
	 *     event.preventDefault()
	 *   }
	 * })
	 * // Do nothing.
	 * // This can change dragging behavior on mobile.
	 * Panzoom(elem, {
	 *   handleStartEvent: () => {}
	 * })
	 * ```
	 */
	handleStartEvent: (event: Event) => void;
	/**
	 * Set to true to enable panning during pinch zoom.
	 * Note: this is zooming to a point and panning in the same
	 * frame. In other words, the zoom has not yet painted and
	 * therefore the pan is working with old dimensions.
	 * Essentially, it may be best to avoid using this option
	 * when using contain.
	 *
	 * Related issues:
	 * https://github.com/timmywil/panzoom/issues/512
	 * https://github.com/timmywil/panzoom/issues/606
	 */
	pinchAndPan: boolean;
	/** Silence all events */
	silent: boolean;
	/** X Value used to set the beginning transform */
	startX: number;
	/** Y Value used to set the beginning transform */
	startY: number;
	/** Scale used to set the beginning transform */
	startScale: number;
}

export interface PanOnlyOptions {
	/**
	 * Contain the panzoom element either
	 * inside or outside the parent.
	 * Inside: The panzoom element is smaller
	 *   than its parent and cannot be panned
	 *   to the outside.
	 * Outside: The panzoom element is larger
	 *   than its parent and cannot be panned
	 *   to the inside. In other words, no
	 *   empty space around the element will be shown.
	 *
	 * **Note**: the containment pan adjustment is not affected by the `disablePan` option.
	 */
	contain?: "inside" | "outside";
	/**
	 * Disable panning functionality.
	 * Note: disablePan does not affect focal point zooming or the contain option.
	 *   The element will still pan accordingly.
	 */
	disablePan: boolean;
	/** Pan only on the Y axis */
	disableXAxis: boolean;
	/** Pan only on the X axis */
	disableYAxis: boolean;
	/** When passing x and y values to .pan(), treat the values as relative to their current values */
	relative: boolean;
	/** Disable panning while the scale is equal to the starting value */
	panOnlyWhenZoomed: boolean;
	/**
	 * Round x and y values to whole numbers.
	 * This can help prevent images and text from looking blurry,
	 * but the higher the scale, the more it becomes
	 * necessary to use fractional pixels.
	 * Use your own judgment on how much to limit
	 * zooming in when using this option.
	 */
	roundPixels: boolean;
}

export interface ZoomOnlyOptions {
	/** Disable zooming functionality */
	disableZoom: boolean;
	/**
	 * Zoom to the given point on the panzoom element.
	 * This point is expected to be relative to
	 * the panzoom element's dimensions and is unrelated
	 * to the parent dimensions.
	 */
	focal?: { x: number; y: number };
	/** The minimum scale when zooming */
	minScale: number;
	/** The maximum scale when zooming */
	maxScale: number;
	/** The step affects zoom calculation when zooming with a mouse wheel, when pinch zooming, or when using zoomIn/zoomOut */
	step: number;
}

export type PanOptions = MiscOptions & PanOnlyOptions;
export type ZoomOptions = MiscOptions & ZoomOnlyOptions;
export type PanzoomOptions = PanOptions & ZoomOptions & MiscOptions;

export interface CurrentValues {
	x: number;
	y: number;
	scale: number;
}

export interface PanzoomObject {
	/** Get the current x/y translation */
	getPan: () => { x: number; y: number };
	/** Get the current scale */
	getScale: () => number;
	/** Returns a _copy_ of the current options object */
	getOptions: () => PanzoomOptions;
	/**
	 * handleDown, handleMove, and handleUp
	 * are the exact event handlers that Panzoom
	 * binds to pointer events. They are exposed
	 * in case you prefer to bind your own events
	 * or extend them.
	 * Note that move and up are bound to the document,
	 * not the Panzoom element. Only the down event
	 * is bound to the Panzoom element.
	 * To avoid double-binding, also set noBind to true.
	 *
	 * ```js
	 * const panzoom = Panzoom(elem, { noBind: true })
	 * elem.addEventListener('pointerdown', (event) => {
	 *   console.log(event)
	 *   panzoom.handleDown(event)
	 * })
	 * document.addEventListener('pointermove', panzoom.handleMove)
	 * document.addEventListener('pointerup', panzoom.handleUp)
	 * ```
	 */
	handleDown: (event: PointerEvent) => void;
	handleMove: (event: PointerEvent) => void;
	handleUp: (event: PointerEvent) => void;
	/**
	 * Pan the Panzoom element to the given x and y coordinates
	 *
	 * ```js
	 * // Translates the element to 50px, 100px
	 * panzoom.pan(50, 100)
	 * // Pans the element right 10px and down 10px from its current position
	 * panzoom.pan(10, 10, { relative: true })
	 * ```
	 */
	pan: (
		x: number | string,
		y: number | string,
		panOptions?: Partial<PanOptions>,
	) => CurrentValues;
	/**
	 * Reset the pan and zoom to startX, startY, and startScale.
	 * Animates by default, ignoring the global option.
	 * Pass `{ animate: false }` to override.
	 * Reset ignores the `disablePan`, `disableZoom`, and `panOnlyWhenZoomed` options.
	 * Pass `{ force: false }` to override.
	 *
	 * ```js
	 * panzoom.reset()
	 * panzoom.reset({ animate: false })
	 * ```
	 */
	reset: (resetOptions?: Partial<PanzoomOptions>) => CurrentValues;
	/**
	 * Change any number of options on a Panzoom instance.
	 * Setting some options will have side-effects.
	 */
	setOptions: (options?: Partial<PanzoomOptions>) => void;
	/**
	 * Zoom the Panzoom element to the given scale
	 *
	 * ```js
	 * panzoom.zoom(2.2)
	 * panzoom.zoom(2.2, { animate: true })
	 * ```
	 */
	zoom: (
		scale: number,
		zoomOptions?: Partial<ZoomOptions>,
		originalEvent?: PanzoomEventDetail["originalEvent"],
	) => CurrentValues | undefined;
	/**
	 * Zoom in using the predetermined increment set in options.
	 * Animates by default, ignoring the global option.
	 * Pass `{ animate: false }` to override.
	 *
	 * ```js
	 * panzoom.zoomIn()
	 * panzoom.zoomIn({ animate: false })
	 * ```
	 */
	zoomIn: (zoomOptions?: Partial<ZoomOptions>) => CurrentValues | undefined;
	/**
	 * Zoom out using the predetermined increment set in options.
	 * Animates by default, ignoring the global option.
	 * Pass `{ animate: false }` to override.
	 *
	 * ```js
	 * panzoom.zoomOut()
	 * panzoom.zoomOut({ animate: false })
	 * ```
	 */
	zoomOut: (zoomOptions?: Partial<ZoomOptions>) => CurrentValues | undefined;
	/**
	 * Zoom the Panzoom element to a focal point using
	 * the given pointer/touch/mouse event or constructed point.
	 * The clientX/clientY values should be calculated
	 * the same way as a `pointermove` event on the Panzoom element's parent.
	 *
	 * ```js
	 * panzoom.zoomToPoint(1.2, pointerEvent)
	 * ```
	 */
	zoomToPoint: (
		scale: number,
		point: { clientX: number; clientY: number },
		zoomOptions?: Partial<ZoomOptions>,
	) => CurrentValues | undefined;
	/**
	 * Zoom the Panzoom element to a focal point using the given WheelEvent
	 *
	 * This is a convenience function that may not handle all use cases.
	 * Other cases should handroll solutions using the `zoomToPoint`
	 * method or the `zoom` method's focal option.
	 *
	 * **Notes**:
	 *
	 * - the focal point zooming pan adjustment is
	 *   not affected by the `disablePan` option.
	 * - animate should not be used when zooming with the wheel,
	 *   and is therefore always disabled.
	 *
	 * ```js
	 * // Bind to mousewheel
	 * elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
	 * // Bind to shift+mousewheel
	 * elem.parentElement.addEventListener('wheel', function(event) {
	 *   if (!event.shiftKey) return
	 *   // Panzoom will automatically use `deltaX` here instead
	 *   // of `deltaY`. On a mac, the shift modifier usually
	 *   // translates to horizontal scrolling, but Panzoom assumes
	 *   // the desired behavior is zooming.
	 *   panzoom.zoomWithWheel(event)
	 * })
	 * ```
	 */
	zoomWithWheel: (
		event: WheelEvent,
		zoomOptions?: Partial<ZoomOptions>,
	) => CurrentValues | undefined;
}
