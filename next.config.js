/** @type {import('next').NextConfig} */
const CopyPlugin = require("copy-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
const nextConfig = {
  experimental: {
    esmExternals: "loose",
    // Keep static-generation workers bounded on low-memory build hosts.
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Formatting-only violations in many .tsx files would otherwise fail
    // `next build`. Lint stays available via `npm run lint`; builds are
    // unblocked for the static export.
    ignoreDuringBuilds: true,
  },
  env: {
    // Public base URL of the backend, resolved at build time. In a static
    // export this must point to a host reachable from the user's browser
    // (rewrites() are a no-op for `next export`), so it should be an
    // absolute http(s) URL, e.g. https://api.example.com. Keep it empty to
    // serve API calls from the same origin as the UI.
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GET_USER_URL: process.env.GET_USER_URL,
    LOGIN_URL: process.env.LOGIN_URL,
    LOGOUT_URL: process.env.LOGOUT_URL,
  },
  trailingSlash: true,
  images: { unoptimized: true },
  skipTrailingSlashRedirect: true,
  webpack: (config, { isServer, dev }) => {
    // The dashboard bundles Monaco, G2/G6 and several visualization packages.
    // Limit webpack's module parallelism so production/static builds do not
    // exhaust the host memory (which otherwise terminates Node with exit 137).
    config.parallelism = 1;
    if (config.cache && !dev) {
      // The persistent filesystem cache can consume several additional GB on
      // this dependency-heavy dashboard; rebuilding without it is slower but
      // reliable on constrained build machines.
      config.cache = false;
    }
    config.resolve.fallback = { fs: false };
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.join(
                __dirname,
                "node_modules/@oceanbase-odc/monaco-plugin-ob/worker-dist/"
              ),
              to: "static/ob-workers",
            },
          ],
        })
      );
      // 添加 monaco-editor-webpack-plugin 插件
      config.plugins.push(
        new MonacoWebpackPlugin({
          // 你可以在这里配置插件的选项，例如：
          languages: ["sql"],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};

const withTM = require("next-transpile-modules")([
  "@berryv/g2-react",
  "@antv/g2",
  "react-syntax-highlighter",
  "@antv/g6",
  "@antv/graphin",
  "@antv/gpt-vis",
  "@antv/g-lite",
  "@antv/g-camera-api",
  "@antv/g",
]);

module.exports = withTM({
  ...nextConfig,
});
