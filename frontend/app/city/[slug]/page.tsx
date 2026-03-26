import CityPageClient from "./city-page-client"
import { getBuildSlugs } from "@/lib/build-slugs"

export async function generateStaticParams() {
  const params: { slug: string }[] = [{ slug: '_placeholder' }];
  try {
    const { cities } = await getBuildSlugs();
    for (const c of cities) {
      if (c.slug && c.slug !== '_placeholder') params.push({ slug: c.slug });
    }
  } catch {}
  return params;
}

export default function CityPage() {
  return <CityPageClient />;
}
