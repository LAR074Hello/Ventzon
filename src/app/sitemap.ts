import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.ventzon.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/get-started`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/content-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
