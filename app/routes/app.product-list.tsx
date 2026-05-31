import { type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { ProductListFeature } from "~/components/features/product/ProductListFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    try {
      const id = formData.get("id") as string;
      const response = await API.PRODUCT.update({
        session: { user, token },
        req: { body: { id, deleted_on: new Date().toISOString() } },
      });
      return Response.json({
        success: response.success,
        message: response.success ? "Produk berhasil dihapus" : (response.message || "Gagal menghapus"),
      });
    } catch (error: any) {
      return Response.json({ success: false, message: error.message || "Terjadi kesalahan" }, { status: 500 });
    }
  }

  try {
    const data = Object.fromEntries(formData);
    const { id, name, description, image, show_in_dashboard, product_price_rules, product_variants } = data as any;

    let price_rules = [];
    let variants = [];
    try { price_rules = JSON.parse(product_price_rules || "[]"); } catch {}
    try { variants = JSON.parse(product_variants || "[]"); } catch {}

    // DB enum: single | package | material
    const type = (data.type as string) || "single";
    const validTypes = ["single", "package", "material"];
    const safeType = validTypes.includes(type) ? type : "single";

    const payload = {
      name,
      total_price: price_rules?.length > 0 ? price_rules[0].price : 0,
      type: safeType,
      category_id: data.category_id || null,
      category_name: data.category_name || null,
      description,
      image,
      show_in_dashboard,
      price_rules,
      variants: variants?.map((v: any) => ({ ...v, is_default: +v.is_default === 1 ? 1 : 0 })),
      ...(+id > 0 ? { id } : {}),
    };

    const response = +id > 0
      ? await API.PRODUCT.update({ session: { user, token }, req: { body: payload } })
      : await API.PRODUCT.create({ session: { user, token }, req: { body: payload } });

    return Response.json({
      success: response.success,
      message: response.success
        ? (id ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan")
        : (response.message || "Gagal menyimpan"),
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
};

export default function ProductListPage() {
  return <ProductListFeature />;
}
