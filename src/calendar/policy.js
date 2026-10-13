export const DEFAULT_POLICY = Object.freeze({version:1,engine:'astronomical-v1',zone:'Asia/Seoul',offsetMinutes:540,clock:'standard',longitude:127,dayBoundary:'midnight',yearBoundary:'lichun',fold:'reject'});
export function validatePolicy(p) {
  const errors=[];
  if (!p || typeof p!=='object' || Array.isArray(p)) return ['계산 정책이 올바르지 않습니다.'];
  if(p.version!==1||p.engine!=='astronomical-v1')errors.push('지원하지 않는 계산 정책입니다.');
  if(Object.keys(p).some(k=>!Object.hasOwn(DEFAULT_POLICY,k)))errors.push('알 수 없는 계산 옵션입니다.');
  for(const [k,allowed] of [['zone',['Asia/Seoul','fixed']],['clock',['standard','mean-solar','apparent-solar']],['dayBoundary',['midnight','zi23']],['yearBoundary',['lichun','jan1']],['fold',['reject','earlier','later']]])if(!allowed.includes(p[k]))errors.push('계산 옵션 확인: '+k);
  if(!Number.isFinite(p.longitude)||p.longitude< -180||p.longitude>180)errors.push('경도 범위는 -180~180도입니다.');
  if(!Number.isInteger(p.offsetMinutes)||p.offsetMinutes< -720||p.offsetMinutes>840)errors.push('UTC 차이는 -720~840분입니다.');
  return errors;
}
