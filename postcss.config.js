export default {
  plugins: {
    // tailwindcss: {},
    // autoprefixer: {},
    "postcss-prefix-selector": {
      prefix: "#root",
      transform(prefix, selector) {
        // Safely ignore keyframes
        if (selector.startsWith("@keyframes")) return selector;
        // Safely ignore global @ rules
        if (selector.startsWith("@")) return selector;
        // Prefix everything else
        return `${prefix} ${selector}`;
      },
    },
  },
};
