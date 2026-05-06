import { type DesignRule } from "~/types/design";

export const applyDefaultIdCardLayout = (addRule: (rule: DesignRule) => void) => {
    const now = Date.now();
    const defaultRules: DesignRule[] = [
        { id: 'rule-logo-' + now, type: 'logo', label: 'AREA LOGO', x: 25, y: 10, width: 50, height: 15 },
        { id: 'rule-photo-' + now + 1, type: 'photo', label: 'AREA FOTO', x: 20, y: 30, width: 60, height: 45 },
        { id: 'rule-name-' + now + 2, type: 'text', label: 'NAMA/JABATAN', x: 10, y: 80, width: 80, height: 10, fontFamily: 'Inter', fontColor: '#000000' }
    ];
    defaultRules.forEach(addRule);
};

export const applyLanyardDefaultLayout = (addRule: (rule: DesignRule) => void) => {
    const now = Date.now();
    const foldPercent = (7 / 90) * 100;
    const logoWidthPercent = (15 / 90) * 100;
    const logoStart = 50 - (logoWidthPercent / 2);

    const defaultRules: DesignRule[] = [
        { id: 'l-logo-' + now, type: 'logo', label: 'LOGO TENGAH', x: logoStart, y: 0, width: logoWidthPercent, height: 100 },
        { id: 'l-txt-L-' + now + 1, type: 'text', label: 'TEKS KIRI', x: foldPercent, y: 0, width: logoStart - foldPercent, height: 100, fontFamily: 'Inter', fontColor: '#000000' },
        { id: 'l-txt-R-' + now + 2, type: 'text', label: 'TEKS KANAN', x: logoStart + logoWidthPercent, y: 0, width: (100 - foldPercent) - (logoStart + logoWidthPercent), height: 100, fontFamily: 'Inter', fontColor: '#000000' }
    ];
    defaultRules.forEach(addRule);
};
