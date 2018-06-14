class Rect {
	constructor(id, pos, size, prev, next) {
		this.id = id;
		this.pos = pos;
		this.size = size;

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

	getPos(row) {
		let pos = 0;

		let node = this;
		while (node.parent) {
			if (node.parent.row === row) pos = node.pos + (node.size * pos);
			node = node.parent;
		}

		return pos;
	}

	getLeft() {
		return this.getPos(true);
	}

	getTop() {
		return this.getPos(false);
	}

	getSize(row) {
		let size = 1;

		let node = this;
		while (node.parent) {
			if (node.parent.row === row) size *= node.size;
			node = node.parent;
		}

		return size;
	}

	getWidth() {
		return this.getSize(true);
	}

	getHeight() {
		return this.getSize(false);
	}

	setRange(a, b) {
		this.pos = a;
		this.size = (b - a);
	}
}

export class Pane extends Rect {
	constructor(id, { pos, size, prev, next }) {
		super(id, pos, size, prev, next);
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
			pos: this.pos,
			size: this.size,
			prev: this.prev && this.prev.id,
			next: this.next && this.next.id
		};
	}
}

export class Group extends Rect {
	constructor(id, row, { pos, size, prev, next }) {
		super(id, pos, size, prev, next);

		this.row = row;
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
			row: this.row,
			pos: this.pos,
			size: this.size,
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