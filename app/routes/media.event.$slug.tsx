import { useLoaderData, type LoaderFunction } from "react-router";
import { API } from "~/nexus";
import MediaEventFeature from "~/components/features/media/MediaEventFeature";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const event = await API.CMS_CONTENT.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          slug: params.slug || "",
        },
      } as any,
    });
    return { event, slug: params.slug };
  } catch (err) {
    console.error(err);
    return { event: null, slug: params.slug };
  }
};

export default function MediaEventPage() {
  const { slug } = useLoaderData<any>();
  return <MediaEventFeature slug={slug} />;
}
