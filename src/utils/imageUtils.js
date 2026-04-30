const cache = new Map()

async function fetchViaRestAPI(wikiTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    let url = data.originalimage?.source || data.thumbnail?.source || null
    if (url && data.thumbnail?.source && !data.originalimage?.source) {
      url = data.thumbnail.source.replace(/\/\d+px-/, '/500px-')
    }
    return url
  } catch {
    return null
  }
}

async function fetchViaMediaWikiAPI(wikiTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=500&redirects=1&origin=*`
    )
    if (!res.ok) return null
    const data = await res.json()
    const pages = Object.values(data.query?.pages || {})
    const page = pages[0]
    if (!page || page.missing !== undefined) return null
    return page.thumbnail?.source || null
  } catch {
    return null
  }
}

async function fetchViaSearch(wikiTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiTitle)}&srlimit=3&format=json&origin=*`
    )
    if (!res.ok) return null
    const data = await res.json()
    const results = data.query?.search || []
    for (const result of results) {
      const url = await fetchViaMediaWikiAPI(result.title)
      if (url) return url
    }
    return null
  } catch {
    return null
  }
}

export async function fetchWikiImage(wikiTitle) {
  if (!wikiTitle) return null
  if (cache.has(wikiTitle)) return cache.get(wikiTitle)

  let url = await fetchViaRestAPI(wikiTitle)
  if (!url) url = await fetchViaMediaWikiAPI(wikiTitle)
  if (!url) url = await fetchViaSearch(wikiTitle)

  cache.set(wikiTitle, url)
  return url
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function checkAnswer(userInput, item) {
  const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
  const user = normalize(userInput)
  if (!user) return false
  const accepted = [item.answer, ...(item.alternates || [])]

  return accepted.some((a) => {
    const ans = normalize(a)
    if (ans === user) return true
    // User typed only the beginning words ("corn" for "corn cob")
    if (ans.startsWith(user + ' ')) return true
    // User typed extra words beyond the answer ("corn cob something" for "corn cob")
    if (user.startsWith(ans + ' ')) return true
    // Levenshtein for close typos (allow 1 edit per ~4 chars)
    const maxDist = user.length <= 4 ? 1 : user.length <= 8 ? 2 : 3
    if (user.length >= 4 && ans.length >= 4 && Math.abs(user.length - ans.length) <= maxDist) {
      if (levenshtein(user, ans) <= maxDist) return true
    }
    return false
  })
}
