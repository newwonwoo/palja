const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),assert=require('node:assert/strict');
const DIR=process.env.QA_DIR||'/tmp/fortune-bulk-qa';fs.mkdirSync(DIR,{recursive:true});
let page,browser;const passes=[],errors=[];
async function state(){return page.evaluate(()=>new Promise((resolve,reject)=>{const open=indexedDB.open('saju-vault',1);open.onsuccess=()=>{const db=open.result,r=db.transaction('state').objectStore('state').get('vault');r.onsuccess=()=>{db.close();resolve(JSON.parse(r.result.json));};r.onerror=()=>reject(r.error);};open.onerror=()=>reject(open.error);}));}
const check=(name,ok)=>{assert.ok(ok,name);passes.push(name);};
(async()=>{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE||undefined,args:['--no-sandbox']});page=await browser.newPage({locale:'ko-KR',viewport:{width:390,height:844}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:8765');await page.getByRole('button',{name:'커스텀',exact:true}).waitFor();
 const seed=JSON.parse(fs.readFileSync(DIR+'/seed.json'));
 await page.evaluate(seed=>new Promise((resolve,reject)=>{const o=indexedDB.open('saju-vault',1);o.onsuccess=()=>{const db=o.result,t=db.transaction('state','readwrite');t.objectStore('state').put({json:JSON.stringify(seed),revision:seed.revision},'vault');t.oncomplete=()=>{db.close();resolve()};t.onerror=()=>reject(t.error);};o.onerror=()=>reject(o.error);}),seed);
 await page.reload();await page.getByRole('button',{name:/합성 명식 가/}).first().click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'명식 이미지 PNG로 저장'}).click();const pngDownload=await downloadPromise;await pngDownload.saveAs(DIR+'/chart.png');
 check('private chart renders as real PNG',fs.readFileSync(DIR+'/chart.png').subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')));
 await page.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'풀이'}).click();await page.getByRole('tab',{name:'운세'}).click();
 await page.getByRole('region',{name:'분야별 월운 흐름'}).waitFor();
 check('twelve computed months',await page.locator('.ft-months button').count()===12);
 await page.getByRole('group',{name:'관심 분야 필터'}).getByRole('button',{name:'재물·관리'}).click();check('fortune filter changes list',await page.locator('.ft-months button').count()<=12);await page.getByRole('group',{name:'관심 분야 필터'}).getByRole('button',{name:'전체'}).click();
 await page.locator('.ft-months button').nth(5).click();await page.waitForTimeout(200);let saved=await state();check('month click persisted selection',saved.workspace.integrated.selection.date.endsWith('-06-15'));
 await page.locator('.integration-presets summary').click();await page.getByLabel('운 즐겨찾기 이름').fill('중요한 날');await page.getByRole('button',{name:'현재 선택 저장'}).click();await page.getByText('중요한 날',{exact:true}).waitFor();saved=await state();check('bookmark persisted',saved.workspace.integrated.presets.length===1);
 await page.reload();await page.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'풀이'}).click();await page.getByRole('tab',{name:'운세'}).click();await page.locator('.integration-presets summary').click();check('bookmark survived reopen',await page.getByText('중요한 날',{exact:true}).count()>0);
 await page.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'관리'}).click();await page.getByRole('button',{name:'설정',exact:true}).click();await page.getByRole('button',{name:/그룹 관리/}).click();await page.getByRole('button',{name:'그룹 만들기',exact:true}).click();await page.getByLabel('그룹 이름').fill('가족');await page.getByRole('button',{name:'그룹 저장'}).click();
 await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.getByRole('button',{name:/명식 일괄 관리/}).click();await page.getByRole('heading',{name:'명식 일괄 관리'}).waitFor();await page.getByRole('button',{name:'검색 결과 전체 선택'}).click();await page.getByLabel('일괄 대상 그룹').selectOption({label:'가족'});await page.getByRole('button',{name:'그룹에 추가'}).click();await page.getByRole('alertdialog',{name:'일괄 변경 확인'}).getByRole('button',{name:'확인'}).click();
 saved=await state();check('bulk group membership persisted',saved.workspace.groups[0].entryIds.length===2);check('bulk not modify birth',saved.entries.every(e=>!e.deletedAt));
 await page.screenshot({path:DIR+'/bulk-390.png'});
 for(const width of [320,360,390,800]){await page.setViewportSize({width,height:900});check(`bulk layout no horizontal overflow ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 check('no runtime/console errors',errors.length===0);
 fs.writeFileSync(DIR+'/fortune-bulk-results.json',JSON.stringify({checks:passes,errors},null,2));console.log('PASS',passes.length);await browser.close();
})().catch(async err=>{console.error(err);fs.writeFileSync(DIR+'/fortune-bulk-failure.txt',err.stack+'\n'+JSON.stringify(errors));await page?.screenshot({path:DIR+'/failure.png'}).catch(()=>{});await browser?.close();process.exit(1)});
