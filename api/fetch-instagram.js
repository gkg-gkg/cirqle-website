#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');
const { RapidApiInstagramProvider } = require('./instagram/rapidapi');

async function main() {
  const provider = new RapidApiInstagramProvider();
  console.log(`Fetching Instagram data for @${provider.username}…`);

  const [userInfo, followers, following, posts] = await Promise.all([
    provider.getUserInfo(),
    provider.getFollowers({ maxPages: 2, amount: 50 }),
    provider.getFollowing({ maxPages: 2, amount: 50 }),
    provider.getPosts({ maxPages: 2, amount: 12 }),
  ]);

  const output = {
    fetched_at: new Date().toISOString(),
    user: userInfo,
    followers: { count: followers.length, list: followers },
    following: { count: following.length, list: following },
    posts:     { count: posts.length,     list: posts     },
  };

  const outPath = path.join(__dirname, '..', 'instagram-data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`✓ Saved to instagram-data.json`);
  console.log(`  User:      @${userInfo.username} — ${userInfo.follower_count?.toLocaleString()} followers`);
  console.log(`  Followers: ${followers.length} fetched`);
  console.log(`  Following: ${following.length} fetched`);
  console.log(`  Posts:     ${posts.length} fetched`);
}

main().catch(err => {
  console.error('✗', err.message);
  process.exit(1);
});
