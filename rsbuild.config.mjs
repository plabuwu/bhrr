import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: "bhrr",
  },
  source: {
    entry: {
      index: "./frontend/main.jsx",
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
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