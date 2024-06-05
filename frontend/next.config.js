/** @type {import('next').NextConfig} */

module.exports = {
    async rewrites() {
      return [
        {
          source: `/api/:path*`,
          destination: `${process.env.API_URL}/:path*`, // Proxy to Backend
        },
      ]
    },
  }
