export const PRODUCT_GALLERY_LIMIT = 8;
export const PRODUCT_VIDEO_LIMIT = 1;

export function getProductGalleryImages(product) {
  const gallery = Array.isArray(product?.gallery_images) ? product.gallery_images : [];
  const legacy = product?.image_url ? [product.image_url] : [];
  return [...new Set([...gallery, ...legacy].filter(Boolean))].slice(0, PRODUCT_GALLERY_LIMIT);
}

export function getPrimaryProductImage(product) {
  return getProductGalleryImages(product)[0] || null;
}

export function normalizeProductDraftMedia(product) {
  const galleryImages = [...new Set((product?.gallery_images || []).filter(Boolean))].slice(0, PRODUCT_GALLERY_LIMIT);
  return {
    ...product,
    gallery_images: galleryImages,
    image_url: galleryImages[0] || product?.image_url || null,
    video_url: product?.video_url || null,
  };
}

export function buildProductSpecs(product) {
  const fields = [
    ['spec_material', 'Material'],
    ['spec_dimensions', 'Dimensions'],
    ['spec_unit_weight', 'Unit Weight'],
    ['spec_color_options', 'Colors / Variants'],
    ['spec_packaging_details', 'Packaging'],
    ['spec_customization', 'Customization / OEM'],
    ['spec_lead_time_days', 'Lead Time (days)'],
  ];

  return fields
    .map(([key, label]) => ({ key, label, value: product?.[key] }))
    .filter(item => item.value !== null && item.value !== undefined && String(item.value).trim() !== '');
}
