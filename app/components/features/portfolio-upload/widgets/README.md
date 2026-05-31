# Portfolio Upload Widgets

### Widget: ImageCropper
- File: `ImageCropper.tsx`
- Function: Crop gambar ke rasio 9:16 menggunakan react-image-crop
- Props: `slotIndex: number`, `onCropComplete: (url: string) => void`, `onCancel: () => void`

### Widget: TemplatePreview
- File: `TemplatePreview.tsx`
- Function: Preview layout template 4 foto dengan frame LayoutCanva.png (9:16 Story IG)
- Props: `images: (string | null)[]`, `onDelete: (index: number) => void`, `onReplace: (index: number) => void`
- Layout: Asimetris — 2 slot landscape (top-left, bottom-right) + 2 slot portrait (top-right, bottom-left)
- Frame: `/public/LayoutCanva.png` sebagai overlay di atas foto
