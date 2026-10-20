const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const dir=process.env.QA_DIR||'/tmp/palja-completion-qa';
fs.mkdirSync(dir,{recursive:true});
const checks=[],errors=[];
let browser,page;
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
async function state(){return page.evaluate(()=>new Promise((resolve,reject)=>{
 const open=indexedDB.open('saju-vault',1);
 open.onsuccess=()=>{const db=open.result,request=db.transaction('state').objectStore('state').get('vault');request.onsuccess=()=>{db.close();resolve(JSON.parse(request.result.json));};request.onerror=()=>reject(request.error);};open.onerror=()=>reject(open.error);
}));}
async function saved(predicate){for(let i=0;i<60;i++){const value=await state();if(predicate(value))return value;await page.waitForTimeout(50);}assert.fail('Expected saved state did not appear');}
async function reading(tab){await page.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'풀이',exact:true}).click();await page.getByRole('tab',{name:tab,exact:true}).click();}
async function settings(){await page.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'관리',exact:true}).click();await page.getByRole('button',{name:'설정',exact:true}).click();}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE||undefined,args:['--no-sandbox']});
 const context=await browser.newContext({locale:'ko-KR',viewport:{width:390,height:844}});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const url=process.env.QA_URL||'http://127.0.0.1:8765/';
 await page.goto(url);await page.getByRole('button',{name:'커스텀',exact:true}).waitFor();
 check('page identity',await page.title()==='사주 보관함'&&page.url().startsWith(url));
 check('nonblank app and no framework overlay',await page.getByTestId('reference-vault').count()===1&&await page.locator('vite-error-overlay').count()===0);
 const seed=JSON.parse(fs.readFileSync(dir+'/seed.json','utf8'));
 await page.evaluate(seed=>new Promise((resolve,reject)=>{const open=indexedDB.open('saju-vault',1);open.onsuccess=()=>{const db=open.result,t=db.transaction('state','readwrite');t.objectStore('state').put({json:JSON.stringify(seed),revision:seed.revision},'vault');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};open.onerror=()=>reject(open.error);}),seed);
 await page.reload();await page.getByRole('button',{name:'설정',exact:true}).click();
 const display=page.getByRole('region',{name:'명식 표시와 디자인'});
 await display.getByLabel('지장간 표시',{exact:true}).uncheck();await saved(s=>s.workspace.presentation.hidden===false);
 await display.getByLabel('나이 기준',{exact:true}).selectOption('counting');await saved(s=>s.workspace.presentation.ageMode==='counting');
 await display.getByLabel('오행 색상',{exact:true}).selectOption('custom');await saved(s=>s.workspace.presentation.palette==='custom');
 await display.getByLabel('목 색상',{exact:true}).fill('#123456');await saved(s=>s.workspace.presentation.elementColors.wood==='#123456');
 await display.getByLabel('글꼴',{exact:true}).selectOption('serif');await saved(s=>s.workspace.presentation.fontFamily==='serif');
 await display.getByLabel('목록 배열',{exact:true}).selectOption('cards');await saved(s=>s.workspace.presentation.listLayout==='cards');
 await display.getByRole('button',{name:'궁합 위로',exact:true}).click();await saved(s=>s.workspace.presentation.tabOrder[2]==='compare');
 await page.reload();check('presentation survives reload',(await display.getByLabel('오행 색상').inputValue())==='custom');
 await page.locator('.toast').waitFor({state:'hidden'});await page.screenshot({path:dir+'/settings-390.png'});
 await page.getByRole('button',{name:'보관함',exact:true}).click();check('card layout applied',await page.locator('.ref-card-layout').count()>0);check('counting age appears in actual list',await page.locator('.ref-person').filter({hasText:'합성 명식 가'}).first().locator('.ref-age').innerText()===String(new Date().getFullYear()-2000+1));
 await page.getByRole('button',{name:/합성 명식 가/}).first().click();check('hidden-stem display toggle applied',await page.locator('.rr-chart-page .rr-hidden').count()===0);
 await reading('분석');await page.getByRole('region',{name:'독립 규칙 상세 분석'}).waitFor();check('saved tab order appears in actual navigation',JSON.stringify(await page.getByRole('tab').allTextContents())===JSON.stringify(['분석','사주','궁합','운세']));check('saved font reaches the reader',await page.locator('.reference-reader').evaluate(e=>getComputedStyle(e).fontFamily.includes('serif')));check('custom diagram text contrast',await page.locator('.rr-element-diagram g[data-tone=metal] text').first().evaluate(e=>getComputedStyle(e).fill==='rgb(17, 17, 17)'));
 await page.getByRole('button',{name:'합화 비중',exact:true}).click();
 await page.getByLabel('천간 합화',{exact:true}).selectOption('seasonal');await saved(s=>s.workspace.integrated.rules.combinationMode==='seasonal');
 await page.getByLabel('격국 기준',{exact:true}).selectOption('revealed');await saved(s=>s.workspace.integrated.rules.patternMode==='revealed');
 await page.getByLabel('신살 기준',{exact:true}).selectOption('year');await saved(s=>s.workspace.integrated.rules.sinsalBasis==='year');
 check('five-layer climate exposes every contribution',await page.getByRole('region',{name:'5계층 조후 근거'}).locator('tbody tr').count()===5);check('nine-column relation table',await page.locator('.rr-relation-columns').first().locator(':scope > div').count()===9);
 await page.screenshot({path:dir+'/research-390.png'});
 await reading('운세');await page.getByText('운세 트리에서 날짜·시각 선택',{exact:true}).click();await page.getByRole('region',{name:'운세 트리와 일별 분석'}).locator('.completion-filter button:enabled').first().click();await saved(s=>s.workspace.integrated.selection?.date.endsWith('-07-01'));check('decade click applies its actual start-year selection',true);await page.getByText('운세 트리에서 날짜·시각 선택',{exact:true}).click();await page.getByLabel('운 선택일',{exact:true}).fill('2024-02-29');await page.getByLabel('운 선택시각',{exact:true}).fill('23:15');await page.getByRole('button',{name:'일·시운 적용 및 저장',exact:true}).click();await saved(s=>s.workspace.integrated.selection.date==='2024-02-29');
 await page.getByText('운세 트리에서 날짜·시각 선택',{exact:true}).click();await page.getByLabel('트리 월운',{exact:true}).selectOption('6');await saved(s=>s.workspace.integrated.selection.date==='2024-06-15');
 await page.getByRole('button',{name:'일별 운세 달력 열기',exact:true}).click();check('daily calendar computed',await page.getByRole('region',{name:'운세 트리와 일별 분석'}).getByRole('button',{name:/01일/}).count()===1);
 await page.getByText('월별 오행 비율 타임라인',{exact:true}).click();check('monthly element chart',await page.getByRole('img',{name:'12개월 오행 비율 변화'}).count()===1);
 await page.reload();await reading('운세');check('selected date persists',(await page.getByLabel('운 선택일').inputValue())==='2024-06-15');
 await settings();await page.getByRole('button',{name:'보관함',exact:true}).click();await page.getByRole('button',{name:/합성 명식 나/}).first().click();await reading('운세');await page.getByLabel('운 선택일',{exact:true}).fill('2025-07-01');await page.getByRole('button',{name:'일·시운 적용 및 저장'}).click();await saved(s=>s.workspace.integrated.selections.length===2);
 await settings();await page.getByRole('button',{name:'보관함',exact:true}).click();await page.getByRole('button',{name:/합성 명식 가/}).first().click();await reading('운세');check('each person retains independent selection',(await page.getByLabel('운 선택일').inputValue())==='2024-06-15');
 await context.setOffline(true);await page.getByText('운세 트리에서 날짜·시각 선택',{exact:true}).click();await page.getByLabel('트리 시운').selectOption('8');await saved(s=>s.workspace.integrated.selection.hour===8);check('offline mutation persisted',true);await context.setOffline(false);
 await reading('궁합');await page.getByLabel('비교할 명식').selectOption(seed.entries[1].id);await page.getByRole('region',{name:'궁합 구성과 비중'}).waitFor();await page.getByLabel('궁합 합 비중',{exact:true}).fill('2');await page.getByRole('button',{name:'궁합 비중 저장',exact:true}).click();await saved(s=>s.workspace.integrated.rules.matchWeights.combine===2);check('compatibility computation and tuning persisted',true);
 await settings();await page.getByRole('button',{name:'공개 인물 자료 · 출처와 함께 추가'}).click();await page.getByLabel('공개 인물 검색').fill('앨런');await page.getByRole('button',{name:'근거와 함께 보관함에 추가'}).click();await saved(s=>s.entries.length===3);check('source-backed public profile keeps birth hour unknown',(await state()).entries.at(-1).birth.input_hour===null);
 await settings();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:/백업 내보내기/}).click();const download=await downloadPromise;await download.saveAs(dir+'/backup.json');const backup=JSON.parse(fs.readFileSync(dir+'/backup.json','utf8'));check('full JSON backup includes presentation rules selections and provenance',backup.state.workspace.presentation.palette==='custom'&&backup.state.workspace.integrated.selections.length===2&&backup.state.entries[2].birth.public_profile.id==='turing');
 for(const width of [320,390,800]){await page.setViewportSize({width,height:900});check('settings no page overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.getByRole('button',{name:'보관함',exact:true}).click();await page.getByRole('button',{name:/합성 명식 가/}).first().click();await reading('분석');
 await page.locator('.toast').waitFor({state:'hidden'});for(const width of [320,390,800]){await page.setViewportSize({width,height:900});check('analysis contains horizontal tables '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:dir+'/research-'+width+'.png'});}
 check('no console/runtime errors',errors.length===0);
 fs.writeFileSync(dir+'/completion-results.json',JSON.stringify({checks,errors},null,2));console.log('PASS completion extension',checks.length);await browser.close();
})().catch(async error=>{console.error(error);fs.writeFileSync(dir+'/completion-results.json',JSON.stringify({checks,errors,error:error.message},null,2));await page?.screenshot({path:dir+'/failure.png'}).catch(()=>{});await browser?.close();process.exitCode=1;});
