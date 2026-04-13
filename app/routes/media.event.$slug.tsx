import { useMemo, useState } from "react";
import { useLoaderData, type LoaderFunction } from "react-router";
import { API } from "~/lib/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const event = await API.CMS_CONTENT.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          slug: params.slug,
        },
      } as any,
    });
  } catch (err) {
    console.log(err);
  }
};

type ArticleDetailContent = {
  title: string;
  subtitle: string;
  priceTag?: string;
  category: string;
  author: string;
  publishedAt: string;
  stats: { label: string; value: string }[];
  images: string[];
  summary: string;
  sections: {
    title: string;
    items: { label: string; value: string }[];
  }[];
  location: {
    label: string;
    address: string;
  };
};

const fallbackArticleDetail: ArticleDetailContent = {
  title: "Modern Oasis with Panoramic Views",
  subtitle: "123 Sunset Blvd, Palm Beach, FL 90210",
  priceTag: "$700,000",
  category: "News Feature • Lifestyle",
  author: "Rayns Media Editorial",
  publishedAt: "November 21, 2025",
  stats: [
    { label: "Event Type", value: "Signature Talk" },
    { label: "Seats Available", value: "320" },
    { label: "Duration", value: "3 hours" },
    { label: "Venue", value: "Rayns Hall" },
  ],
  images: [
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1800&q=80",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  ],
  summary:
    "Step into the heart of our most anticipated community event of the season. Explore the inspiration behind the program, meet the curators, and get an insider look at the experience we crafted for our attendees.",
  sections: [
    {
      title: "Highlights",
      items: [
        {
          label: "Keynote Speaker",
          value: "Alya Kusuma (Creative Director, Rayns Verse)",
        },
        { label: "Theme", value: "Designing Immersive Experiences" },
        {
          label: "Audience",
          value: "Creators, Community Builders, Event Planners",
        },
        { label: "Partners", value: "Rayns Studio, Kinau, Paragon Labs" },
      ],
    },
    {
      title: "Schedule",
      items: [
        { label: "Opening", value: "09.00 - 09.30" },
        { label: "Main Session", value: "09.30 - 11.30" },
        { label: "Networking", value: "11.30 - 12.30" },
        { label: "Expo Showcase", value: "12.30 - 14.00" },
      ],
    },
    {
      title: "Facilities",
      items: [
        { label: "Registration Kit", value: "Exclusive merchandise pack" },
        { label: "Tech Support", value: "Live translation + streaming" },
        {
          label: "Experience Zone",
          value: "Interactive installation walkthrough",
        },
        { label: "After Movie", value: "Delivered 7 days post-event" },
      ],
    },
  ],
  location: {
    label: "Rayns Experience Center",
    address: "Jl. Bangka Raya No. 21, Jakarta Selatan",
  },
};

const MediaEvent = () => {
  const { data } = useLoaderData();

  const article = fallbackArticleDetail;

  const images = article?.images || [];
  const [selectedImage, setSelectedImage] = useState(images?.[0]);

  const galleryImages = useMemo(() => {
    if (!images?.length) return ["/placeholder.svg"];
    return images;
  }, [images]);

  return (
    <section className="w-full bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={selectedImage || galleryImages[0]}
                  alt="Article gallery"
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow">
                    Share
                  </button>
                  <button className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow">
                    Save
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 p-4 bg-white">
                {galleryImages.map((img, index) => (
                  <button
                    key={img + index}
                    onClick={() => setSelectedImage(img)}
                    className={`rounded-xl overflow-hidden border-2 ${selectedImage === img ? "border-orange-500" : "border-transparent"}`}
                  >
                    <img
                      src={img}
                      alt="Gallery thumb"
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">
                  {article?.category}
                </p>
                <h1 className="text-3xl font-bold text-slate-900 mt-2">
                  {article?.title}
                </h1>
                <p className="text-slate-500 mt-1">{article?.subtitle}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                  <span>By {article?.author}</span>
                  <span>•</span>
                  <span>{article?.publishedAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                {article?.stats?.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-slate-500 text-sm">{stat.label}</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>{article?.summary}</p>
                <button className="text-orange-600 font-semibold text-sm">
                  Show more
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-8">
              {article?.sections?.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.items.map((item) => (
                      <div key={`${section.title}-${item.label}`}>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Location</h3>
                  <p className="text-sm text-slate-500">
                    {article?.location?.address}
                  </p>
                </div>
                <button className="text-sm font-semibold text-orange-600">
                  View full map
                </button>
              </div>
              <div className="h-64 rounded-2xl overflow-hidden bg-slate-100">
                <iframe
                  title="event-location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=106.793%2C-6.255%2C106.825%2C-6.235&layer=mapnik"
                  className="w-full h-full"
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <p className="text-3xl font-bold text-orange-500">
                {article?.priceTag}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Equivalent sponsorship package
              </p>
              <hr className="my-6" />
              <h4 className="text-lg font-semibold mb-4">Contact Organizer</h4>
              <form className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your complete name"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Please provide email address"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Please provide mobile number"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Message
                  </label>
                  <textarea
                    placeholder="Please provide your message here"
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-orange-500 text-white py-3 font-semibold hover:bg-orange-600 transition"
                >
                  Send
                </button>
              </form>
              <p className="text-xs text-slate-400 mt-4">
                By submitting, you agree to share your message and contact
                details with the organizer team.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
              <h4 className="text-lg font-semibold">Download Media Kit</h4>
              <p className="text-sm text-slate-500">
                Access brochure, floor plan, and branding materials for press
                coverage.
              </p>
              <button className="w-full rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaEvent;
