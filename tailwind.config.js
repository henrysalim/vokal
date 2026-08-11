
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        espresso: '#3E2E22',
        mustard: '#E8A33D',
        terracotta: '#C1592E',
        olive: '#74822F',
        cream: '#F0EAE0',
        surface: '#FFFFFF',
        'text-muted': '#6B5F52',
        warning: '#7A2E28',
      },
      fontFamily: {
        heading: ['PlusJakartaSans-Bold', 'sans-serif'],
        body: ['DMSans-Regular', 'sans-serif'],
        display: ['PlusJakartaSans-ExtraBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
