import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export default function SEO({
  title,
  description = "NewJourney - Mạng xã hội kết nối bạn bè, chia sẻ câu chuyện và khám phá những điều thú vị xung quanh bạn.",
  image = "/placeholder.png",
  url,
  type = "website",
  keywords = "newjourney, mang xa hoi, chat, connect friends, kết bạn, chia sẻ bài viết"
}: SEOProps) {
  const SITE_URL = "https://new-journey-j9q5.vercel.app";
  const siteTitle = title ? `${title} | NewJourney` : "NewJourney - Mạng xã hội kết nối giới trẻ";
  
  // Clean canonical URL by removing query parameters and hash to prevent duplicate content indexing
  const getCleanUrl = () => {
    if (url) {
      return url.startsWith("http") ? url : `${SITE_URL}${url}`;
    }
    if (typeof window !== "undefined") {
      return window.location.origin + window.location.pathname;
    }
    return SITE_URL;
  };
  const canonicalUrl = getCleanUrl();

  // Resolve absolute image URL for social sharing compatibility
  const ogImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* General tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph / Facebook */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NewJourney" />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots config */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}
