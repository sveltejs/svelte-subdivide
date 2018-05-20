# svelte-subdivide ([demo](https://svelte.technology/repl?version=2.6.3&gist=972edea66f74521601771be19e192c72))

A component for building Blender-style layouts in Svelte apps.

![subdivide-2](https://user-images.githubusercontent.com/1162160/40279920-696b12e6-5c19-11e8-8861-6bdb071441d5.gif)


## Installation

```bash
yarn add @sveltejs/svelte-subdivide
```


## Usage

```html
<Subdivide component={Pane} />

<script>
  import Subdivide from '@sveltejs/svelte-subdivide';
  import Pane from './Pane.html';

  export default {
    components: { Subdivide },

    data() {
      return {
        Pane
      };
    }
  };
</script>
```

The component constructor you supply to `<Subdivide>` will be instantiated for each cell of your layout. Typically, it would be a component that allows the user to select from a variety of different panes.

```html
<!-- Pane.html -->
<div>
  {#if selected}
    <svelte:component this={selected.component}/>
  {:else}
    {#each options as option}
      <button on:click="set({ selected: option })">
        {selected.label}
      </button>
    {/each}
  {/if}
</div>
```

Note that this component uses CSS variables, and may therefore behave strangely in IE.


## Parameters

You can specify a `spacing` parameter that controls the width of the dividers. It can be any CSS length:

```html
<Subdivide component={Pane} spacing="0.5em"/>
```


## Configuring webpack

If you're using webpack with [svelte-loader](https://github.com/sveltejs/svelte-loader), make sure that you add `"svelte"` to [`resolve.mainFields`](https://webpack.js.org/configuration/resolve/#resolve-mainfields) in your webpack config. This ensures that webpack imports the uncompiled component (`src/index.html`) rather than the compiled version (`index.mjs`) — this is more efficient.

If you're using Rollup with [rollup-plugin-svelte](https://github.com/rollup/rollup-plugin-svelte), this will happen automatically.


## Credits

Essential inspiration was provided by [philholden/subdivide](https://github.com/philholden/subdivide) — thanks Phil!


## License

[LIL](LICENSE)
