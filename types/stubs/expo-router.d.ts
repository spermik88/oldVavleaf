/*
 * Заглушка типов для expo-router.
 * Используется в tsconfig для путей build/.
 */
declare module 'expo-router/build/*' {
  const anyExport: any;
  export default anyExport;
}
