/*
 * Заглушка типов для react-native-screens.
 * Используется при компиляции без полной библиотеки.
 */
declare module 'react-native-screens/lib/typescript/*' {
  const anyExport: any;
  export default anyExport;
}
