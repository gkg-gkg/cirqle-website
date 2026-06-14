'use strict';

const { RapidApiInstagramProvider } = require('../instagram/rapidapi');

// ── Helpers ────────────────────────────────────────────────────────────────

function mockFetch(...responses) {
  let call = 0;
  return jest.spyOn(global, 'fetch').mockImplementation(() => {
    const resp = responses[Math.min(call++, responses.length - 1)];
    return Promise.resolve({
      ok:     resp.ok ?? true,
      status: resp.status ?? 200,
      json:   () => Promise.resolve(resp.body),
      text:   () => Promise.resolve(JSON.stringify(resp.body)),
    });
  });
}

function makeProvider() {
  return new RapidApiInstagramProvider({ apiKey: 'test-key', username: 'cirqle_ltd' });
}

afterEach(() => jest.restoreAllMocks());

// ── User info ──────────────────────────────────────────────────────────────

test('getUserInfo parses a full user response', async () => {
  mockFetch({
    body: {
      data: {
        id: '123456',
        username: 'cirqle_ltd',
        full_name: 'Cirqle Ltd',
        is_private: false,
        is_verified: true,
        follower_count: 8400,
        following_count: 310,
        media_count: 47,
        biography: 'Cashback powered by influence.',
        profile_pic_url: 'https://example.com/pic.jpg',
      },
    },
  });

  const user = await makeProvider().getUserInfo();
  expect(user.username).toBe('cirqle_ltd');
  expect(user.is_verified).toBe(true);
  expect(user.follower_count).toBe(8400);
  expect(user.biography).toBe('Cashback powered by influence.');
});

test('getUserInfo tolerates missing optional fields', async () => {
  mockFetch({ body: { data: { id: '99', username: 'cirqle_ltd' } } });

  const user = await makeProvider().getUserInfo();
  expect(user.full_name).toBeNull();
  expect(user.follower_count).toBeNull();
  expect(user.is_private).toBe(false);
});

// ── Followers ──────────────────────────────────────────────────────────────

test('getFollowers collects two pages via pagination_token', async () => {
  mockFetch(
    {
      body: {
        users: [
          { id: '1', username: 'user_a', full_name: 'A', is_private: false, is_verified: false },
        ],
        pagination_token: 'tok_page2',
        count: 1,
      },
    },
    {
      body: {
        users: [
          { id: '2', username: 'user_b', full_name: 'B', is_private: false, is_verified: true },
        ],
        pagination_token: null,
        count: 1,
      },
    },
  );

  const followers = await makeProvider().getFollowers({ maxPages: 5 });
  expect(followers).toHaveLength(2);
  expect(followers[0].username).toBe('user_a');
  expect(followers[1].username).toBe('user_b');
  expect(followers[1].is_verified).toBe(true);
});

test('getFollowers stops at maxPages even if token keeps coming', async () => {
  // Always returns a token — should stop after maxPages=2
  mockFetch({ body: { users: [{ id: '1', username: 'x' }], pagination_token: 'always' } });

  const followers = await makeProvider().getFollowers({ maxPages: 2 });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(followers).toHaveLength(2);
});

// ── Posts ──────────────────────────────────────────────────────────────────

test('getPosts parses posts and tolerates null seen field', async () => {
  mockFetch({
    body: {
      items: [
        {
          id: 'p1',
          code: 'ABC123',
          taken_at: 1718000000,
          like_count: 340,
          comment_count: 12,
          play_count: null,
          caption: { text: 'Big launch!' },
          is_video: false,
          thumbnail_url: 'https://example.com/thumb.jpg',
          seen: null, // commonly null for reels
        },
      ],
      pagination_token: null,
    },
  });

  const posts = await makeProvider().getPosts();
  expect(posts).toHaveLength(1);
  expect(posts[0].shortcode).toBe('ABC123');
  expect(posts[0].caption).toBe('Big launch!');
  expect(posts[0].seen).toBeNull();
  expect(posts[0].like_count).toBe(340);
});

// ── Error handling ─────────────────────────────────────────────────────────

test('_post retries on 429 and eventually throws', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false, status: 429, json: () => Promise.resolve({}), text: () => Promise.resolve(''),
  });
  // Speed up the test by mocking setTimeout
  jest.useFakeTimers();
  const provider = makeProvider();
  const promise = provider.getUserInfo();
  // Flush all timers/promises across retries
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    jest.runAllTimers();
    await Promise.resolve();
  }
  await expect(promise).rejects.toThrow('Rate limited by RapidAPI (429)');
  jest.useRealTimers();
});

test('_post throws a clear error on non-200/non-429 status', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false, status: 403, json: () => Promise.resolve({}), text: () => Promise.resolve('Forbidden'),
  });

  await expect(makeProvider().getUserInfo()).rejects.toThrow('RapidAPI error 403');
});

test('constructor throws when RAPIDAPI_KEY is missing', () => {
  expect(() => new RapidApiInstagramProvider({ username: 'x' })).toThrow('RAPIDAPI_KEY is required');
});
