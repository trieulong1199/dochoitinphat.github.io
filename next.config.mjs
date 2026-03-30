/** @type {import('next').NextConfig} */
const nextConfig = {
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
