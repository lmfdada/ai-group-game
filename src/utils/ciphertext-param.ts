// AES ciphertext is base64, but share paths are safer with base64url.
export function encodeCiphertextParam(ciphertext: string): string {
  return ciphertext.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeCiphertextParam(param: string): string {
  let result = String(param).trim()

  try {
    result = decodeURIComponent(result)
  } catch {
    // uni route query is often already decoded.
  }

  result = result.replace(/\s/g, '+').replace(/-/g, '+').replace(/_/g, '/')
  while (result.length % 4) result += '='
  return result
}
