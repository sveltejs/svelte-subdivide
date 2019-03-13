<script>
	import Subdivide from '../../src/Subdivide.svelte';
	import Item from './Item.svelte';
	import { resetIndex } from './counter.js';

	resetIndex();
	
	export let layout;
</script>

<Subdivide component={Item} thickness='0px' {layout} />