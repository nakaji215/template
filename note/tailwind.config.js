module.exports = {
  mode: 'jit',  // Just-In-Time Compilerを有効化
  purge: ['./src/**/*.{js,ts,jsx,tsx}'],  // 使用されていないCSSを削除
  darkMode: false, // 'media'または'class'を指定可能
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
