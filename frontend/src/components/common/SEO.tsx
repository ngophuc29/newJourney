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
  image = "/logo.png",
  url,
  type = "website",
  keywords = "newjourney, mang xa hoi, chat, connect friends, kết bạn, chia sẻ bài viết"
}: SEOProps) {
  const siteTitle = title ? `${title} | NewJourney` : "NewJourney - Mạng xã hội kết nối giới trẻ";
  const canonicalUrl = url || window.location.href;

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
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NewJourney" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Robots config */}
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}
