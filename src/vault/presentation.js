/** Optional namespace: old v1 backups remain valid without display settings. */
export const DISPLAY_DEFAULTS=Object.freeze({tenGods:true,hidden:true,growth:true,nayin:true,shinsal:true,ageMode:'full',palette:'classic',fontScale:1,fontFamily:'system',elementColors:Object.freeze({wood:'#21bd96',fire:'#fa5674',earth:'#ffdd3b',metal:'#e4eef0',water:'#3d464b'}),cardStyle:'plain',listLayout:'rows',tabOrder:Object.freeze(['overview','relations','luck','compare']),bannerOrder:Object.freeze(['me','favorites','friends'])});
export const readPresentation=state=>({...DISPLAY_DEFAULTS,...state.workspace?.presentation});
const permutation=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===b.length&&a.every(x=>b.includes(x));
export function presentationErrors(p){
 if(!p||typeof p!=='object'||Array.isArray(p))return ['표시 설정 형식 오류'];
 const errors=[];
 if(Object.keys(p).some(k=>!Object.hasOwn(DISPLAY_DEFAULTS,k)))errors.push('알 수 없는 표시 설정');
 for(const k of ['tenGods','hidden','growth','nayin','shinsal'])if(typeof p[k]!=='boolean')errors.push(k+' 표시 설정 오류');
 for(const [k,values] of Object.entries({ageMode:['full','counting','year'],palette:['classic','muted','contrast','custom'],cardStyle:['plain','outlined','soft'],listLayout:['rows','cards']}))if(!values.includes(p[k]))errors.push(k+' 설정 오류');
 if(p.fontFamily!==undefined&&!['system','serif','mono'].includes(p.fontFamily))errors.push('글꼴 설정 오류');
 if(p.elementColors!==undefined&&(!p.elementColors||Object.keys(p.elementColors).length!==5||Object.keys(DISPLAY_DEFAULTS.elementColors).some(k=>typeof p.elementColors[k]!=='string'||!/^#[0-9a-f]{6}$/i.test(p.elementColors[k]))))errors.push('오행 색상은 5개 HEX 색상이어야 합니다.');
 if(![1,1.15,1.3].includes(p.fontScale))errors.push('글자 크기 오류');
 for(const k of ['tabOrder','bannerOrder'])if(!permutation(p[k],DISPLAY_DEFAULTS[k]))errors.push(k+' 순서 오류');
 return errors;
}
export function presentationStyle(p){
 const style={'--display-scale':p.fontScale,'--display-font':p.fontFamily==='serif'?'serif':p.fontFamily==='mono'?'monospace':'-apple-system,BlinkMacSystemFont,sans-serif'};
 for(const [key,value] of Object.entries(p.elementColors)){
  style['--custom-'+key]=value;
  const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255),linear=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  const luminance=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
  style['--custom-'+key+'-text']=luminance>.179?'#111111':'#ffffff';
 }
 return style;
}
