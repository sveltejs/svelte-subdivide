<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let pane;

	import * as constants from './constants.js';

	const THRESHOLD = 100;

	function wasCmdOrCtrlPressed(event) {
		return constants.IS_MAC ? event.metaKey : event.ctrlKey;
	}

	export let _keyPressed;
	export let edge = null;
	export let pane;
	export let component;

	export let cursor;
	$: {
		if (!_keyPressed || !edge) cursor = 'default';

		cursor = (
			edge === constants.NORTH ? 's-resize' :
			edge === constants.SOUTH ? 'n-resize' :
			edge === constants.WEST ? 'e-resize' :
			edge === constants.EAST ? 'w-resize' :
			'default'
		);
	}

	function findEdge(event) {
		const { top, right, bottom, left } = pane.getBoundingClientRect();

		const d = [
			[constants.NORTH, event.clientY - top],
			[constants.SOUTH, bottom - event.clientY],
			[constants.EAST, right - event.clientX],
			[constants.WEST, event.clientX -left]
		];

		if (d[0][1] > THRESHOLD && d[1][1] > THRESHOLD && d[2][1] > THRESHOLD && d[3][1] > THRESHOLD) return null;

		d.sort((a, b) => a[1] - b[1]);

		return d[0][0];
	}

	function handleMousedown(event) {
		if (!wasCmdOrCtrlPressed(event)) return;

		const edge = findEdge(event);
		if (!edge) return;

		dispatch('split', {
			edge,
			clientX: event.clientX,
			clientY: event.clientY
		});
	}

	function handleMousemove(event) {
		edge = findEdge(event);
	}
</script>

<div
	bind:this={pane}
	class="pane"
	style="
		left: {pane.getLeft() * 100}%;
		top: {pane.getTop() * 100}%;
		width: {pane.getWidth() * 100}%;
		height: {pane.getHeight() * 100}%;
		cursor: {cursor}
	"
	on:mousedown="{handleMousedown}"
	on:mousemove="{handleMousemove}"
>
	<div class="inner">
		<svelte:component this={component} {pane}/>
	</div>
</div>

<style>
	.pane {
		position: absolute;
		overflow: hidden;
		box-sizing: border-box;
		padding: calc(var(--thickness) / 2);
	}

	.inner {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>