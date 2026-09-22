import { SITE_URL } from '../lib/site';

export default function sitemap() {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/waitlist`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
