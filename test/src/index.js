import App from './App.svelte';
import { normalize, sleep } from './utils.js';
import { assert, test, done } from 'tape-modern';
import { tick } from 'svelte';

// setup
const target = document.querySelector('main');

assert.htmlEqual = (a, b, msg) => {
	assert.equal(normalize(a), normalize(b), msg);
};

async function mousedown(node, clientX, clientY, metaKey) {
	node.dispatchEvent(new MouseEvent('mousedown', {
		metaKey,
		ctrlKey: metaKey,
		clientX,
		clientY
	}));
	await tick();
}

async function mousemove(node, clientX, clientY) {
	node.dispatchEvent(new MouseEvent('mousemove', {
		clientX,
		clientY
	}));
	await tick();
}

async function mouseup(node, clientX, clientY) {
	node.dispatchEvent(new MouseEvent('mouseup', {
		clientX,
		clientY
	}));
	await tick();
}

// tests
test('creates a single pane element that fills the target', async t => {
	const app = new App({
		target
	});
	try {
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<!----><div class="pane" style="left: 0%; top: 0%; width: 100%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
				</div>
			</div>
		`);
	
	}
	finally {
		app.$destroy();
	}
});

test('creates a new pane', async t => {
	const app = new App({
		target
	});

	try {
		const pane = document.querySelector('.pane');
	
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 200, 100);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 20%; top: 0%; width: 80%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 20%; height: 100%;"></div>
				</div>
			</div>
		`);
	}
	finally {
		app.$destroy();
	}
});

test('preserves correct pane/divider relationships (a)', async t => {
	const app = new App({
		target
	});
	try {
		const container = target.querySelector('.layout')
	
		const { left, top, right, bottom } = container.getBoundingClientRect();
		const width = right - left;
		const height = bottom - top;
		const cx = left + width / 2;
		const cy = top + height / 2;
	
		let pane = document.querySelector('.pane');
	
		// split from the left edge
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 200, 100);
	
		// split from the right edge
		await mousedown(pane, 995, 100, true);
		await mouseup(document.querySelector('.overlay'), 800, 100);
	
		// split from the top middle
		await mousedown(pane, 500, 5, true);
		await mouseup(document.querySelector('.overlay'), 500, 500);
	
		// split the lower middle chunk from the left
		await mousedown(pane, 205, 750, true);
		await mouseup(document.querySelector('.overlay'), 500, 750);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 50%; top: 50%; width: 30%; height: 50%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 80%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="pane" style="left: 20%; top: 0%; width: 60%; height: 50%; cursor: default;">
						<div class="inner">
							<span>3</span>
						</div>
					</div>
	
					<div class="pane" style="left: 20%; top: 50%; width: 30%; height: 50%; cursor: default;">
						<div class="inner">
							<span>4</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 20%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 80%; height: 100%;"></div>
					<div class="horizontal divider" style="left: 20%; top: 50%; width: 60%;"></div>
					<div class="vertical divider" style="top: 50%; left: 50%; height: 50%;"></div>
				</div>
			</div>
		`);
	
		// now, check that dragging the leftmost vertical slider updates the
		// layout how we expect
		let divider = target.querySelectorAll('.divider')[0];
		await mousedown(divider, 200, 500);
		await mouseup(document.querySelector('.overlay'), 100, 500);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 45%; top: 50%; width: 35%; height: 50%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 10%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 80%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="pane" style="left: 10%; top: 0%; width: 70%; height: 50%; cursor: default;">
						<div class="inner">
							<span>3</span>
						</div>
					</div>
	
					<div class="pane" style="left: 10%; top: 50%; width: 35%; height: 50%; cursor: default;">
						<div class="inner">
							<span>4</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 10%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 80%; height: 100%;"></div>
					<div class="horizontal divider" style="left: 10%; top: 50%; width: 70%;"></div>
					<div class="vertical divider" style="top: 50%; left: 45%; height: 50%;"></div>
				</div>
			</div>
		`);
	
		// split the top middle pane
		pane = target.querySelectorAll('.pane')[3];
		await mousedown(pane, 105, 250, true);
		await mouseup(document.querySelector('.overlay'), 500, 250);
	
		// drag the rightmost vertical divider
		divider = target.querySelectorAll('.divider')[1];
		await mousedown(divider, 800, 500);
		await mouseup(document.querySelector('.overlay'), 900, 500);
	
		// TODO tweak the numbers so we get nice round (testable) numbers
		// t.htmlEqual(target.innerHTML, `
		// 	<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
		// 		<div class="pane" style="left: 50%; top: 50%; width: 40%; height: 50%; cursor: default;">
		// 			<div class="inner">
		// 				<span>0</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="pane" style="left: 0%; top: 0%; width: 10%; height: 100%; cursor: default;">
		// 			<div class="inner">
		// 				<span>1</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="pane" style="left: 90%; top: 0%; width: 10%; height: 100%; cursor: default;">
		// 			<div class="inner">
		// 				<span>2</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="pane" style="left: 55%; top: 0%; width: 35%; height: 50%; cursor: default;">
		// 			<div class="inner">
		// 				<span>3</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="pane" style="left: 10%; top: 50%; width: 40%; height: 50%; cursor: default;">
		// 			<div class="inner">
		// 				<span>4</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="pane" style="left: 10%; top: 0%; width: 45%; height: 50%; cursor: default;">
		// 			<div class="inner">
		// 				<span>5</span>
		// 			</div>
		// 		</div>
	
		// 		<div class="divider" style="top: 0%; left: 10%; height: 100%;"></div>
	
		// 		<div class="divider" style="top: 0%; left: 90%; height: 100%;"></div>
	
		// 		<div class="divider" style="left: 10%; top: 50%; width: 80%;"></div>
	
		// 		<div class="divider" style="top: 50%; left: 50%; height: 50%;"></div>
	
		// 		<div class="divider" style="top: 0%; left: 55%; height: 50%;"></div>
		// 	</div>
		// `);
	
	}
	finally {
		app.$destroy();
	}
});

test('preserves correct pane/divider relationships (b)', async t => {
	const app = new App({
		target
	});
	try{
		const container = target.querySelector('.layout');
	
		const { left, top, right, bottom } = container.getBoundingClientRect();
		const width = right - left;
		const height = bottom - top;
		const cx = left + width / 2;
		const cy = top + height / 2;
	
		let pane = document.querySelector('.pane');
	
		// split from the left edge
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 700, 100);
	
		// split from the new split
		pane = target.querySelectorAll('.pane')[1];
		await mousedown(pane, 695, 100, true);
		await mouseup(document.querySelector('.overlay'), 300, 100);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 70%; top: 0%; width: 30%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 30%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 30%; top: 0%; width: 40%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 70%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 30%; height: 100%;"></div>
				</div>
			</div>
		`);
	
		// now, check that dragging the leftmost vertical slider updates the
		// layout how we expect
		let divider = target.querySelectorAll('.divider')[0];
		await mousedown(divider, 700, 500);
		await mouseup(document.querySelector('.overlay'), 500, 500);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 50%; top: 0%; width: 50%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 30%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 30%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 50%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 30%; height: 100%;"></div>
				</div>
			</div>
		`);
	}
	finally {
		app.$destroy();
	}
});

test('preserves correct pane/divider relationships (c)', async t => {
	const app = new App({
		target
	});
	try {
	
		let pane = document.querySelector('.pane');
	
		// split from the left edge
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 250, 100);
	
		// split from the new split
		pane = target.querySelectorAll('.pane')[0];
		await mousedown(pane, 255, 100, true);
		await mouseup(document.querySelector('.overlay'), 500, 100);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 50%; top: 0%; width: 50%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 25%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 25%; top: 0%; width: 25%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 25%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 50%; height: 100%;"></div>
				</div>
			</div>
		`);
	
		// now, check that dragging the leftmost vertical slider updates the
		// layout how we expect
		let divider = target.querySelectorAll('.divider')[0];
		await mousedown(divider, 250, 500);
		await mouseup(document.querySelector('.overlay'), 350, 500);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 50%; top: 0%; width: 50%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 35%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 35%; top: 0%; width: 15%; height: 100%; cursor: default;">
						<div class="inner">
							<span>2</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 35%; height: 100%;"></div>
					<div class="vertical divider" style="top: 0%; left: 50%; height: 100%;"></div>
				</div>
			</div>
		`);	
	}
	finally {
		app.$destroy();
	}
});

test('destroys panes', async t => {
	const app = new App({
		target
	});
	try {
	
		const container = target.querySelector('.layout');
		const pane = document.querySelector('.pane');
	
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 200, 100);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 20%; top: 0%; width: 80%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 20%; height: 100%;"></div>
				</div>
			</div>
		`);
	
		let divider = target.querySelector('.divider');
	
		await mousedown(divider, 200, 500);
		await mouseup(document.querySelector('.overlay'), 1001, 500);
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 0%; top: 0%; width: 100%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
				</div>
			</div>
		`);	
	}
	finally {
		app.$destroy();
	}
});

test('accepts a layout', async t => {
	const app = new App({
		target,
		props: {
			layout: {
				root: {
					id: 0,
					type: 'group',
					row: false,
					pos: 0,
					size: 1,
					prev: null,
					next: null,
					children: [
						{
							type: 'pane',
							id: 1,
							pos: 0,
							size: 0.5,
							prev: null,
							next: null
						},
						{
							type: 'pane',
							id: 2,
							pos: 0.5,
							size: 0.5,
							prev: null,
							next: null
						}
					]
				}
			}
		}
	});
	try {
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 0%; top: 0%; width: 100%; height: 50%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 50%; width: 100%; height: 50%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="horizontal divider" style="left: 0%; top: 50%; width: 100%;"></div>
				</div>
			</div>
		`);	
	}
	finally {
		app.$destroy();
	}
});

test('fires open/close/layout events', async t => {
	const app = new App({
		target
	});
	try {
	
		const events = {
			open: [],
			close: [],
			onLayout: []
		};
	
		Object.keys(events).forEach(name => {
			app.$on(name, event => {
				events[name].push(event);
			});
		});
	
		const pane = document.querySelector('.pane');
	
		await mousedown(pane, 5, 100, true);
		await mouseup(document.querySelector('.overlay'), 200, 100);


		t.equal(events.open.length, 1);
		const open = events.open[0];
		t.ok('pane' in open.detail);
		t.ok('layout' in open.detail);
		t.ok('id' in open.detail.pane);
	
		t.equal(events.onLayout.length, 2);
		const layout0 = events.onLayout[0];
		t.equal(JSON.stringify(open.detail.layout), JSON.stringify(layout0.detail.layout));
	
		t.htmlEqual(target.innerHTML, `
			<div class="clip">
				<div class="layout" style="--thickness:0px; --draggable:calc(0px + 6px); --color:white;">
					<div class="pane" style="left: 20%; top: 0%; width: 80%; height: 100%; cursor: default;">
						<div class="inner">
							<span>0</span>
						</div>
					</div>
	
					<div class="pane" style="left: 0%; top: 0%; width: 20%; height: 100%; cursor: default;">
						<div class="inner">
							<span>1</span>
						</div>
					</div>
	
					<div class="vertical divider" style="top: 0%; left: 20%; height: 100%;"></div>
				</div>
			</div>
		`);
	
		const divider = document.querySelector('.divider');
	
		await mousedown(divider, 200, 100);
		await mouseup(document.querySelector('.overlay'), 0, 100);

		t.equal(events.close.length, 1);
		const close = events.close[0];
		t.ok('pane' in close.detail);
		t.ok('layout' in close.detail);
		t.ok('id' in close.detail.pane);
	
		t.equal(events.onLayout.length, 3);
		const layout2 = events.onLayout[2];
		t.equal(JSON.stringify(close.detail.layout), JSON.stringify(layout2.detail.layout));	
	}
	finally {
		app.$destroy();
	}
});

// TODO save to localStorage

// this allows us to close puppeteer once tests have completed
window.done = done;