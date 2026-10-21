const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE||undefined,args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}, locale:'ko-KR'});
    const failures=[];
    page.on('pageerror',err=>failures.push(err.message));
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
    const exit=page.getByRole('button',{name:'앱 종료',exact:true});
    await exit.waitFor({timeout:15000});
    assert.equal(await page.getByRole('button',{name:'목록 맨 위로'}).count(),0);
    await exit.click();
    await page.getByRole('status').getByText('브라우저에서는 이 탭을 직접 닫아 주세요.').waitFor({timeout:3000});
    assert.equal(await page.getByTestId('reference-vault').count(),1,'web preview remains open with an honest exit notice');
    assert.deepEqual(failures,[]);
    console.log('PASS: X click triggers exit action (browser fallback) and does not scroll or navigate');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
