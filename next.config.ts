import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(self)" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "sharp", "india-pincode"],
  // india-pincode reads its data file at run time; make sure the file ships with the route.
  outputFileTracingIncludes: { "/v1/places/pincode/[pin]": ["./node_modules/india-pincode/data/**", "./node_modules/.pnpm/india-pincode@*/node_modules/india-pincode/data/**"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private API answers are never stored by browsers or shared caches.
      { source: "/v1/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
