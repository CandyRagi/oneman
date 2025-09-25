// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",                        // service worker output
  disable: process.env.NODE_ENV === "development", // disable in dev
  register: true,                        // auto-register service worker
  skipWaiting: true,                     // update SW immediately
  buildExcludes: [/middleware-manifest.json$/], // fix for Next.js >=13
  fallbacks: {
    image: "/icons/icon-512x512.png",    // offline fallback image
    document: "/offline.html",           // offline fallback page
  },
});

module.exports = withPWA({
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,             // optional: smoother reloads
  },
  images: {
    domains: ["res.cloudinary.com"],                         // add external domains if you load images
  },
});