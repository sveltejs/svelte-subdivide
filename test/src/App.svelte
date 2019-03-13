<script>
	import Subdivide from '../../src/Subdivide.svelte';
	import Item from './Item.svelte';

	let layout;
</script>

<Subdivide component={Item} thickness='0px' {layout} />