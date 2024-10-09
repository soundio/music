
import postpad from 'fn/postpad.js';
import { toNoteName } from 'midi/note.js';

const notes = Array.from({ length: 128 });

// We use the unicode Figure Space character in postpad() to align numerals
export default notes
.map((n, i) => `
    <option value="${ 127 - i }">${ postpad(' ', 4, '' + (127 - i)) }${ toNoteName(127 - i) }</option>${ (127 - i) % 12 ? `` : `
    <hr/>` }`
)
.join('\n');
