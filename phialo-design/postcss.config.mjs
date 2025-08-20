import postcssPresetEnv from 'postcss-preset-env';
import purgecss from '@fullhuman/postcss-purgecss';

const config = {
  plugins: [
    postcssPresetEnv({
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
      },
    }),
    // Only purge CSS in production builds
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: [
              './src/**/*.{astro,html,js,jsx,ts,tsx,vue}',
              './public/**/*.html',
            ],
            defaultExtractor: (content) => {
              // Capture Tailwind classes including those with special characters
              const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
              const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
              return broadMatches.concat(innerMatches);
            },
            safelist: {
              standard: [
                /^(bg|text|border)-/,
                /^(w|h)-/,
                /^(m|p)(t|r|b|l|x|y)?-/,
                /^flex/,
                /^grid/,
                /^col-/,
                /^rounded/,
                /^shadow/,
                /^opacity/,
                /^transition/,
                /^duration/,
                /^ease/,
                /^scale/,
                /^rotate/,
                /^translate/,
                /^skew/,
                /^origin/,
                /^accent/,
                /^cursor/,
                /^select/,
                /^sr-only/,
                /^not-sr-only/,
              ],
              deep: [
                /^(hover|focus|active|disabled|group-hover):/,
                /^(sm|md|lg|xl|2xl):/,
                /^dark:/,
              ],
              greedy: [
                /aspect-/,
                /object-/,
              ],
            },
          }),
        ]
      : []),
  ],
};

export default config;