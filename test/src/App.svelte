<script>
	import Subdivide from '../../src/Subdivide.svelte';
	import Item from './Item.svelte';
	import { resetIndex } from './counter.js';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	resetIndex();

	export let layout;
</script>

<Subdivide component={Item} thickness='0px' {layout} on:open on:close on:layout="{(e) => dispatch('onLayout', e.detail)}" />