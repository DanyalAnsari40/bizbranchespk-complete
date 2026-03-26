import { NextResponse } from "next/server";
import { urlEntry } from "@/lib/sitemap";
import { getBackendUrl } from "@/lib/api";

export const dynamic = 'force-static';
export const revalidate = 3600;

/**
 * GET /sitemap/pages.xml — Static pages, categories, cities, subcategories.
 * Indexable, canonical URLs only; no admin or duplicate filter URLs.
 */
export async function GET() {
  try {
    const urls: string[] = [];

    const staticPages: Array<{ path: string; changefreq: string; priority: string }> = [
      { path: "/", changefreq: "daily", priority: "1.0" },
      { path: "/search", changefreq: "daily", priority: "0.9" },
      { path: "/add", changefreq: "weekly", priority: "0.8" },
      { path: "/about", changefreq: "monthly", priority: "0.6" },
      { path: "/contact", changefreq: "monthly", priority: "0.6" },
      { path: "/privacy", changefreq: "yearly", priority: "0.5" },
      { path: "/terms", changefreq: "yearly", priority: "0.5" },
      { path: "/pending", changefreq: "weekly", priority: "0.4" },
    ];

    for (const p of staticPages) {
      urls.push(urlEntry(p.path, { changefreq: p.changefreq, priority: p.priority }));
    }

    const base = getBackendUrl();
    const [catRes, cityRes] = await Promise.all([
      fetch(`${base}/api/categories?limit=500`, { next: { revalidate: 3600 } }),
      fetch(`${base}/api/cities?country=Pakistan`, { next: { revalidate: 3600 } }),
    ]);

    if (catRes.ok) {
      const { categories = [] } = await catRes.json();
      for (const c of categories) {
        const slug = c.slug || slugify(c.name);
        if (slug) {
          urls.push(urlEntry(`/category/${encodeURIComponent(slug)}`, {
            changefreq: "weekly",
            priority: "0.8",
          }));
          const subs = c.subcategories || [];
          for (const sub of subs) {
            const subSlug = sub.slug || slugify(sub.name);
            if (subSlug) {
              urls.push(urlEntry(
                `/category/${encodeURIComponent(slug)}?subcategory=${encodeURIComponent(subSlug)}`,
                { changefreq: "weekly", priority: "0.7" }
              ));
            }
          }
        }
      }
    }

    if (cityRes.ok) {
      const { cities = [] } = await cityRes.json();
      for (const city of cities) {
        const slug = city.id || city.slug || slugify(city.name);
        if (slug) {
          urls.push(urlEntry(`/city/${encodeURIComponent(slug)}`, {
            changefreq: "weekly",
            priority: "0.8",
          }));
        }
      }
    }

    // City + category and city + category + area (only combos with listings)
    try {
      const geoRes = await fetch(`${base}/api/sitemap/geo-pages`, { next: { revalidate: 600 } });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        // PHP returns path strings "city/category"; Node returns {city, category}
        for (const row of geo.cityCategory || []) {
          const [city, category] = typeof row === "string" ? row.split("/") : [row.city, row.category];
          if (city && category) {
            urls.push(urlEntry(`/${encodeURIComponent(city)}/${encodeURIComponent(category)}`, { changefreq: "weekly", priority: "0.75" }));
          }
        }
        for (const row of geo.cityCategoryArea || []) {
          const parts = typeof row === "string" ? row.split("/") : [row.city, row.category, row.area];
          const [city, category, area] = parts;
          if (city && category && area) {
            urls.push(urlEntry(`/${encodeURIComponent(city)}/${encodeURIComponent(category)}/${encodeURIComponent(area)}`, { changefreq: "weekly", priority: "0.7" }));
          }
        }
      }
    } catch {
      // skip geo pages on error
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntry("/", { changefreq: "daily", priority: "1.0" })}
</urlset>`;
    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store",
      },
    });
  }
}

function slugify(s: string): string {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
