const { test, expect } = require('@playwright/test');

async function openDailyDuel(page, signedIn) {
  await page.addInitScript((user) => {
    window.__TEST_USER = user ? { id: '00000000-0000-4000-8000-000000000001' } : null;
    window.__RPC_CALLS = [];
  }, signedIn);
  await page.route('https://**/*', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:window.__TEST_USER},error:null})},rpc:async(name,args)=>{window.__RPC_CALLS.push({name,args});if(name==='submit_daily_duel_score')return {data:[{saved_score:args.p_score,played_on:'2026-11-26',already_submitted:false}],error:null};if(name==='get_daily_duel_leaderboard')return {data:[{rank:1,username:'Test Player',score:args?.score??5,played_on:'2026-11-26'}],error:null};return {data:[],error:null};}})};`
    })
  );
  let viewCount = 100;
  await page.route('https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/**', route => {
    viewCount += 37;
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ views: viewCount }] })
    });
  });
  await page.goto('/challenge.html');
}

async function completeFiveQuestions(page) {
  for (let i = 0; i < 5; i++) {
    const choice = page.locator('[data-choice]').first();
    await expect(choice).toBeVisible({ timeout: 15000 });
    await choice.click();
    if (i < 4) await page.waitForTimeout(1000);
  }
  await expect(page.locator('.duel-result')).toBeVisible({ timeout: 10000 });
}

test('guest can complete all five Daily Duel questions without account submission', async ({ page }) => {
  await openDailyDuel(page, false);
  await completeFiveQuestions(page);
  await expect(page.locator('#duel-account-status')).toContainText('Sign in to save');
  expect(await page.evaluate(() => window.__RPC_CALLS.length)).toBe(0);
});

test('signed-in player submits one account score and sees the daily account board', async ({ page }) => {
  await openDailyDuel(page, true);
  await completeFiveQuestions(page);
  await expect(page.locator('#duel-account-status')).toContainText('saved to your account');
  await expect(page.locator('#duel-leaderboard')).toContainText('Test Player');
  const calls = await page.evaluate(() => window.__RPC_CALLS);
  expect(calls.map(call => call.name)).toContain('submit_daily_duel_score');
  expect(calls.map(call => call.name)).toContain('get_daily_duel_leaderboard');
  expect(calls.find(call => call.name === 'submit_daily_duel_score').args.p_score).toBeGreaterThanOrEqual(0);
  expect(calls.find(call => call.name === 'submit_daily_duel_score').args.p_score).toBeLessThanOrEqual(5);
});
