import * as constants from './constants.js';

class Rect {
	constructor(id, x, y, w, h, prev, next) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.prev = prev;
		this.next = next;

		this.parent = null;
	}

	bounds(rect) {
		const width = rect.right - rect.left;
		const height = rect.bottom - rect.top;

		return {
			left: rect.left + width * this.getLeft(),
			top: rect.top + height * this.getTop(),
			width: width * this.getWidth(),
			height: height * this.getHeight()
		};
	}

	getLeft() {
		let left = this.x;

		let node = this;
		while (node = node.parent) left = node.x + (node.w * left);

		return left;
	}

	getTop() {
		let top = this.y;

		let node = this;
		while (node = node.parent) top = node.y + (node.h * top);

		return top;
	}

	getWidth() {
		let width = this.w;

		let node = this;
		while (node = node.parent) width *= node.w;

		return width;
	}

	getHeight() {
		let height = this.h;

		let node = this;
		while (node = node.parent) height *= node.h;

		return height;
	}

	setRange(a, b) {
		if (this.parent.type === constants.COLUMN) {
			this.y = a;
			this.h = (b - a);
		} else {
			this.x = a;
			this.w = (b - a);
		}
	}
}

export class Pane extends Rect {
	constructor(id, { x, y, w, h, prev, next }) {
		super(id, x, y, w, h, prev, next);
		this.id = id;
	}

	destroy(panes, dividers) {
		const index = panes.indexOf(this);
		if (index === -1) throw new Error(`Unexpected error`);
		panes.splice(index, 1);
	}

	toJSON() {
		return {
			id: this.id,
			type: 'pane',
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h,
			prev: this.prev && this.prev.id,
			next: this.next && this.next.id
		};
	}
}

export class Group extends Rect {
	constructor(id, type, { x, y, w, h, prev, next }) {
		super(id, x, y, w, h, prev, next);

		this.type = type;
		this.children = [];
		this.dividers = [];
	}

	addChild(child) {
		this.children.push(child);
		child.parent = this;
	}

	replaceChild(child, replacement) {
		const index = this.children.indexOf(child);
		if (index === -1) throw new Error(`Unexpected error`);
		this.children[index] = replacement;

		replacement.parent = this;

		child.parent = replacement;
		replacement.children.push(child);
	}

	destroy(panes, dividers) {
		let i = this.children.length;
		while (i--) this.children[i].destroy(panes, dividers);

		i = this.dividers.length;
		while (i--) this.dividers[i].destroy(dividers);
	}

	toJSON() {
		return {
			id: this.id,
			type: 'group',
			direction: this.type, // TODO confusing
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h,
			prev: this.prev && this.prev.id,
			next: this.next && this.next.id,
			children: this.children.map(child => child.toJSON())
		};
	}
}

export class Divider {
	constructor({ id, type, group, position, prev, next }) {
		this.id = id;
		this.type = type;
		this.parent = group;
		this.position = position;
		this.prev = prev;
		this.next = next;

		group.dividers.push(this);
	}

	destroy(dividers) {
		const index = dividers.indexOf(this);
		if (index === -1) throw new Error(`Unexpected error`);
		dividers.splice(index, 1);
	}
}