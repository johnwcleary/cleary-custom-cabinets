/**
 * A line typed in capitals is slow to read. This shows it in sentence case instead, and gives back
 * their capitals to the names it knows (brand names from the Brands list in Storyblok). Text that
 * already has lower-case letters is returned untouched, so an editor's own capitals always win.
 */
export function sentenceCase(text: string, names: string[] = []): string {
  if (/[a-z]/.test(text)) return text;
  let out = text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());
  for (const name of names) {
    // The longest run of the name's leading words found in the text: "Kraftmaid Vantage" of "Kraftmaid Vantage Cabinetry".
    const words = name.split(/\s+/);
    for (let n = words.length; n > 0; n--) {
      const phrase = words.slice(0, n).join(' ');
      const found = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (found.test(out)) {
        out = out.replace(found, phrase);
        break;
      }
    }
  }
  return out;
}
