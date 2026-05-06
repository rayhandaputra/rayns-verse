import React, { useState, useMemo, useEffect } from 'react';
import { type LoaderFunction, type ActionFunction } from 'react-router';
import { ImageIcon, Move, Plus } from 'lucide-react';
import { nexus } from "~/nexus/nexus-client";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { API } from "~/nexus";
import { type DesignCategory, type DesignTemplate, type StyleMode } from "~/types/design";

// Modular Components
import { TemplateCard } from "~/components/features/design/TemplateCard";
import { DesignPreviewModal } from "~/components/features/design/DesignPreviewModal";
import { DesignEditor } from "~/components/features/design/DesignEditor";

export const loader: LoaderFunction = async () => Response.json({});

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'save_template') {
        const templateData = JSON.parse(formData.get('template') as string);

        // Map Client fields to DB fields
        const payload = {
            id: templateData.id.startsWith('tpl-') ? null : templateData.id, // If temp ID, send null to create new UUID
            name: templateData.name,
            category: templateData.category,
            base_image: templateData.baseImage,
            rules: templateData.rules,
            style_mode: templateData.styleMode
        };

        if (templateData.id && !templateData.id.startsWith('tpl-')) {
            const res = await API.TWIBBON_TEMPLATE.update({ req: { body: payload } });
            return Response.json(res);
        } else {
            const res = await API.TWIBBON_TEMPLATE.create({ req: { body: payload } });
            return Response.json(res);
        }
    }

    if (intent === 'delete_template') {
        const id = formData.get('id') as string;
        const res = await API.TWIBBON_TEMPLATE.update({ req: { body: { id, deleted: 1 } } });
        return Response.json(res);
    }

    return Response.json({ success: false, message: "Invalid Intent" });
};

import { DesignDashboard } from "~/components/features/settings/DesignDashboard";

export default function DesignRoute() {
  return <DesignDashboard />;
}
