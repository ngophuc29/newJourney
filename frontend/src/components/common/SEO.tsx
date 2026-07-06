import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: string;
  keywords?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://new-journey-j9q5.vercel.app").replace(/\/$/, "");
const SITE_NAME = "NewJourney";
const DEFAULT_TITLE = "NewJourney - Mạng xã hội kết nối giới trẻ";
const DEFAULT_DESCRIPTION =
  "NewJourney là mạng xã hội giúp bạn kết nối bạn bè, chia sẻ câu chuyện và khám phá những khoảnh khắc thú vị xung quanh mình.";
const DEFAULT_KEYWORDS = "newjourney, mạng xã hội, kết bạn, nhắn tin, chia sẻ bài viết, cộng đồng giới trẻ";
const DEFAULT_IMAGE = "/placeholder.png";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_TITLE,
  url,
  type = "website",
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
  noFollow = false,
  structuredData,
}: SEOProps) {
  const siteTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  const canonicalUrl = (() => {
    if (url) {
      return url.startsWith("http") ? url : `${SITE_URL}${url}`;
    }

    if (typeof window !== "undefined") {
      return `${SITE_URL}${window.location.pathname}`;
    }

    return SITE_URL;
  })();

  const ogImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  const robots = `${noIndex ? "noindex" : "index"}, ${noFollow ? "nofollow" : "follow"}`;
  const defaultStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "vi-VN",
      description: DEFAULT_DESCRIPTION,
    },
  ];

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="vi_VN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={imageAlt} />

      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}
