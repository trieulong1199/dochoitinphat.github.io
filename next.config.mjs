/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.larksuite.com',
      },
      {
        protocol: 'https',
        hostname: '**.feishu.cn',
      },
    ],
  },
}

export default nextConfig
