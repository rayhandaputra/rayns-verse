import React, { useState, useMemo, useEffect } from 'react';
import { ImageIcon, Move, Plus } from 'lucide-react';
import { nexus } from "~/nexus/nexus-client";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { type DesignCategory, type DesignTemplate, type StyleMode } from "~/types/design";
import { TemplateCard } from "~/components/features/design/TemplateCard";
import { DesignPreviewModal } from "~/components/features/design/DesignPreviewModal";
import { DesignEditor } from "~/components/features/design/DesignEditor";
import { toast } from 'sonner';

export const DesignDashboard: React.FC = () => {
    const {
        data: templatesRes,
        reload: reloadTemplates
    } = useFetcherData<any>({
        endpoint: nexus()
            .module("TWIBBON_TEMPLATE")
            .action("get")
            .params({
                page: 0,
                size: 100,
            })
            .build(),
        autoLoad: true,
    });

    const {
        data: actionRes,
        loading: loadingAction,
        load: submitAction
    } = useFetcherData({
        endpoint: "",
        method: "POST",
        autoLoad: false,
    });

    const dbTemplates = templatesRes?.data?.items || [];

    const mappedTemplates: DesignTemplate[] = useMemo(() => dbTemplates.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category as DesignCategory,
        baseImage: t.base_image,
        rules: typeof t.rules === 'string' ? JSON.parse(t.rules) : t.rules,
        styleMode: t.style_mode as StyleMode,
        createdAt: t.created_on
    })), [dbTemplates]);

    const [activeTab, setActiveTab] = useState<DesignCategory>('twibbon-idcard');
    const [isCreating, setIsCreating] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);

    useEffect(() => {
        if (actionRes?.success) {
            reloadTemplates();
            setTimeout(() => {
                setIsCreating(false);
                setEditingTemplate(null);
            }, 0);
            toast.success(actionRes.message || "Berhasil!");
        } else if (actionRes?.success === false) {
            toast.error(actionRes.message || "Gagal!");
        }
    }, [actionRes]);

    const handleSaveTemplate = (templateData: DesignTemplate) => {
        submitAction({
            intent: 'save_template',
            template: JSON.stringify(templateData)
        });
    };

    const handleDeleteTemplate = (id: string) => {
        if (!confirm("Yakin ingin menghapus template ini?")) return;
        submitAction({ intent: 'delete_template', id });
    };

    const filteredTemplates = mappedTemplates.filter(t => t.category === activeTab);

    return (
        <div className="space-y-6 animate-fade-in pb-20 p-2 md:p-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm no-print">
                <div className="flex bg-gray-50 p-1 rounded-xl">
                    <button 
                    onClick={() => { setActiveTab('twibbon-idcard'); setIsCreating(false); }} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase transition ${activeTab === 'twibbon-idcard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                    <ImageIcon size={14} /> ID CARD
                    </button>
                    <button 
                    onClick={() => { setActiveTab('twibbon-lanyard'); setIsCreating(false); }} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase transition ${activeTab === 'twibbon-lanyard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                    <Move size={14} /> LANYARD
                    </button>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-black transition-colors"
                    >
                        <Plus size={14} /> Template Baru
                    </button>
                )}
            </div>

            {isCreating ? (
                <DesignEditor
                    activeCategory={activeTab}
                    templateId={editingTemplate?.id || null}
                    initialData={editingTemplate || {}}
                    onCancel={() => { setIsCreating(false); setEditingTemplate(null); }}
                    onSave={handleSaveTemplate}
                    isSaving={loadingAction}
                />
            ) : (
                <div className="space-y-8">
                    {filteredTemplates.length === 0 ? (
                        <div onClick={() => setIsCreating(true)} className="bg-white rounded-[40px] border-4 border-dashed border-gray-100 p-12 text-center group hover:border-indigo-200 transition cursor-pointer shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 group-hover:bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 transition">
                                <Plus size={40} className="text-gray-300 group-hover:text-indigo-400 transition" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tambah Template {activeTab.split('-')[1].toUpperCase()} Baru</h3>
                            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Klik untuk mulai mendesain tata letak</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map(tpl => (
                                <TemplateCard 
                                key={tpl.id} 
                                template={tpl} 
                                onEdit={(t) => { setEditingTemplate(t); setIsCreating(true); }}
                                onDelete={handleDeleteTemplate}
                                onPreview={setPreviewTemplate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {previewTemplate && (
                <DesignPreviewModal 
                  template={previewTemplate} 
                  onClose={() => setPreviewTemplate(null)} 
                  onEdit={(t) => { setEditingTemplate(t); setIsCreating(true); }}
                />
            )}
        </div>
    );
};
