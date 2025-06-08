/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle react-icons
    config.module.rules.push({
      test: /react-icons\/.*/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
        },
      },
    });
    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 