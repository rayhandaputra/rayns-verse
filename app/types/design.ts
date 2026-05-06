export type DesignCategory = 'twibbon-idcard' | 'twibbon-lanyard';
export type RuleType = 'text' | 'dropdown' | 'photo' | 'logo';
export type StyleMode = 'dynamic' | 'static';

export interface DesignRule {
    id: string;
    type: RuleType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    options?: string[];
    fontFamily?: string;
    fontColor?: string;
}

export interface DesignTemplate {
    id: string;
    name: string;
    category: DesignCategory;
    baseImage: string;
    rules: DesignRule[];
    styleMode: StyleMode;
    createdAt?: string;
}
