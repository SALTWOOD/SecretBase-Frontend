// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'pink',
      neutral: 'slate'
    },
    button: {
      slots: {
        base: 'transition-all duration-200 font-bold active:scale-95',
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
        root: 'bg-(--ui-bg-elevated)/50 backdrop-blur-xl border border-(--ui-border) rounded-2xl shadow-2xl ring-0'
      }
    },
    input: {
      slots: {
        root: 'rounded-lg bg-(--ui-bg-elevated)/50 border-(--ui-border) focus-within:ring-2 focus-within:ring-(--ui-primary)'
      }
    }
  }
})
