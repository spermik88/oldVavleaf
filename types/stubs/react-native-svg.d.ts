/*
 * Заглушка типов для react-native-svg.
 * Нужна для корректной компиляции на web.
 */
declare module 'react-native-svg/lib/typescript/*' {
  const anyExport: any;
  export default anyExport;
}
