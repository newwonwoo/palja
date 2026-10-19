const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const dir=process.env.QA_DIR||'/tmp/palja-appearance-qa';fs.mkdirSync(dir,{recursive:true});
const url=process.env.QA_URL||'http://127.0.0.1:8765/';
const errors=[],checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
async function state(p){return p.evaluate(()=>new Promise((resolve,reject)=>{const o=indexedDB.open('saju-vault',1);o.onsuccess=()=>{const db=o.result,r=db.transaction('state').objectStore('state').get('vault');r.onsuccess=()=>{db.close();resolve(JSON.parse(r.result.json))};r.onerror=()=>reject(r.error)};o.onerror=()=>reject(o.error)}));}
async function settled(p){for(let n=0;n<200;n++){if(await p.getByLabel('글꼴',{exact:true}).isEnabled())return;await new Promise(r=>setTimeout(r,25));}throw new Error('appearance persistence did not finish');}
async function settings(p){await p.getByRole('button',{name:'설정',exact:true}).click();await p.getByRole('heading',{name:'나의 화면'}).waitFor();}
async function importFile(p,file){await p.locator('input[type=file][accept=".json,application/json"]').setInputFiles(file);await p.getByRole('dialog',{name:'가져오기 확인'}).getByRole('button',{name:'가져오기',exact:true}).click();await p.getByRole('dialog',{name:'가져오기 확인'}).waitFor({state:'hidden'});}
async function openChart(p){await p.getByRole('button',{name:'보관함',exact:true}).click();await p.locator('.ref-person').filter({hasText:'화면 검사'}).click();await p.locator('.rr-six').waitFor();}
(async()=>{
 const model=await import(pathToFileURL(path.resolve(__dirname,'../../src/vault/model.js')).href);
 const actions=await import(pathToFileURL(path.resolve(__dirname,'../../src/vault/workspace-actions.js')).href);
 let legacy=actions.saveGroup(model.upsertEntry(model.createEmptyVault(),{name:'화면 검사',memo:'기존 메모',birth:{input_year:2000,input_month:2,input_day:29,input_hour:13,input_minute:45,calendar_type:'solar',lunar_leap_month:false,time_status:'known',sex:'male'}}),{name:'검사 그룹'});
 delete legacy.workspace.preferences.appearance;
 fs.writeFileSync(dir+'/legacy.json',JSON.stringify(model.createBackup(legacy)));
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},locale:'ko-KR'});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
  await p.goto(url);await settings(p);await importFile(p,dir+'/legacy.json');
  check('legacy backup loads default design',await p.getByLabel('글꼴',{exact:true}).inputValue()==='sans');
  await p.getByLabel('강조 색상',{exact:true}).fill('#8357a9');await settled(p);
  await p.getByLabel('글꼴',{exact:true}).selectOption('serif');await settled(p);
  await p.getByLabel('글자 크기',{exact:true}).selectOption('large');await settled(p);
  await p.getByLabel('명식 카드 모양',{exact:true}).selectOption('outline');await settled(p);
  for(const label of ['십성 표시','지장간 표시','12운성 표시']){await p.getByLabel(label,{exact:true}).uncheck();await settled(p);}
  const saved=await state(p);
  check('only presentation changed',JSON.stringify(saved.entries)===JSON.stringify(legacy.entries)&&JSON.stringify(saved.workspace.groups)===JSON.stringify(legacy.workspace.groups));
  check('custom color and font persisted',saved.workspace.preferences.appearance.accent==='#8357a9'&&saved.workspace.preferences.appearance.font==='serif');
  await p.reload();await p.getByRole('heading',{name:'나의 화면'}).waitFor();
  check('design survives full reopen',await p.getByLabel('글꼴',{exact:true}).inputValue()==='serif'&&await p.getByLabel('글자 크기',{exact:true}).inputValue()==='large');
  for(const width of [320,390,800]){await p.setViewportSize({width,height:900});check('settings fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.setViewportSize({width:390,height:844});await p.locator('.personal-settings').screenshot({path:dir+'/settings.png'});
  const download=p.waitForEvent('download');await p.getByRole('button',{name:/백업 내보내기/}).first().click();await (await download).saveAs(dir+'/backup.json');
  await openChart(p);check('display switches hide only requested rows',await p.locator('.rr-six .rr-hidden,.rr-six .rr-growth,.rr-six .rr-gods').count()===0);
  check('four natal stem and branch glyphs remain',await p.locator('.rr-six .rr-rune').count()>=8);
  check('font applies to glyphs',await p.locator('.rr-six .rr-rune strong').first().evaluate(e=>getComputedStyle(e).fontFamily.includes('Batang')));
  for(const width of [320,390,800]){await p.setViewportSize({width,height:900});check('chart fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:dir+'/chart.png'});
  await p.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'관리',exact:true}).click();await settings(p);
  await p.context().setOffline(true);await p.getByLabel('명식 카드 모양',{exact:true}).selectOption('plain');await settled(p);
  check('offline changes persist',(await state(p)).workspace.preferences.appearance.cardStyle==='plain');
  await p.context().setOffline(false);await openChart(p);
  const colors=await p.locator('.rr-six .rr-rune').evaluateAll(nodes=>nodes.map(e=>({text:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})));
  check('plain card keeps visible glyph text',colors.every(c=>c.text!=='rgb(255, 255, 255)'));
  await p.getByRole('navigation',{name:'명식 주 메뉴'}).getByRole('button',{name:'관리',exact:true}).click();await settings(p);
  await p.getByRole('button',{name:'화면 설정 초기화',exact:true}).click();await settled(p);
  check('reset retains original entries',JSON.stringify((await state(p)).entries)===JSON.stringify(legacy.entries));
  const fresh=await browser.newPage({viewport:{width:390,height:844}});await fresh.goto(url);await settings(fresh);await importFile(fresh,dir+'/backup.json');
  check('backup restores presentation in a fresh store',(await state(fresh)).workspace.preferences.appearance.accent==='#8357a9');
  check('no runtime errors',errors.length===0);
  fs.writeFileSync(dir+'/results.json',JSON.stringify({checks,errors,environment:{url,viewports:[320,390,800],browser:'Playwright Chromium',fallback:'Browser extension tool absent; CUA cloud localhost connection refused'}},null,2));
  console.log('PASS appearance:',checks.length);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
