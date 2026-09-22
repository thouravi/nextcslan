export function shortEventName(name: string): string {
  return name
    .replace('ESL Pro League Season ', 'EPL S')
    .replace('Intel Extreme Masters ', 'IEM ')
    .replace('BLAST Rivals Fall', 'BLAST Fall')
    .replace('PGL Major ', 'PGL ')
    .replace(/ 20\d{2}$/, '')
}
