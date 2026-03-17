/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.beterbat.com',
      },
    ],
  },
}

export default nextConfig
