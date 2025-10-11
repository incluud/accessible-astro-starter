/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A slugified string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
