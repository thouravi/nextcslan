export function circleFlagUrl(countryCode: string): string {
  return `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@2.7.0/flags/${countryCode.toLowerCase()}.svg`
}

export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return [...code]
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join('')
}
