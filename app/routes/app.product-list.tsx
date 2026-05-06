// app/routes/app.product-list.tsx
import {
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { ProductTier, ProductVariation } from "~/types";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { ProductListFeature } from "~/components/features/product/ProductListFeature";

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // --- DELETE ---
  if (intent === "delete") {
    try {
      const id = formData.get("id") as string;
      const response = await API.PRODUCT.update({
        session: { user, token },
        req: {
          body: {
            id,
            deleted_on: new Date().toISOString(),
          },
        },
      });

      if (response.success) {
        return Response.json({
          success: true,
          message: "Produk berhasil dihapus",
        });
      }
      return Response.json(
        { success: false, message: response.message || "Gagal menghapus" },
        { status: 400 }
      );
    } catch (error: any) {
      return Response.json(
        { success: false, message: error.message || "Terjadi kesalahan" },
        { status: 500 }
      );
    }
  }

  // --- CREATE & EDIT ---
  try {
    const data = Object.fromEntries(formData);
    const {
      id,
      name,
      category,
      description,
      image,
      show_in_dashboard,
      product_price_rules,
      product_variants,
    } = data as any;

    let price_rules: ProductTier[] = [];
    let variants: ProductVariation[] = [];
    try {
      price_rules = JSON.parse(product_price_rules || "[]");
    } catch (e) { /* ignore */ }
    try {
      variants = JSON.parse(product_variants || "[]");
    } catch (e) { /* ignore */ }

    // Map category to API type - sekarang memakai category_id dari master
    // type di-set dari nama category yang dipilih (backward compat)
    let type = "other";
    if (category === "Paket") type = "package";
    else if (category === "Id Card") type = "id_card";
    else if (category === "Lanyard") type = "lanyard";
    else if (category === "Lainnya") type = "custom";

    const payload = {
      name,
      total_price: price_rules?.length > 0 ? price_rules?.[0].price : 0,
      type,
      category_id: data.category_id || null,
      description,
      image,
      show_in_dashboard,
      price_rules,
      variants: variants?.map((v: any) => ({
        ...v,
        is_default: +v.is_default === 1 ? 1 : 0,
      })),
      ...(+id > 0 ? { id } : {}),
    };

    // Use create for both create and update (it handles both)
    let response;
    if (+id > 0) {
      // Update mode
      response = await API.PRODUCT.update({
        session: { user, token },
        req: {
          body: payload,
        },
      });
    } else {
      // Create mode
      response = await API.PRODUCT.create({
        session: { user, token },
        req: {
          body: payload,
        },
      });
    }

    if (response.success) {
      return Response.json({
        success: true,
        message: id
          ? "Produk berhasil diperbarui"
          : "Produk berhasil ditambahkan",
      });
    } else {
      return Response.json(
        { success: false, message: response.message || "Gagal menyimpan" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductListPage() {
  return <ProductListFeature />;
}
