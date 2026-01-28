// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'pink',
      neutral: 'slate'
    },
    button: {
      slots: {
        base: 'transition-all duration-200 font-bold active:scale-95 italic',
        root: 'rounded-xl'
      },
      variants: {
        variant: {
          solid: 'shadow-lg shadow-pink-500/20 text-white',
          ghost: 'hover:bg-pink-500/10'
        }
      }
    },
    card: {
      slots: {
        root: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl ring-0'
      }
    },
    input: {
      slots: {
        root: 'rounded-lg bg-slate-900/50 border-slate-800 focus-within:ring-2 focus-within:ring-pink-500'
      }
    }
  }
})