import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    settings: {
      // eslint-plugin-react auto-detects the React version via context.getFilename(),
      // which was removed in ESLint 10. Declaring the version skips the detection.
      react: {version: "19.3"},
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
