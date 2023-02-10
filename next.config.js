const webpack = require("next/dist/compiled/webpack/bundle5")().webpack;

// console.log(webpack)

// console.log(webpack.ContextReplacementPlugin);
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    reactStrictMode: false,
    webpack: (config) => {
        config.resolve.fallback = {
            "utf-8-validate": false,
            bufferutil: false,
            canvas: false,
            child_process: false,
            fs: false,
            net: false,
            perf_hooks: false,
            tls: false,
        };
        return config;
    },
};

module.exports = nextConfig;
