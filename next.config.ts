import type { NextConfig } from "next";

function candidatOrigin(): string {
  const url =
    process.env.NEXT_PUBLIC_CANDIDAT_URL?.trim() || "http://localhost:5174";
  return url.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  async redirects() {
    const candidat = candidatOrigin();
    return [
      {
        source: "/suivi",
        destination: candidat,
        permanent: false,
      },
      {
        source: "/suivi/:code",
        destination: `${candidat}/s/:code`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
