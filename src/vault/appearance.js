/** Device-local presentation only. It never changes birth data or calculation policy. */
export const DEFAULT_APPEARANCE = Object.freeze({
  accent: '#6d89b5', font: 'sans', textSize: 'normal', cardStyle: 'soft',
  tenGods: true, hiddenStems: true, growth: true,
});
export const FONT_OPTIONS = Object.freeze({sans: '기본 고딕', serif: '명조'});
export const TEXT_SIZE_OPTIONS = Object.freeze({normal: '기본', comfortable: '조금 크게', large: '크게'});
export const CARD_STYLE_OPTIONS = Object.freeze({soft: '부드럽게', outline: '테두리', plain: '간결하게'});
export function appearanceErrors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return ['invalid appearance'];
  const keys = Object.keys(DEFAULT_APPEARANCE);
  if (Object.keys(value).length !== keys.length || Object.keys(value).some(k => !keys.includes(k))) return ['invalid appearance keys'];
  const errors = [];
  if (typeof value.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.accent)) errors.push('invalid accent');
  for (const [key, options] of [['font', FONT_OPTIONS], ['textSize', TEXT_SIZE_OPTIONS], ['cardStyle', CARD_STYLE_OPTIONS]]) {
    if (!Object.hasOwn(options, value[key])) errors.push('invalid ' + key);
  }
  for (const key of ['tenGods', 'hiddenStems', 'growth']) if (typeof value[key] !== 'boolean') errors.push('invalid ' + key);
  return errors;
}
export function appearanceStyle(value) {
  const a = {...DEFAULT_APPEARANCE, ...value};
  const channels = a.accent.slice(1).match(/../g).map(hex => parseInt(hex,16)/255).map(c => c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4);
  const luminance = channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  const font = a.font === 'serif' ? "'Noto Serif CJK KR', 'Batang', serif" : "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', 'Malgun Gothic', sans-serif";
  return {'--personal-accent': a.accent, '--personal-on-accent': luminance>0.179 ? '#000000' : '#ffffff', '--personal-tint': a.accent + '18', '--personal-font': font,
    '--personal-size': {normal: '14px', comfortable: '16px', large: '18px'}[a.textSize],
    '--personal-reader-size': {normal: '15px', comfortable: '17px', large: '19px'}[a.textSize]};
}
