import { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { getBackendUrl } from "@/lib/api"
import { getBuildSlugs } from "@/lib/build-slugs"
import { CategoryPageClient } from "./category-page-client"

export async function generateStaticParams() {
  const params: { slug: string }[] = [{ slug: '_placeholder' }];
  try {
    const { categories } = await getBuildSlugs();
    for (const c of categories) {
      if (c.slug && c.slug !== '_placeholder') params.push({ slug: c.slug });
    }
  } catch {}
  return params;
}

function prettySlug(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categoryName = prettySlug(slug)
  const canonicalUrl = `${SITE_URL}/category/${slug}`
  const title = `${categoryName} – Businesses in Pakistan | ${SITE_NAME}`
  const description = `Find ${categoryName} businesses across Pakistan. Browse listings, read reviews, and get contact details. Free business directory.`
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title: `${categoryName} | ${SITE_NAME}`, description, url: canonicalUrl, type: "website" },
    twitter: { card: "summary", title: `${categoryName} | ${SITE_NAME}` },
  }
}

export default function CategoryPage() {
  return <CategoryPageClient />
}
