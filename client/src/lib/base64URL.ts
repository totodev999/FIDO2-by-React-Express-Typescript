// ArrayBufferをBase64URLにエンコードする関数
// eslint-disable-next-line no-inner-declarations
export function encodeBase64URL(buffer: ArrayBuffer): string {
  // ArrayBufferをバイナリ文字列に変換し、標準のBase64にエンコードする
  let b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  // +を-に、/を_に置き換える
  b64 = b64.replace(/\+/g, "-").replace(/\//g, "_");
  // 末尾の=を削除する
  b64 = b64.replace(/=+$/g, "");
  // エンコードした文字列を返す
  return b64;
}

// Base64URLをArrayBufferにデコードする関数
// eslint-disable-next-line no-inner-declarations
export function decodeBase64URL(b64: string): ArrayBuffer {
  // -を+に、_を/に置き換える
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  // 長さが4の倍数になるように、必要ならば末尾に=を追加する
  const pad = b64.length % 4;
  if (pad > 0) {
    b64 += "=".repeat(4 - pad);
  }
  // 標準のBase64をバイナリ文字列にデコードする
  const bin = atob(b64);
  // バイナリ文字列をUint8Arrayに変換する
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  // Uint8Arrayのbufferプロパティを返す（これがArrayBuffer）
  return bytes.buffer;
}
