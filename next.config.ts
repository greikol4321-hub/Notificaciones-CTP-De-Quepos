import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/onesignal-sw.js",
        destination:
          "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js",
      },
    ];
  },
};

export default nextConfig;
