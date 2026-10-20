export const READING_TABS=Object.freeze({overview:'분석',relations:'사주',luck:'운세',compare:'궁합'});
export const DEFAULT_READING_ORDER=Object.freeze(Object.keys(READING_TABS));
export function validReadingOrder(value){
 return Array.isArray(value)&&value.length===4&&new Set(value).size===4&&value.every(k=>typeof k==='string'&&Object.hasOwn(READING_TABS,k));
}
export function moveReadingTab(order,key,offset){
 const index=order.indexOf(key),next=index+offset;
 if(!validReadingOrder(order)||![-1,1].includes(offset)||index<0||next<0||next>=order.length)return [...order];
 const result=[...order];[result[index],result[next]]=[result[next],result[index]];return result;
}
