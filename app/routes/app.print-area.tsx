import React, { useState, useEffect, useRef, useCallback } from "react";
import { type ActionFunction, type MetaFunction } from "react-router";
import { toast } from "sonner";
import { useFetcherData, usePrintSlots } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { type PrintOrder } from "~/types/print";

// Modular Components
import { PrintSidebar } from "~/components/features/print-area/PrintSidebar";
import { A4Sheet } from "~/components/features/print-area/A4Sheet";
import { LanyardSheet } from "~/components/features/print-area/LanyardSheet";

export const meta: MetaFunction = () => {
  return [{ title: "Cetak Antrean - Nexus" }];
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "update_status") {
      const { id, status } = Object.fromEntries(formData.entries());
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, status_printed: status } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Berhasil memperbarui Status Cetak" : "Gagal memperbarui Status Cetak",
      });
    }
    return Response.json({ success: false, message: "Unknown intent" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message || "An error occurred" });
  }
};

import { PrintAreaDashboard } from "~/components/features/print-area/PrintAreaDashboard";

export default function PrintPage() {
  return <PrintAreaDashboard />;
}
