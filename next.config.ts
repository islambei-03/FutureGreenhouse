import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** pdfkit читает .afm из node_modules; при бандлинге Next — ENOENT → 500 на /api/reports?format=pdf */
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
