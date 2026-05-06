
import { useState, useMemo, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { toast } from 'sonner';
import { nexus } from '~/nexus/nexus-client';
import { useFetcherData, useModal } from '~/hooks';
import { parseCurrency } from '~/constants';
import { safeParseArray } from '~/utils/utils';
import { calculateProcurementCosts } from './procurement-utils';
import { Order, OrderItem, Supplier } from './types';

export function useProcurementLogic() {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";
    const [modal, setModal] = useModal();

    // --- DATA FETCHING ---
    const { data: shopsData } = useFetcherData({ 
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build() 
    });
    const { data: ordersData } = useFetcherData({
        endpoint: nexus().module("ORDERS").action("get").params({ size: 100, status_ne: 'done,cancelled,rejected', exclude_order_stock: "1", check_product_item: "cotton", include: "order_items" }).build()
    });
    const { data: bankList } = useFetcherData({ 
        endpoint: nexus().module("ACCOUNT").action("get").params({ size: 100, pagination: "true", is_bank: "1" }).build() 
    });
    const { data: transData, reload: reloadTransactions } = useFetcherData({
        endpoint: nexus().module("STOCK_LOG").action("get").params({ size: 200, category: 'cotton_combed_premium', sort_by: 'created_on', order: 'DESC', include: 'orders' }).build()
    });

    const shops: Supplier[] = shopsData?.data?.items || [];
    const ordersRaw: any[] = ordersData?.data?.items || [];
    const transactions = transData?.data?.items || [];

    // --- FORM STATE ---
    const [form, setForm] = useState({
        selectedOrderTrx: '',
        selectedShopId: '',
        discount: '', admin: '', shipping: '',
        // Sablon
        sablonShopId: '', sablonQty: '', sablonCost: '', sablonDisc: '', sablonAdmin: '', sablonShip: ''
    });

    // --- EFFECT ---
    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setTimeout(() => {
                setForm({
                    selectedOrderTrx: '', selectedShopId: '', discount: '', admin: '', shipping: '',
                    sablonShopId: '', sablonQty: '', sablonCost: '', sablonDisc: '', sablonAdmin: '', sablonShip: ''
                });
                setModal({ open: false, type: "" });
                reloadTransactions();
            }, 0);
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    // --- DATA MAPPING ---
    const cottonOrderOptions = useMemo(() => {
        return ordersRaw.map((o: any) => {
            const items: OrderItem[] = Array.isArray(o.order_items) ? o.order_items : safeParseArray(o.order_items);
            const totalQty = items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 0), 0);
            return {
                ...o, instansi: o.institution_name || "Tanpa Nama", jumlah: totalQty,
                order_items: items.map(item => ({ ...item, size: item.size || 'L', sleeve: item.sleeve || 'Pendek', color: item.color || 'Belum Diatur', qty: Number(item.qty || item.quantity || 0) }))
            } as Order;
        });
    }, [ordersRaw]);

    const selectedOrderData = useMemo(() => cottonOrderOptions.find(o => o.order_number === form.selectedOrderTrx), [cottonOrderOptions, form.selectedOrderTrx]);
    const selectedVendorData = useMemo(() => shops.find(s => String(s.id) === form.selectedShopId), [shops, form.selectedShopId]);
    const calcData = useMemo(() => calculateProcurementCosts(selectedOrderData, selectedVendorData), [selectedOrderData, selectedVendorData]);

    // --- HANDLERS ---
    const handleProcess = () => {
        if (!form.selectedShopId || !form.selectedOrderTrx) return toast.error("Pilih Vendor Kaos dan Pesanan.");

        const totalKaosCost = calcData.total - parseCurrency(form.discount) + parseCurrency(form.admin) + parseCurrency(form.shipping);

        let totalSablonCost = 0;
        let sablonBaseCost = 0;
        if (form.sablonShopId) {
            const sVendor = shops.find(s => String(s.id) === form.sablonShopId);
            sablonBaseCost = Number(sVendor?.price_per_meter || 0) * Number(form.sablonQty || 0);
            totalSablonCost = sablonBaseCost - parseCurrency(form.sablonDisc) + parseCurrency(form.sablonAdmin) + parseCurrency(form.sablonShip);
        }

        const finalAmount = totalKaosCost + totalSablonCost;
        const labaBersih = (selectedOrderData?.total_amount || 0) - finalAmount;

        const formData = new FormData();
        formData.append('intent', 'create_procurement');
        formData.append('order_trx_code', form.selectedOrderTrx);
        formData.append('supplier_id', form.selectedShopId);
        formData.append('total_item_qty', selectedOrderData?.jumlah?.toString() || '0');
        formData.append('total_item_price', calcData.total.toString());
        formData.append('discount_value', parseCurrency(form.discount).toString());
        formData.append('admin_cost', parseCurrency(form.admin).toString());
        formData.append('shipping_cost', parseCurrency(form.shipping).toString());

        if (form.sablonShopId) {
            formData.append('sablon_supplier_id', form.sablonShopId);
            formData.append('sablon_kebutuhan_per_meter', form.sablonQty);
            formData.append('sablon_cost', sablonBaseCost.toString());
            formData.append('sablon_discount_value', parseCurrency(form.sablonDisc).toString());
            formData.append('sablon_admin_cost', parseCurrency(form.sablonAdmin).toString());
            formData.append('sablon_shipping_cost', parseCurrency(form.sablonShip).toString());
        }

        formData.append('final_amount', finalAmount.toString());
        formData.append('laba_bersih', labaBersih.toString());
        formData.append('description', `[COTTON] Belanja Pengadaan Pesanan ${selectedOrderData?.instansi}`);

        const itemLogs: any = [];
        for (const items of Object.values(calcData.itemsByColor)) {
            items.forEach((it: any) => {
                itemLogs.push({
                    product_id: it.product_id || null,
                    qty: it.quantity,
                    selling_price: it.unit_price || 0,
                    supplier_price: it.price || 0,
                    subtotal: it.total || 0
                });
            });
        }
        formData.append('items', JSON.stringify(itemLogs));

        fetcher.submit(formData, { method: 'POST' });
    };

    const handleProcessSablon = (logId: string, oldFinalAmount: number, orderTotalAmount: number, sablonState: any) => {
        const sVendor = shops.find((s: any) => String(s.id) === sablonState.shopId);
        if (!sVendor || !sablonState.qty) return toast.error("Pilih vendor sablon dan jumlah meter.");

        const baseCost = Number(sVendor.price_per_meter || 0) * Number(sablonState.qty);
        const sablonTotal = baseCost + parseCurrency(sablonState.admin) + parseCurrency(sablonState.ship) - parseCurrency(sablonState.disc);

        const newFinalAmount = oldFinalAmount + sablonTotal;
        const newLabaBersih = orderTotalAmount - newFinalAmount;

        const formData = new FormData();
        formData.append('intent', 'update_sablon');
        formData.append('id', logId);
        formData.append('sablon_supplier_id', sablonState.shopId);
        formData.append('sablon_kebutuhan_per_meter', sablonState.qty);
        formData.append('sablon_cost', baseCost.toString());
        formData.append('sablon_discount_value', parseCurrency(sablonState.disc).toString());
        formData.append('sablon_admin_cost', parseCurrency(sablonState.admin).toString());
        formData.append('sablon_shipping_cost', parseCurrency(sablonState.ship).toString());
        formData.append('final_amount', newFinalAmount.toString());
        formData.append('laba_bersih', newLabaBersih.toString());
        formData.append('description', `[SABLON] Tambahan Sablon DTF`);

        fetcher.submit(formData, { method: 'POST' });
    };

    const handleSubmitPaymentProof = (e: any) => {
        e.preventDefault();
        const payload = new FormData();
        payload.append('intent', 'update_payment_proof');
        payload.append('id', modal?.data?.id);

        const targetField = modal?.data?.target_field;
        if (targetField) {
            payload.append(targetField, modal?.data?.file);
        } else {
            if (modal?.data?.source_upload === "down_payment") {
                payload.append('kaos_payment_proof_dp', modal?.data?.file);
            } else {
                payload.append('kaos_payment_proof_paid', modal?.data?.file);
            }
        }
        fetcher.submit(payload, { method: 'POST' });
    };

    return {
        isSubmitting,
        modal,
        setModal,
        bankList,
        shops,
        transactions,
        form,
        setForm,
        cottonOrderOptions,
        selectedOrderData,
        calcData,
        handleProcess,
        handleProcessSablon,
        handleSubmitPaymentProof,
        reloadTransactions
    };
}
