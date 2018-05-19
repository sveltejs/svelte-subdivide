import svelte from 'svelte';
import Subdivide from '../..';
import { assert, test, done } from 'tape-modern';

// setup
const target = document.querySelector('main');

function indent(node, spaces) {
	if (node.childNodes.length === 0) return;

	if (node.childNodes.length > 1 || node.childNodes[0].nodeType !== 3) {
		const first = node.childNodes[0];
		const last = node.childNodes[node.childNodes.length - 1];

		const head = `\n${spaces}  `;
		const tail = `\n${spaces}`;

		if (first.nodeType === 3) {
			first.data = `${head}${first.data}`;
		} else {
			node.insertBefore(document.createTextNode(head), first);
		}

		if (last.nodeType === 3) {
			last.data = `${last.data}${tail}`;
		} else {
			node.appendChild(document.createTextNode(tail));
		}

		let lastType = null;
		for (let i = 0; i < node.childNodes.length; i += 1) {
			const child = node.childNodes[i];
			if (child.nodeType === 1) {
				indent(node.childNodes[i], `${spaces}  `);

				if (lastType === 1) {
					node.insertBefore(document.createTextNode(head), child);
					i += 1;
				}
			}

			lastType = child.nodeType;
		}
	}
}

function normalize(html) {
	const div = document.createElement('div');
	div.innerHTML = html
		.replace(/<!--.*?-->/g, '')
		.replace(/svelte-ref-\w+=""/g, '')
		.replace(/\s*svelte-\w+\s*/g, '')
		.replace(/class=""/g, '')
		.replace(/>\s+/g, '>')
		.replace(/\s+</g, '<');

	indent(div, '');

	div.normalize();
	return div.innerHTML;
}

assert.htmlEqual = (a, b, msg) => {
	assert.equal(normalize(a), normalize(b));
};

function mousedown(node, clientX, clientY, metaKey) {
	node.dispatchEvent(new MouseEvent('mousedown', {
		metaKey,
		clientX,
		clientY
	}));
}

function mousemove(node, clientX, clientY) {
	node.dispatchEvent(new MouseEvent('mousemove', {
		clientX,
		clientY
	}));
}

function mouseup(node, clientX, clientY) {
	node.dispatchEvent(new MouseEvent('mouseup', {
		clientX,
		clientY
	}));
}

function init() {
	const Item = svelte.create(`
		<span>{pane.id}</span>
	`);

	return new Subdivide({
		target,
		data: {
			component: Item
		}
	});
}

// tests
test('creates a single pane element that fills the target', t => {
	const layout = init();

	t.htmlEqual(target.innerHTML, `
		<div class="layout">
			<div class="pane" style="left: 0%; top: 0%; width: 100%; height: 100%;">
				<span>1</span>
			</div>
		</div>
	`);

	layout.destroy();
});

test('creates a new pane', t => {
	const layout = init();

	const { container } = layout.refs;
	const pane = document.querySelector('.pane');

	mousedown(pane, 5, 100, true);
	mouseup(container, 200, 100);

	t.htmlEqual(target.innerHTML, `
		<div class="layout">
			<div class="pane" style="left: 20%; top: 0%; width: 80%; height: 100%;">
				<span>1</span>
			</div>

			<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%;">
				<span>2</span>
			</div>

			<div class="divider" style="top: 0%; left: 20%; height: 100%;">
				<div class="draggable"></div>
			</div>
		</div>
	`);

	layout.destroy();
});

test('preserves correct pane/divider relationships', t => {
	const layout = init();
	const { container } = layout.refs;

	const { left, top, right, bottom } = container.getBoundingClientRect();
	const width = right - left;
	const height = bottom - top;
	const cx = left + width / 2;
	const cy = top + height / 2;

	let pane = document.querySelector('.pane');

	// split from the left edge
	mousedown(pane, 5, 100, true);
	mouseup(container, 200, 100);

	// split from the right edge
	mousedown(pane, 995, 100, true);
	mouseup(container, 800, 100);

	// split from the top middle
	mousedown(pane, 500, 5, true);
	mouseup(container, 500, 500);

	// split the lower middle chunk from the left
	mousedown(pane, 205, 750, true);
	mouseup(container, 500, 750);

	t.htmlEqual(target.innerHTML, `
		<div class="layout">
			<div class="pane" style="left: 50%; top: 50%; width: 30%; height: 50%;">
				<span>1</span>
			</div>

			<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%;">
				<span>2</span>
			</div>

			<div class="pane" style="left: 80%; top: 0%; width: 20%; height: 100%;">
				<span>3</span>
			</div>

			<div class="pane" style="left: 20%; top: 0%; width: 60%; height: 50%;">
				<span>4</span>
			</div>

			<div class="pane" style="left: 20%; top: 50%; width: 30%; height: 50%;">
				<span>5</span>
			</div>

			<div class="divider" style="top: 0%; left: 20%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 0%; left: 80%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="left: 20%; top: 50%; width: 60%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 50%; left: 50%; height: 50%;">
				<div class="draggable"></div>
			</div>
		</div>
	`);

	// now, check that dragging the leftmost vertical slider updates the
	// layout how we expect
	let divider = target.querySelectorAll('.divider')[0];
	mousedown(divider, 200, 500);
	mouseup(container, 100, 500);

	t.htmlEqual(target.innerHTML, `
		<div class="layout">
			<div class="pane" style="left: 45%; top: 50%; width: 35%; height: 50%;">
				<span>1</span>
			</div>

			<div class="pane" style="left: 0%; top: 0%; width: 10%; height: 100%;">
				<span>2</span>
			</div>

			<div class="pane" style="left: 80%; top: 0%; width: 20%; height: 100%;">
				<span>3</span>
			</div>

			<div class="pane" style="left: 10%; top: 0%; width: 70%; height: 50%;">
				<span>4</span>
			</div>

			<div class="pane" style="left: 10%; top: 50%; width: 35%; height: 50%;">
				<span>5</span>
			</div>

			<div class="divider" style="top: 0%; left: 10%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 0%; left: 80%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="left: 10%; top: 50%; width: 70%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 50%; left: 45%; height: 50%;">
				<div class="draggable"></div>
			</div>
		</div>
	`);

	// split the top middle pane
	pane = target.querySelectorAll('.pane')[3];
	mousedown(pane, 105, 250, true);
	mouseup(container, 500, 250);

	// drag the rightmost vertical divider
	divider = target.querySelectorAll('.divider')[1];
	mousedown(divider, 800, 500);
	mouseup(container, 900, 500);

	t.htmlEqual(target.innerHTML, `
		<div class="layout">
			<div class="pane" style="left: 50%; top: 50%; width: 40%; height: 50%;">
				<span>1</span>
			</div>

			<div class="pane" style="left: 0%; top: 0%; width: 10%; height: 100%;">
				<span>2</span>
			</div>

			<div class="pane" style="left: 90%; top: 0%; width: 10%; height: 100%;">
				<span>3</span>
			</div>

			<div class="pane" style="left: 55%; top: 0%; width: 35%; height: 50%;">
				<span>4</span>
			</div>

			<div class="pane" style="left: 10%; top: 50%; width: 40%; height: 50%;">
				<span>5</span>
			</div>

			<div class="pane" style="left: 10%; top: 0%; width: 45%; height: 50%;">
				<span>6</span>
			</div>

			<div class="divider" style="top: 0%; left: 10%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 0%; left: 90%; height: 100%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="left: 10%; top: 50%; width: 80%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 50%; left: 50%; height: 50%;">
				<div class="draggable"></div>
			</div>

			<div class="divider" style="top: 0%; left: 55%; height: 50%;">
				<div class="draggable"></div>
			</div>
		</div>
	`);

	layout.destroy();
});

// TODO destroying panes

// this allows us to close puppeteer once tests have completed
window.done = done;