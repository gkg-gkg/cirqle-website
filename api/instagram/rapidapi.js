'use strict';

const { InstagramDataProvider } = require('./provider');
const { parseUser, parsePost } = require('./types');
const { fetchAllPages } = require('./paginator');

const BASE_URL = 'https://instagram-scraper-stable-api.p.rapidapi.com';
const RAPIDAPI_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';

class RapidApiInstagramProvider extends InstagramDataProvider {
  constructor({ apiKey, username } = {}) {
    super();
    this.apiKey  = apiKey  || process.env.RAPIDAPI_KEY;
    this.username = username || process.env.INSTAGRAM_USERNAME || 'cirqle_ltd';
    if (!this.apiKey) {
      throw new Error('RAPIDAPI_KEY is required — set it in .env or pass it to the constructor');
    }
  }

  _headers() {
    return {
      'x-rapidapi-key':  this.apiKey,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type':    'application/x-www-form-urlencoded',
    };
  }

  // POST with exponential backoff on 429s
  async _post(endpoint, params, retries = 3) {
    const body = new URLSearchParams(params).toString();
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) {
        const delay = 1000 * 2 ** attempt; // 2 s, 4 s
        await new Promise(r => setTimeout(r, delay));
      }

      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method:  'POST',
        headers: this._headers(),
        body,
      });

      if (res.status === 429) {
        lastError = new Error(`Rate limited by RapidAPI (429) on ${endpoint}`);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`RapidAPI error ${res.status} on ${endpoint}: ${text}`);
      }

      return res.json();
    }

    throw lastError;
  }

  async getUserInfo() {
    const data = await this._post('get_ig_user_info_v2.php', {
      username_or_url: this.username,
    });
    return parseUser(data?.data ?? data);
  }

  async getFollowers({ maxPages = 5, amount = 50 } = {}) {
    const raw = await fetchAllPages(
      token => this._post('get_ig_user_followers_v2.php', {
        username_or_url: this.username,
        amount: String(amount),
        ...(token ? { pagination_token: token } : {}),
      }),
      { maxPages },
    );
    return raw.map(parseUser).filter(Boolean);
  }

  async getFollowing({ maxPages = 5, amount = 50 } = {}) {
    const raw = await fetchAllPages(
      token => this._post('get_ig_user_following_v2.php', {
        username_or_url: this.username,
        data: 'following',
        amount: String(amount),
        ...(token ? { pagination_token: token } : {}),
      }),
      { maxPages },
    );
    return raw.map(parseUser).filter(Boolean);
  }

  async getPosts({ maxPages = 3, amount = 12 } = {}) {
    const raw = await fetchAllPages(
      token => this._post('get_ig_user_posts_v2.php', {
        username_or_url: this.username,
        amount: String(amount),
        ...(token ? { pagination_token: token } : {}),
      }),
      { maxPages },
    );
    return raw.map(parsePost).filter(Boolean);
  }

  async getReels({ maxPages = 3, amount = 12 } = {}) {
    const raw = await fetchAllPages(
      token => this._post('get_ig_user_reels_v2.php', {
        username_or_url: this.username,
        amount: String(amount),
        ...(token ? { pagination_token: token } : {}),
      }),
      { maxPages },
    );
    return raw.map(parsePost).filter(Boolean);
  }
}

module.exports = { RapidApiInstagramProvider };
