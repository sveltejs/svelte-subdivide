# svelte-subdivide changelog

## 2.2.0

* Fire `open`, `close` and `layout` events ([#20](https://github.com/sveltejs/svelte-subdivide/issues/20))
* Indicate when pane will be closed via custom cursor

## 2.1.0

* Expose `layout` property for implementing save and restore ([#17](https://github.com/sveltejs/svelte-subdivide/pull/17))
* Use unique IDs, rather than sequential ones ([#19](https://github.com/sveltejs/svelte-subdivide/pull/19))

## 2.0.0

* Replace `spacing` parameter with `thickness` and `padding`
* Add visual indicators for dragging and splitting
* Prevent text selection during dragging
* Use ctrl key in non-Mac environments
* Fix broken relationships when dragging twice from left/top edge of a pane

## 1.0.0

* First release