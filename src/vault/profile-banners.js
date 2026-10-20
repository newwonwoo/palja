export const PROFILE_BANNERS=Object.freeze({my:'내 명식',current:'현재',birthday:'생일자'});
export const DEFAULT_PROFILE_BANNERS=Object.freeze({order:Object.freeze(Object.keys(PROFILE_BANNERS)),hidden:Object.freeze([])});
export function validProfileBanners(value){
 return value!==null&&typeof value==='object'&&!Array.isArray(value)
  &&Object.keys(value).every(k=>['order','hidden'].includes(k))
  &&Array.isArray(value.order)&&value.order.length===3&&new Set(value.order).size===3&&value.order.every(k=>Object.hasOwn(PROFILE_BANNERS,k))
  &&Array.isArray(value.hidden)&&new Set(value.hidden).size===value.hidden.length&&value.hidden.every(k=>Object.hasOwn(PROFILE_BANNERS,k))
  &&!(value.hidden.includes('my')&&value.hidden.includes('current'));
}
export function moveProfileBanner(value,key,offset){
 if(!validProfileBanners(value)||![-1,1].includes(offset))throw new Error('배너 순서를 확인해 주세요.');
 const order=[...value.order],i=order.indexOf(key),j=i+offset;
 if(i>=0&&j>=0&&j<order.length)[order[i],order[j]]=[order[j],order[i]];
 return {order,hidden:[...value.hidden]};
}
export function toggleProfileBanner(value,key){
 if(!validProfileBanners(value)||!Object.hasOwn(PROFILE_BANNERS,key))throw new Error('배너 종류를 확인해 주세요.');
 const hidden=value.hidden.includes(key)?value.hidden.filter(k=>k!==key):[...value.hidden,key];
 if(hidden.includes('my')&&hidden.includes('current'))throw new Error('내 명식과 현재를 모두 비활성화 할 수 없습니다.');
 return {order:[...value.order],hidden};
}
