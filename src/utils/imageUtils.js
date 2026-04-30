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
    const words = wikiTitle.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2)
    for (const result of results) {
      const titleLower = result.title.toLowerCase()
      if (words.length > 0 && !words.some(w => titleLower.includes(w))) continue
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

const IMG_EXCLUDE = /(icon|logo|flag|seal|button|arrow|blank|map|locator|commons|wikimedia|edit|stub|question|red_x|checkmark|range|distribution|habitat)/i

async function resolveFileUrls(titles, host = 'en.wikipedia.org') {
  if (!titles.length) return []
  try {
    const joined = titles.map(t => t.replace(/ /g, '_')).join('|')
    const res = await fetch(
      `https://${host}/w/api.php?action=query&titles=${joined}&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`
    )
    if (!res.ok) return []
    const data = await res.json()
    return Object.values(data.query?.pages || {})
      .map(p => p.imageinfo?.[0]?.url)
      .filter(Boolean)
  } catch { return [] }
}

// Best source: Wikimedia Commons category linked from the Wikipedia article.
// These images are curated specifically for that subject.
async function getCommonsCategoryImages(wikiTitle) {
  try {
    const propsRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageprops&format=json&origin=*`
    )
    if (!propsRes.ok) return []
    const propsData = await propsRes.json()
    const pages = Object.values(propsData.query?.pages || {})
    const category = pages[0]?.pageprops?.commonscategory
    if (!category) return []

    const catRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmnamespace=6&cmlimit=8&format=json&origin=*`
    )
    if (!catRes.ok) return []
    const catData = await catRes.json()
    const titles = (catData.query?.categorymembers || [])
      .map(m => m.title)
      .filter(t => /\.(jpg|jpeg|png)$/i.test(t) && !IMG_EXCLUDE.test(t))
      .slice(0, 4)
    return resolveFileUrls(titles, 'commons.wikimedia.org')
  } catch { return [] }
}

// Fallback: first few images embedded in the Wikipedia article itself
async function getWikiArticleImages(wikiTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&imlimit=15&format=json&origin=*`
    )
    if (!res.ok) return []
    const data = await res.json()
    const pages = Object.values(data.query?.pages || {})
    const files = (pages[0]?.images || [])
      .map(img => img.title)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !IMG_EXCLUDE.test(f))
      .slice(0, 4)
    return resolveFileUrls(files)
  } catch { return [] }
}

// Last resort: Commons file-name search (less precise but broad coverage)
async function getCommonsSearchImages(query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=6&format=json&origin=*`
    )
    if (!res.ok) return []
    const data = await res.json()
    const titles = (data.query?.search || [])
      .map(r => r.title)
      .filter(t => !IMG_EXCLUDE.test(t))
    if (!titles.length) return []
    return resolveFileUrls(titles, 'commons.wikimedia.org')
  } catch { return [] }
}

export async function fetchStudyData(item) {
  const cacheKey = item.answer
  if (studyCache.has(cacheKey)) return studyCache.get(cacheKey)

  const seen = new Set()
  const images = []
  let extract = ''

  const addImg = (url) => {
    if (url && !seen.has(url) && images.length < 3) {
      seen.add(url); images.push(url)
    }
  }

  // Direct imageUrl (e.g. Shakespeare plays with Wikimedia Commons links)
  if (item.imageUrl) addImg(item.imageUrl)

  const lookupTitle = item.wikiTitle || item.answer

  // Tier 1: Wikipedia REST summary → extract + primary image (most reliable)
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(lookupTitle)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (res.ok) {
      const d = await res.json()
      if (d.extract) extract = d.extract.slice(0, 600)
      if (!item.imageUrl) {
        const img = d.originalimage?.source ||
          (d.thumbnail?.source ? d.thumbnail.source.replace(/\/\d+px-/, '/500px-') : null)
        addImg(img)
      }
    }
  } catch {}

  // Tier 2: Wikimedia Commons category (curated, subject-specific images)
  if (images.length < 3 && item.wikiTitle) {
    const catImgs = await getCommonsCategoryImages(item.wikiTitle)
    catImgs.forEach(addImg)
  }

  // Tier 3: Wikipedia article image list (first few images on the article page)
  if (images.length < 3) {
    const articleImgs = await getWikiArticleImages(lookupTitle)
    articleImgs.forEach(addImg)
  }

  // Tier 4: Commons file-name search — prefer the disambiguated wikiTitle over bare answer
  if (images.length < 2) {
    const searchTerm = (item.wikiTitle && item.wikiTitle !== item.answer) ? item.wikiTitle : item.answer
    const searchImgs = await getCommonsSearchImages(searchTerm)
    searchImgs.forEach(addImg)
  }

  // Tier 5: fallback to bare answer if wikiTitle search above found nothing
  if (images.length < 1 && item.wikiTitle && item.wikiTitle !== item.answer) {
    const commonsImgs = await getCommonsSearchImages(item.answer)
    commonsImgs.forEach(addImg)
  }

  const result = { images, extract }
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
