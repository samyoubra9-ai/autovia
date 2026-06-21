import type { NextConfig } from "next";

function candidatOrigin(): string {
  const url =
    process.env.NEXT_PUBLIC_CANDIDAT_URL?.trim() || "http://localhost:5174";
  return url.replace(/\/$/, "");
}

const chromiumTrace = ["./node_modules/@sparticuz/chromium/**"];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/v1/eleves/[id]/fiche-avancement/pdf/route": [
      "./lib/fiche-avancement-print/**/*",
      ...chromiumTrace,
    ],
    "/api/v1/listes-examen/[id]/pdf/route": [...chromiumTrace],
  },
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
