const cache = new Map()

export async function fetchWikiImage(wikiTitle) {
  if (!wikiTitle) return null
  if (cache.has(wikiTitle)) return cache.get(wikiTitle)

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) { cache.set(wikiTitle, null); return null }
    const data = await res.json()
    let url = data.originalimage?.source || data.thumbnail?.source || null
    if (url && data.thumbnail?.source && !data.originalimage?.source) {
      url = data.thumbnail.source.replace(/\/\d+px-/, '/500px-')
    }
    cache.set(wikiTitle, url)
    return url
  } catch {
    cache.set(wikiTitle, null)
    return null
  }
}

export function checkAnswer(userInput, item) {
  const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '')
  const user = normalize(userInput)
  if (!user) return false
  const accepted = [item.answer, ...(item.alternates || [])]
  return accepted.some((a) => normalize(a) === user)
}
