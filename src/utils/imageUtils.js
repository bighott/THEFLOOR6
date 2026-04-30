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

// ── STUDY DATA ────────────────────────────────────────────────────────────────
const studyCache = new Map()

export async function fetchStudyData(item) {
  const cacheKey = item.answer
  if (studyCache.has(cacheKey)) return studyCache.get(cacheKey)

  const images = []
  let extract = ''

  // 1. Use provided imageUrl as primary image
  if (item.imageUrl) {
    images.push(item.imageUrl)
  }

  // 2. Fetch Wikipedia data if wikiTitle exists
  if (item.wikiTitle) {
    try {
      // Fetch REST summary for extract text + primary image
      const summaryRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`,
        { headers: { Accept: 'application/json' } }
      )
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        if (summaryData.extract) {
          extract = summaryData.extract.slice(0, 600)
        }
        // If no imageUrl was provided, use the Wikipedia primary image
        if (!item.imageUrl) {
          const primaryImg =
            summaryData.originalimage?.source ||
            summaryData.thumbnail?.source ||
            null
          if (primaryImg) {
            const normalized = summaryData.thumbnail?.source && !summaryData.originalimage?.source
              ? summaryData.thumbnail.source.replace(/\/\d+px-/, '/500px-')
              : primaryImg
            images.push(normalized)
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Fetch list of images from the article
    try {
      const imgListRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(item.wikiTitle)}&prop=images&imlimit=10&format=json&origin=*`
      )
      if (imgListRes.ok) {
        const imgListData = await imgListRes.json()
        const pages = Object.values(imgListData.query?.pages || {})
        const page = pages[0]
        const rawFiles = (page?.images || []).map((img) => img.title)

        // Filter: keep only jpg/jpeg/png, exclude icons/logos/flags etc.
        const EXCLUDE = /(icon|logo|flag|seal|button|arrow|blank|map|locator|commons|wikimedia)/i
        const filtered = rawFiles.filter((f) => {
          const lower = f.toLowerCase()
          return /\.(jpg|jpeg|png)$/.test(lower) && !EXCLUDE.test(lower)
        })

        // Take up to 4 candidates to batch-resolve
        const candidates = filtered.slice(0, 4)

        if (candidates.length > 0) {
          const titlesParam = candidates.join('|')
          const resolveRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titlesParam)}&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`
          )
          if (resolveRes.ok) {
            const resolveData = await resolveRes.json()
            const resolvedPages = Object.values(resolveData.query?.pages || {})
            for (const p of resolvedPages) {
              const url = p.imageinfo?.[0]?.url
              if (url && !images.includes(url)) {
                images.push(url)
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Cap images at 3, deduplicated
  const uniqueImages = [...new Set(images)].slice(0, 3)

  const result = { images: uniqueImages, extract }
  studyCache.set(cacheKey, result)
  return result
}

// ── ANSWER CHECKING ────────────────────────────────────────────────────────────
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
