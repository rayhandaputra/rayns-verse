import { useLoaderData, type LoaderFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import EmailCampaignFeature from "~/components/features/email/EmailCampaignFeature";
import { API } from "~/nexus/index.server";

export const loader: LoaderFunction = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const isCEO = user?.role?.toUpperCase() === "CEO" || user?.role?.toUpperCase() === "DEVELOPER";

  let mailbox = null;
  let fetchError = null;

  const result = await API.EMAIL.getMailbox({
    session: null,
    req: { query: isCEO ? { email: "official@kinau.id" } : {} },
  });

  if (result.status) {
    mailbox = result.data;
  } else {
    fetchError = "Gagal memuat email";
  }

  return { mailbox, error: fetchError, user };
};

export default function EmailPage() {
  const data = useLoaderData<any>();
  return <EmailCampaignFeature {...data} />;
}