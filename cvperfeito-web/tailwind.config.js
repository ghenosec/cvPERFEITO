module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#C1121F',
          secondary: '#E63946',
          hover: '#FF6B6B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F8F8',
          border: '#E5E7EB',
        },
        ink: {
          DEFAULT: '#111827',
          muted: '#6B7280',
        },
        state: {
          success: '#22C55E',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
