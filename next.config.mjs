/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fonts are loaded with a plain <link> in the layout. Turning off Next's
  // build-time font inlining keeps the build free of a network dependency.
  optimizeFonts: false,
};
export default nextConfig;
