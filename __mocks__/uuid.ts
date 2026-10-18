/**
 * Jest mock for `uuid`.
 * Returns incrementing deterministic UUIDs suitable for testing.
 */

let counter = 0;

function v4(): string {
  counter++;
  const hex = counter.toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex}0000`;
}

module.exports = { v4 };
export { v4 };
export default { v4 };
