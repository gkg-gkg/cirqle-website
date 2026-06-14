#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');
const { RapidApiInstagramProvider } = require('./instagram/rapidapi');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const provider = new RapidApiInstagramProvider();
  console.log(`Fetching Instagram data for @${provider.username}…`);

  // Sequential to avoid triggering rate limits across concurrent endpoints
  const userInfo  = await provider.getUserInfo();
  console.log(`  ✓ User info — ${userInfo.follower_count?.toLocaleString()} followers`);

  await delay(500);
  const followers = await provider.getFollowers({ maxPages: 2, amount: 50 });
  console.log(`  ✓ Followers — ${followers.length} fetched`);

  await delay(500);
  const following = await provider.getFollowing({ maxPages: 2, amount: 50 });
  console.log(`  ✓ Following — ${following.length} fetched`);

  await delay(500);
  const posts = await provider.getPosts({ maxPages: 2, amount: 12 });
  console.log(`  ✓ Posts     — ${posts.length} fetched`);

  await delay(500);
  const reels = await provider.getReels({ maxPages: 2, amount: 12 });
  console.log(`  ✓ Reels     — ${reels.length} fetched`);

  const output = {
    fetched_at: new Date().toISOString(),
    user:      userInfo,
    followers: { count: followers.length, list: followers },
    following: { count: following.length, list: following },
    posts:     { count: posts.length,     list: posts     },
    reels:     { count: reels.length,     list: reels     },
  };

  const outPath = path.join(__dirname, '..', 'instagram-data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✓ Saved to instagram-data.json`);
}

main().catch(err => {
  console.error('✗', err.message);
  process.exit(1);
});
