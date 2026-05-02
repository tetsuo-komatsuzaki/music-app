/**
 * Supabase Storage の createSignedUrl が path 中の `#` を URL エンコードしないバグ回避。
 * `#` がそのまま signed URL に含まれるとブラウザが fragment 識別子と解釈し、
 * 後続のパスとクエリ文字列が壊れる (例: F# scale → fetch 失敗)。
 *
 * 使い方:
 *   const { data } = await supabase.storage.from('...').createSignedUrl(path, 60)
 *   const safeUrl = encodeSignedUrl(data?.signedUrl)
 */
export function encodeSignedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // パス中の # を %23 に変換 (?token=... 以前の path 部分のみ対象)
  // 単純に全置換でも token 部分に # が出ることはほぼないため安全
  return url.replace(/#/g, "%23")
}
