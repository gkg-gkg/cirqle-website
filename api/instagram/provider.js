'use strict';

// Abstract interface — swap RapidAPI for the official Instagram Graph API
// later without touching any callers.
class InstagramDataProvider {
  // @returns {Promise<import('./types').UserProfile>}
  async getUserInfo() { throw new Error('Not implemented'); }

  // @param {{ maxPages?: number, amount?: number }} options
  // @returns {Promise<import('./types').UserProfile[]>}
  async getFollowers(_options) { throw new Error('Not implemented'); }

  // @param {{ maxPages?: number, amount?: number }} options
  // @returns {Promise<import('./types').UserProfile[]>}
  async getFollowing(_options) { throw new Error('Not implemented'); }

  // @param {{ maxPages?: number, amount?: number }} options
  // @returns {Promise<import('./types').Post[]>}
  async getPosts(_options) { throw new Error('Not implemented'); }
}

module.exports = { InstagramDataProvider };
