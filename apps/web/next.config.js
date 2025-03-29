/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@obscuranet/shared",
    "@obscuranet/gpt-engine",
    "@obscuranet/zcore"
  ],
};

module.exports = nextConfig;
