export function clamp(num, min, max) {
	if (num < min) return min;
	if (num > max) return max;
	return num;
}

export function removeFromArray(array, item) {
	const index = array.indexOf(item);
	if (index === -1) throw new Error('Unexpected error');
	array.splice(index, 1);
}