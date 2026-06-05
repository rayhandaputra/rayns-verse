import { type SelempangAsset } from '~/utils/selempang-db';

export const PPI = 300;
export const INCH_TO_CM = 2.54;
export const PPCM = PPI / INCH_TO_CM; 

export const SIDE_W_CM = 13;
export const SIDE_H_CM = 85;
export const TRIANGLE_H_CM = 8;
export const MARGIN_TOP_CM = 10;

export const SIDE_W = Math.round(SIDE_W_CM * PPCM);   // ~1535px
export const SIDE_H = Math.round(SIDE_H_CM * PPCM);   // ~10039px
export const TRIANGLE_H = Math.round(TRIANGLE_H_CM * PPCM); 

export interface DrawConfig {
    selectedSkin: string | null;
    selectedMotif: string | null;
    threadColor: string;
    globalFont: string;
    nameText: any;
    campusLogo: string;
    campusLogoSize: number;
    campusLogoPosX: number;
    campusName: any;
    midMode: 'ornamen' | 'text';
    campusMidOrn: any;
    campusMidText: any;
    campusProdi: any;
    campusYearOrn: any;
    ornBottomTop: any;
    ornBottomSudut: any;
}

export const drawSide = async (
    ctx: CanvasRenderingContext2D,
    type: 'nama' | 'kampus',
    transparent: boolean,
    config: DrawConfig,
    assets: SelempangAsset[]
) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0); 
    ctx.lineTo(SIDE_W, 0); 
    ctx.lineTo(SIDE_W, SIDE_H - TRIANGLE_H);
    ctx.lineTo(SIDE_W / 2, SIDE_H); 
    ctx.lineTo(0, SIDE_H - TRIANGLE_H); 
    ctx.closePath();
    ctx.clip();

    if (!transparent) {
        if (config.selectedSkin) {
            const img = new Image(); 
            img.src = config.selectedSkin;
            await new Promise(r => img.onload = r);
            ctx.drawImage(img, 0, 0, SIDE_W, SIDE_H);
        } else { 
            ctx.fillStyle = '#000'; 
            ctx.fill(); 
        }
    }

    if (config.selectedMotif) {
        const img = new Image(); 
        img.src = config.selectedMotif;
        await new Promise(r => img.onload = r);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = SIDE_W; 
        tempCanvas.height = SIDE_H;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
            tCtx.drawImage(img, 0, 0, SIDE_W, SIDE_H);
            tCtx.globalCompositeOperation = 'source-in';
            tCtx.fillStyle = config.threadColor;
            tCtx.fillRect(0, 0, SIDE_W, SIDE_H);
            ctx.drawImage(tempCanvas, 0, 0);
        }
    }
    ctx.restore();

    ctx.fillStyle = config.threadColor; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    const drawOrn = async (orn: any, isLogo = false) => {
        const asset = assets.find(a => a.id === orn.id || a.data === (isLogo ? config.campusLogo : ''));
        if (!asset && !isLogo) return;
        const imgSrc = asset ? asset.data : (isLogo ? config.campusLogo : '');
        if (!imgSrc) return;

        const img = new Image(); 
        img.src = imgSrc;
        await new Promise(r => img.onload = r);
        const sizePx = (orn.size / 100) * SIDE_W * 2; 
        const yPx = isLogo ? (MARGIN_TOP_CM * PPCM) : (SIDE_H - (orn.y * PPCM) - (sizePx / 2));
        const xPx = (SIDE_W - sizePx) / 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sizePx; 
        tempCanvas.height = sizePx;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
            tCtx.drawImage(img, 0, 0, sizePx, sizePx);
            if (!isLogo) {
                tCtx.globalCompositeOperation = 'source-in';
                tCtx.fillStyle = config.threadColor;
                tCtx.fillRect(0, 0, sizePx, sizePx);
            }
            ctx.drawImage(tempCanvas, xPx, yPx);
        }
    };

    if (type === 'nama') {
        if (config.nameText.value) {
            ctx.save(); 
            ctx.translate(SIDE_W / 2, SIDE_H / 2); 
            ctx.rotate(Math.PI / 2);
            ctx.font = `bold ${config.nameText.size}px ${config.globalFont}`;
            // @ts-ignore
            if (ctx.letterSpacing !== undefined) {
                // @ts-ignore
                ctx.letterSpacing = `${config.nameText.spacing}px`;
            }
            ctx.fillText(config.nameText.value.toUpperCase(), 0, (config.nameText.pos - 50) * (SIDE_W / 20));
            ctx.restore();
        }
    } else {
        if (config.campusLogo) {
            await drawOrn({ id: '', size: config.campusLogoSize, y: MARGIN_TOP_CM }, true);
        }
        const drawT = (s: any) => {
            if (!s.value) return;
            ctx.font = `bold ${s.size}px ${config.globalFont}`;
            // @ts-ignore
            if (ctx.letterSpacing !== undefined) {
                // @ts-ignore
                ctx.letterSpacing = `${s.spacing}px`;
            }
            ctx.fillText(s.value.toUpperCase(), SIDE_W / 2, s.pos * PPCM);
        };
        drawT(config.campusName);

        if (config.midMode === 'ornamen') {
            if (config.campusMidOrn.id) await drawOrn(config.campusMidOrn);
        } else {
            if (config.campusMidText.value) {
                ctx.font = `bold ${config.campusMidText.size}px ${config.globalFont}`;
                const chars = config.campusMidText.value.toUpperCase().split('');
                const charH = config.campusMidText.size;
                const vGap = config.campusMidText.spacing;
                const totalH = (chars.length * charH) + ((chars.length - 1) * vGap);
                const startY = (config.campusMidText.pos * PPCM) - (totalH / 2);
                chars.forEach((char: string, i: number) => {
                    ctx.fillText(char, SIDE_W / 2, startY + (i * (charH + vGap)) + (charH / 2));
                });
            }
        }
        drawT(config.campusProdi); 
        if (config.campusYearOrn.id) await drawOrn(config.campusYearOrn);
    }
    await drawOrn(config.ornBottomTop);
    await drawOrn(config.ornBottomSudut);
};
