<script>
	import { beforeUpdate, createEventDispatcher } from 'svelte';

	import Pane from './Pane.svelte';
	import Divider from './Divider.svelte';
	// [svelte-upgrade suggestion]
	// manually refactor all references to __this
	const __this = {};


	import { PaneData, GroupData, DividerData } from './elements.js';
	import { removeFromArray, clamp, getId } from './utils.js';
	import * as constants from './constants.js';

	const defaultLayout = {
		root: {
			type: 'group',
			row: false,
			pos: 0,
			size: 1,
			prev: null,
			next: null,
			children: [
				{
					type: 'pane',
					id: getId(),
					pos: 0,
					size: 1,
					prev: null,
					next: null
				}
			]
		}
	};

	export let container;
	export let component;
	export let layout = defaultLayout;
	export let thickness = '1px';
	export let padding = '6px';
	export let color = 'white';

	let _root;
	let _panes = [];
	let _keyPressed = false;
	let _dividers = [];
	let _dragging = null;
	let _closing;
	let _did = 0;
	let _ids = new Set();

	let _userSelect;
	let _updating;
	let _layoutChanged = true;

	const dispatch = createEventDispatcher();

	// [svelte-upgrade warning]
	// beforeUpdate and afterUpdate handlers behave
	// differently to their v2 counterparts
	beforeUpdate(() => {
		if (_updating) return;

		if (_layoutChanged) {
			_layoutChanged = false;

			const panes = [];
			const dividers = [];

			const createGroup = data => {
				const group = new GroupData(data.row, {
					pos: data.pos,
					size: data.size,
					prev: null,
					next: null
				});

				let lastChild = null;

				data.children.sort((a, b) => a.pos - b.pos).forEach((data, i) => {
					let child;

					if (data.type === 'group') {
						child = createGroup(data);
					} else {
						child = new PaneData(data.id, {
							pos: data.pos,
							size: data.size,
							prev: null,
							next: null
						});

						_ids.add(data.id);
						panes.push(child);
					}

					group.addChild(child);

					if (i > 0) {
						child.prev = lastChild;
						lastChild.next = child;

						const dividerType = group.row ? 'vertical' : 'horizontal';

						const divider = new DividerData({
							id: _did++,
							type: dividerType,
							group,
							position: child.pos,
							prev: lastChild,
							next: child
						});

						dividers.push(divider);
					}

					lastChild = child;
				});

				return group;
			};

			const root = createGroup(layout ? layout.root : defaultLayout.root);

			_did = _did, _ids = _ids, _root = root, _panes = panes, _dividers = dividers;
		}
	});

	function _getId() {
		while (true) {
			const id = getId();
			if (!_ids.has(id)) {
				_ids.add(id);
				return id;
			}
		}
	}

	function _updateLayout() {
		_updating = true;

		_layoutChanged = true;
		layout = {
			root: _root.toJSOb()
		};
		dispatch('layout', { layout });

		_updating = false;
	}

	function _split(pane, event) {
		const { left, right, top, bottom } = container.getBoundingClientRect();
		const { edge, clientX, clientY } = event;

		const dividerType = edge === constants.NORTH || edge === constants.SOUTH
			? 'horizontal'
			: 'vertical';

		const childGroupIsRow = dividerType === 'vertical';

		let group = pane.parent;

		const newGroup = group && group.row === childGroupIsRow
			? null
			: new GroupData(childGroupIsRow, pane);

		if (newGroup) {
			pane.pos = 0;
			pane.size = 1;

			pane.parent.replaceChild(pane, newGroup);
			group = newGroup;

			if (pane.next) pane.next.prev = newGroup;
			if (pane.prev) pane.prev.next = newGroup;

			pane.next = pane.prev = null;
		}

		const bounds = group.bounds(container.getBoundingClientRect());

		const newPane = new PaneData(_getId(), pane);
		group.addChild(newPane);

		const divider = new DividerData({
			id: _did++,
			type: dividerType,
			group,
			position: null,
			prev: null,
			next: null
		});

		const pos = childGroupIsRow
			? (clientX - bounds.left) / bounds.width
			: (clientY - bounds.top) / bounds.height;

		const d = pos - pane.pos;

		divider.position = pos;

		if (edge === constants.NORTH || edge === constants.WEST) {
			newPane.size = d;
			pane.pos = pos;
			pane.size -= d;

			if (pane.prev) pane.prev.next = newPane;

			pane.prev = divider;
			newPane.next = divider;

			divider.prev = newPane;
			divider.next = pane;
		} else {
			newPane.pos = pos;
			newPane.size = pane.size - d;
			pane.size = d;

			if (pane.next) pane.next.prev = newPane;

			pane.next = divider;
			newPane.prev = divider;

			divider.prev = pane;
			divider.next = newPane;
		}

		_panes.push(newPane);
		_dividers.push(divider);

		_did = _did, _panes = _panes, _dividers = _dividers, _dragging = divider;

		_userSelect = document.body.style.userSelect;
		document.body.style.userSelect = 'none';

		_updateLayout();
		dispatch('open', { pane: newPane, layout });
	}

	function _start(divider) {
		_userSelect = document.body.style.userSelect;
		document.body.style.userSelect = 'none';

		_dragging = divider;
	}

	function _drag(event) {
		if (!_dragging) return;

		const bounds = _dragging.parent.bounds(container.getBoundingClientRect());

		const { prev, next } = _dragging;

		const min = prev.pos;
		const max = next.pos + next.size;

		const position = _dragging.type === 'vertical'
			? clamp((event.clientX - bounds.left) / bounds.width, min, max)
			: clamp((event.clientY - bounds.top) / bounds.height, min, max);

		prev.setRange(min, position);
		next.setRange(position, max);

		_dragging.position = position;

		_panes = _panes, _dividers = _dividers, _closing = position === min || position === max;
	}

	function _end(event) {
		if (!_dragging) return;

		_drag(event);

		const prevSize = _dragging.prev.size;

		const min = Math.min(prevSize, _dragging.next.size);
		let destroyed;

		if (min <= 0) {
			removeFromArray(_dragging.parent.dividers, _dragging);
			removeFromArray(_dividers, _dragging);

			destroyed = prevSize <= 0
				? _dragging.prev
				: _dragging.next;

			if (prevSize <= 0) {
				const mergedDivider = _dragging.prev.prev;

				_dragging.next.prev = mergedDivider;
				if (mergedDivider) mergedDivider.next = _dragging.next;
			} else {
				const mergedDivider = _dragging.next.next;

				_dragging.prev.next = mergedDivider;
				if (mergedDivider) mergedDivider.prev = _dragging.prev;
			}

			destroyed.destroy(_panes, _dividers);
			_ids.delete(destroyed.id);
			if (destroyed.parent) {
				removeFromArray(destroyed.parent.children, destroyed);
			}
		}

		_panes = _panes, _dividers = _dividers, _dragging = false;
		document.body.style.userSelect = _userSelect;

		_updateLayout();

		if (destroyed) {
			dispatch('close', { pane: destroyed, layout });
		}
	}

	function _handleKeydown(event) {
		_keyPressed = event.which === constants.KEYCODE;
	}
</script>

<svelte:window on:keydown="{_handleKeydown}" on:keyup="{() => _keyPressed = false}"/>

<div class="clip">
	<div
		bind:this={container}
		class="layout"
		style="--thickness: {thickness}; --draggable: calc({thickness} + {padding}); --color: {color}"
	>
		{#each _panes as pane (pane.id)}
			<Pane {_keyPressed} {pane} {component} on:split="{event => _split(pane, event)}"/>
		{/each}

		{#each _dividers as divider (divider.id)}
			<Divider {divider} on:mousedown="{() => _start(divider)}"/>
		{/each}

		{#if _dragging}
			<div
				class="overlay {_dragging.type} {_closing ? 'closing' : ''}"
				on:mousemove="{_drag}"
				on:mouseup="{_end}"
				on:mouseleave="{_end}"
			></div>
		{/if}
	</div>
</div>

<style>
	.clip, .overlay {
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.clip {
		position: absolute;
		overflow: hidden;
	}

	.overlay {
		position: fixed;
		z-index: 2147483647;
	}

	.overlay.vertical {
		cursor: col-resize;
	}

	.overlay.horizontal {
		cursor: row-resize;
	}

	.overlay.closing {
		cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABYUlEQVR4AWP4//8/Bj548CCTvr7+BBYWlm+MjIz/QJiDg+NVQkJCDEgeG8YqGBcXF8XExPRXTU2tCWhICtCQFGVl5ZVAg3/W19fLYtODrFnby8vLGYSlpKRWc3JyPvH19XV2dXV1dnNzA+FIkMtMTEyqYOpaW1slMQxiZ2d/DVJICpaWll6JYpCwsPAToMRfUg1iY2P7Jioq+ghukIiISImkpORMkCTQW01Ag0tBWEZGpkxFRaUKGFZVYmJipTBxHh6eZSC16urqZUDxYozABkl6eHhI8vPzS/Lx8amBxOTl5dWcnZ0lq6qqWIBiekA+L9DiaJBamD6sBtnb20sC6U4gvgASAxp63tbWtgeZTcigUYNGDYqJiZGeO3cu4/z58xlBYosWLWKcMmUKmA0TU1BQiMVrECjvADPiQSMjo4X4MDCF3wQadganQZGRkVFAw96DyiJ8mJeX93Zvb68Osl4AWF08Tf9FROcAAAAASUVORK5CYII=') 9 9, auto;
	}

	.layout {
		position: absolute;
		width: calc(100% + var(--thickness));
		height: calc(100% + var(--thickness));
		overflow: hidden;
		margin: calc(0px - var(--thickness) / 2);
	}
</style>