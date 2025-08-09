import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: "Editing Style Inspiration",
  },
  source: {
    entry: {
      index: "./app/main.jsx",
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["postcss-loader"],
        type: "css",
      },
    ],
  },
});