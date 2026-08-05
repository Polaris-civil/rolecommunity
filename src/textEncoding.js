const UTF8_BOM = [0xef, 0xbb, 0xbf];
const UTF16LE_BOM = [0xff, 0xfe];
const UTF16BE_BOM = [0xfe, 0xff];

function startsWith(bytes, marker) {
  return marker.every((value, index) => bytes[index] === value);
}

function decode(bytes, encoding) {
  try {
    return new TextDecoder(encoding, { fatal: encoding === 'utf-8' }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return '';
  }
}

export function decodeTextBuffer(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  if (!bytes.length) return '';
  if (startsWith(bytes, UTF16LE_BOM)) return decode(bytes, 'utf-16le');
  if (startsWith(bytes, UTF16BE_BOM)) return decode(bytes, 'utf-16be');
  if (startsWith(bytes, UTF8_BOM)) return decode(bytes, 'utf-8');

  const utf8 = decode(bytes, 'utf-8');
  if (utf8) return utf8;
  const gb18030 = decode(bytes, 'gb18030');
  if (gb18030) return gb18030;
  const big5 = decode(bytes, 'big5');
  return big5 || new TextDecoder().decode(bytes).replace(/^\uFEFF/, '');
}

export async function decodeTextFile(file) {
  return decodeTextBuffer(await file.arrayBuffer());
}
