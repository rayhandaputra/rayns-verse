import { API_KEY } from "../core/config";

const EMAIL_BASE = "https://data.kinau.web.id/apicore";

export const EmailAPI = {
  /**
   * Get mailbox (inbox, spam, sent)
   * Server-side only — called from route loader or via POST
   */
  getMailbox: async ({ session, req }: any) => {
    const { email } = req.body || req.query || {};
    const url = email
      ? `${EMAIL_BASE}/mailbox?email=${encodeURIComponent(email)}`
      : `${EMAIL_BASE}/mailbox`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { status: data.status === 200 || data.status === true, data: data.data?.data || data.data, error: null };
    } catch (error: any) {
      return { status: false, data: null, error: error.message };
    }
  },

  /**
   * Read a single email body
   * Server-side only
   */
  readEmail: async ({ session, req }: any) => {
    const { email, read_uid, folder } = req.body || req.query || {};
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    params.set("read_uid", read_uid);
    params.set("folder", folder);

    const url = `${EMAIL_BASE}/mail/read?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { status: data.status === 200 || data.status === true, data: data.data, error: null };
    } catch (error: any) {
      return { status: false, data: null, error: error.message };
    }
  },

  /**
   * Send email via SMTP
   * Server-side only
   */
  sendEmail: async ({ session, req }: any) => {
    const { to, subject, body, from_name } = req.body || {};

    try {
      const payload: Record<string, string> = {
        to,
        subject,
        body,
      };
      if (from_name) payload.from_name = from_name;

      const response = await fetch(`${EMAIL_BASE}/send_email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return {
        status: data.status === 200 || data.status === true,
        message: data.data?.message || data.message,
        error: data.error_message || data.error || null,
      };
    } catch (error: any) {
      return { status: false, message: null, error: error.message };
    }
  },
};

