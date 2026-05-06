
import { useState, useEffect } from "react";
import { useActionData, useNavigate } from "react-router";
import moment from "moment";
import { API_URL, API_KEY } from "~/nexus";
import { toMoney } from "~/utils/utils";

export function useOrderManageLogic() {
  const actionData = useActionData() as any;
  const navigate = useNavigate();

  const defItem = {
    product_id: "",
    product_name: "",
    product_type: "single",
    unit_price: 0,
    qty: 1,
    subtotal: 0,
  };
  const [items, setItems] = useState<any[]>([defItem]);

  const defaultState = {
    institution_id: "",
    institution_name: "",
    institution_abbr: "",
    institution_abbr_id: "",
    institution_domain: "",
    order_type: "package",
    payment_status: "none",
    payment_method: "manual_transfer",
    discount_value: 0,
    tax_percent: 0,
    shipping_fee: 0,
    other_fee: 0,
    deadline: moment().format("YYYY-MM-DD"),
  };
  const [state, setState] = useState<any>(defaultState);

  useEffect(() => {
    if (actionData?.flash) {
      navigate("/app/order/ordered", {
        state: { flash: actionData?.flash },
        replace: true,
      });
    }
  }, [actionData]);

  // === CALCULATE TOTALS ===
  const subtotal = items.reduce((a, b) => a + (b.subtotal || 0), 0);

  const loadOptionInstitution = async (search: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          action: "select",
          table: "institutions",
          columns: ["id", "name", "abbr"],
          where: { deleted_on: "null" },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.abbr ? v?.abbr + " - " : ""}${v?.name}`,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const loadOptionDomain = async (search: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          action: "select",
          table: "institution_domains",
          columns: ["id", "institution_id", "domain"],
          where: {
            deleted_on: "null",
            institution_id: state?.institution_id || "0000",
          },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: v?.domain,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const loadOptionProduct = async (search: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          action: "select",
          table: "products",
          columns: ["id", "name", "type", "total_price"],
          where: { deleted_on: "null" },
          search,
          page: 0,
          size: 50,
        }),
      });
      const result = await response.json();
      return result?.items?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.name} - Rp${toMoney(v?.total_price)}`,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return {
    items,
    setItems,
    state,
    setState,
    subtotal,
    defItem,
    defaultState,
    loadOptionInstitution,
    loadOptionDomain,
    loadOptionProduct,
    navigate,
  };
}
