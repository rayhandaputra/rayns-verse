import { useLoaderData, type LoaderFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import EmailCampaignFeature from "~/components/features/email/EmailCampaignFeature";

export const loader: LoaderFunction = async ({ request }) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const isCEO = user?.role?.toUpperCase() === "CEO" || user?.role?.toUpperCase() === "DEVELOPER";

  let mailbox = null;
  let fetchError = null;
  try {
    const url = isCEO
      ? "https://data.kinau.id/mailbox.php?email=official@kinau.id"
      : "https://data.kinau.id/mailbox.php";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch mailbox");
    mailbox = await response.json();
  } catch (error) {
    console.error("Mailbox fetch error:", error);
    fetchError = "Gagal memuat email";
  }

  return { mailbox, error: fetchError, user };
};

export default function EmailPage() {
  const data = useLoaderData<any>();
  return <EmailCampaignFeature {...data} />;
}
