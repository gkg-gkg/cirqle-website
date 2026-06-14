'use strict';

// Follows pagination_token across pages until exhausted or maxPages hit.
// fetchPage receives the current token (null on the first call) and must
// return the raw API response object.
async function fetchAllPages(fetchPage, { maxPages = 10 } = {}) {
  const results = [];
  let token = null;
  let page = 0;

  do {
    const data = await fetchPage(token);
    // API returns the list under different keys depending on endpoint
    const items = data.users ?? data.items ?? data.posts ?? data.reels ?? [];
    if (Array.isArray(items)) results.push(...items);
    token = data.pagination_token ?? null;
    page++;
  } while (token && page < maxPages);

  return results;
}

module.exports = { fetchAllPages };
