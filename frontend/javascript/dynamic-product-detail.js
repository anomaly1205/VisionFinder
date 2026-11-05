// Dynamic Product Detail System - Manages all products in one place

// Product Database - All products from home.html
const PRODUCTS_DATABASE = {
  // Sản phẩm từ boloc.html - Products 1-4
  'ao-polo-nam-the-thao-promax-s1': {
    id: 'ao-polo-nam-the-thao-promax-s1',
    name: 'Áo Polo Nam Thể Thao Promax-S1',
    price: 199000,
    salePrice: 159000,
    image: 'Image/aothethao1.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-pique-cotton': {
    id: 'ao-polo-nam-pique-cotton',
    name: 'Áo Polo Nam Pique Cotton',
    price: 299000,
    salePrice: 249000,
    image: 'Image/machangngay1.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-tshirt-trang-nam-premium-aircool': {
    id: 'ao-tshirt-trang-nam-premium-aircool',
    name: 'Áo T-Shirt Trắng Nam Premium Aircool',
    price: 99000,
    image: 'Image/ao-thun-nam-mac-trong-excool-185-trang_43.avif',
    category: 'Áo Nam',
    type: 'Áo Thun',
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-linen': {
    id: 'ao-polo-nam-linen',
    name: 'Áo Polo Nam Linen',
    price: 399000,
    image: 'Image/machangngay4.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL']
  },

  // Sản phẩm mặc hàng ngày
  'ao-polo-premium': {
    id: 'ao-polo-premium',
    name: 'Áo Polo nam Premium Aircool',
    price: 399000,
    image: 'Image/ao1.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 5.0,
    sizes: ['M', 'L', 'XL', '2XL', '3XL']
  },

  'quan-chino-7inch': {
    id: 'quan-chino-7inch',
    name: 'Quần Chino nam 7 inch',
    price: 379000,
    image: 'Image/do2.avif',
    category: 'Quần Nam',
    type: 'Quần Short',
    rating: 4.8,
    sizes: ['M', 'L', 'XL', '2XL', '3XL']
  },

  'quan-travel-shorts': {
    id: 'quan-travel-shorts',
    name: 'Quần nam Travel Shorts 7inch',
    price: 349000,
    image: 'Image/do3.avif',
    category: 'Quần Nam',
    type: 'Quần Short',
    rating: 4.7,
    sizes: ['M', 'L', 'XL', '2XL', '3XL']
  },

  'quan-shorts-daily': {
    id: 'quan-shorts-daily',
    name: 'Quần Shorts Daily Casual',
    price: 399000,
    image: 'Image/do4.avif',
    category: 'Quần Nam',
    type: 'Quần Short',
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-care-share': {
    id: 'ao-care-share',
    name: 'Áo in cotton Care & Share - Nụ cười',
    price: 199000,
    image: 'Image/do6.avif',
    category: 'Áo Nam',
    type: 'Áo Thun',
    rating: 4.8,
    sizes: ['S', 'M', 'L']
  },

  'ao-polo-classic': {
    id: 'ao-polo-classic',
    name: 'Áo Polo nam Classic',
    price: 299000,
    image: 'Image/odd.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-thun-premium': {
    id: 'ao-thun-premium',
    name: 'Áo thun nam Premium',
    price: 199000,
    image: 'Image/do9.avif',
    category: 'Áo Nam',
    type: 'Áo Thun',
    rating: 4.7,
    sizes: ['S', 'M', 'L']
  },

  // Sản phẩm thể thao
  'ao-the-thao-pro-running': {
    id: 'ao-the-thao-pro-running',
    name: 'Áo thể thao nam Pro Running',
    price: 299000,
    image: 'Image/sport1.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'quan-shorts-pro-active': {
    id: 'quan-shorts-pro-active',
    name: 'Quần shorts thể thao Pro Active',
    price: 249000,
    image: 'Image/sport2.avif',
    category: 'Quần Nam',
    type: 'Quần Thể Thao',
    rating: 4.7,
    sizes: ['S', 'M', 'L']
  },

  'ao-tank-top-premium': {
    id: 'ao-tank-top-premium',
    name: 'Áo tank top thể thao Premium',
    price: 199000,
    image: 'Image/sport3.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'quan-jogger-dryfit': {
    id: 'quan-jogger-dryfit',
    name: 'Quần jogger thể thao DryFit',
    price: 399000,
    image: 'Image/sport4.avif',
    category: 'Quần Nam',
    type: 'Quần Thể Thao',
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  'ao-polo-performance': {
    id: 'ao-polo-performance',
    name: 'Áo polo thể thao Performance',
    price: 349000,
    image: 'Image/sport5.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'quan-shorts-runner': {
    id: 'quan-shorts-runner',
    name: 'Quần shorts chạy bộ Pro Runner',
    price: 279000,
    image: 'Image/sport6.avif',
    category: 'Quần Nam',
    type: 'Quần Thể Thao',
    rating: 4.7,
    sizes: ['S', 'M', 'L']
  },

  // Thêm các sản phẩm còn thiếu từ boloc.html
  'ao-polo-nam-the-thao-promax-s1-2': {
    id: 'ao-polo-nam-the-thao-promax-s1-2',
    name: 'Áo Polo Nam Thể Thao Promax-S1 (V2)',
    price: 199000,
    image: 'Image/aothethao2.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-pique-cotton-mem': {
    id: 'ao-polo-nam-pique-cotton-mem',
    name: 'Áo Polo Nam Pique Cotton Mềm',
    price: 249000,
    image: 'Image/machangngay2.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-premium-aircool': {
    id: 'ao-polo-nam-premium-aircool',
    name: 'Áo Polo Nam Premium Aircool',
    price: 399000,
    image: 'Image/machangngay6.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-linen-2': {
    id: 'ao-polo-nam-linen-2',
    name: 'Áo Polo Nam Linen Premium',
    price: 510000,
    image: 'Image/machangngay5.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-the-thao-promax-s1-3': {
    id: 'ao-polo-nam-the-thao-promax-s1-3',
    name: 'Áo Polo Nam Thể Thao Promax-S1 (V3)',
    price: 199000,
    image: 'Image/aothethao3.avif',
    category: 'Áo Nam',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-pique-cotton-3': {
    id: 'ao-polo-nam-pique-cotton-3',
    name: 'Áo Polo Nam Pique Cotton (V3)',
    price: 249000,
    image: 'Image/machangngay3.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-premium-aircool-2': {
    id: 'ao-polo-nam-premium-aircool-2',
    name: 'Áo Polo Nam Premium Aircool (V2)',
    price: 399000,
    image: 'Image/aothethao6.avif',
    category: 'Áo Nam',
    type: 'Áo Polo',
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL']
  },

  // Sản phẩm nữ
  'ao-polo-nu-the-thao-promax-s1': {
    id: 'ao-polo-nu-the-thao-promax-s1',
    name: 'Áo Polo Nữ Thể Thao Promax-S1',
    price: 199000,
    image: 'Image/thethaonu1.avif',
    category: 'Áo Nữ',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-pique-cotton': {
    id: 'ao-polo-nu-pique-cotton',
    name: 'Áo Polo Nữ Pique Cotton',
    price: 249000,
    image: 'Image/thethaonu2.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-premium-aircool': {
    id: 'ao-polo-nu-premium-aircool',
    name: 'Áo Polo Nữ Premium Aircool',
    price: 399000,
    image: 'Image/thethaonu3.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.9,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-linen': {
    id: 'ao-polo-nu-linen',
    name: 'Áo Polo Nữ Linen',
    price: 399000,
    image: 'Image/thethaonu5.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nam-the-thao-promax-s1-nu': {
    id: 'ao-polo-nam-the-thao-promax-s1-nu',
    name: 'Áo Polo Nữ Thể Thao Promax-S1 Sport',
    price: 199000,
    image: 'Image/thethaonu6.avif',
    category: 'Áo Nữ',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-pique-cotton-2': {
    id: 'ao-polo-nu-pique-cotton-2',
    name: 'Áo Polo Nữ Pique Cotton (V2)',
    price: 249000,
    image: 'Image/aothethaonu.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-premium-aircool-2': {
    id: 'ao-polo-nu-premium-aircool-2',
    name: 'Áo Polo Nữ Premium Aircool (V2)',
    price: 399000,
    image: 'Image/quanthethaonu.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.9,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-linen-2': {
    id: 'ao-polo-nu-linen-2',
    name: 'Áo Polo Nữ Linen Premium',
    price: 510000,
    image: 'Image/nu1_updated.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-the-thao-promax-s1-2': {
    id: 'ao-polo-nu-the-thao-promax-s1-2',
    name: 'Áo Polo Nữ Thể Thao Promax-S1 (V2)',
    price: 199000,
    image: 'Image/thethaonu4.avif',
    category: 'Áo Nữ',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-pique-cotton-3': {
    id: 'ao-polo-nu-pique-cotton-3',
    name: 'Áo Polo Nữ Pique Cotton (V3)',
    price: 249000,
    image: 'Image/maconhanu3.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.7,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-premium-aircool-3': {
    id: 'ao-polo-nu-premium-aircool-3',
    name: 'Áo Polo Nữ Premium Aircool (V3)',
    price: 399000,
    image: 'Image/thethaonu4.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.9,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  'ao-polo-nu-linen-3': {
    id: 'ao-polo-nu-linen-3',
    name: 'Áo Polo Nữ Linen Deluxe',
    price: 510000,
    image: 'Image/nu1.avif',
    category: 'Áo Nữ',
    type: 'Áo Polo',
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  // --- SẢN PHẨM THỂ THAO NỮ từ home.html (nu.html cuối) ---
  'bra-legging-yoga-set': {
    id: 'bra-legging-yoga-set',
    name: 'Bộ Bra + Legging Yoga Set',
    price: 299000,
    image: 'Image/Bra_-_Legging12.avif',
    category: 'Đồ tập nữ',
    type: 'Set',
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL']
  },
  'ao-bra-yoga-premium': {
    id: 'ao-bra-yoga-premium',
    name: 'Áo Bra Yoga Premium',
    price: 149000,
    image: 'Image/thethaonu2.avif',
    category: 'Đồ tập nữ',
    type: 'Bra',
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL']
  },
  'ao-croptop-yoga': {
    id: 'ao-croptop-yoga',
    name: 'Áo Croptop Yoga',
    price: 199000,
    image: 'Image/thethaonu5.avif',
    category: 'Đồ tập nữ',
    type: 'Croptop',
    rating: 4.5,
    sizes: ['S', 'M', 'L', 'XL']
  },
  'ao-the-thao-nu-premium': {
    id: 'ao-the-thao-nu-premium',
    name: 'Áo thể thao nữ Premium',
    price: 299000,
    image: 'Image/aothethaonu.avif',
    category: 'Đồ tập nữ',
    type: 'Áo Thể Thao',
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL']
  },
  'quan-the-thao-nu-running': {
    id: 'quan-the-thao-nu-running',
    name: 'Quần thể thao nữ Running',
    price: 249000,
    image: 'Image/quanthethaonu.avif',
    category: 'Đồ tập nữ',
    type: 'Quần Thể Thao',
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL']
  },

  // Cần fix ID này
  'quan-shorts-pro-runner': {
    id: 'quan-shorts-pro-runner',
    name: 'Quần Shorts Pro Runner',
    price: 279000,
    image: 'Image/sport6.avif',
    category: 'Quần Nam',
    type: 'Quần Thể Thao',
    rating: 4.7,
    sizes: ['S', 'M', 'L']
  }
};

// --- DECOR PRODUCTS ---
Object.assign(PRODUCTS_DATABASE, {
  'decor-seagrass-ottoman-round-pouf': {
    id: 'decor-seagrass-ottoman-round-pouf',
    name: 'Creative handmade Seagrass Ottoman Round Pouf',
    price: 480000, // ~20$
    image: 'Image/decor1.jpg',
    category: 'Decor',
    type: 'Ottoman',
    rating: 4.8,
    sizes: ['One-Size']
  },
  'decor-seagrass-ottoman-top-pick': {
    id: 'decor-seagrass-ottoman-top-pick',
    name: 'Top pick Seagrass Woven Ottoman for Living room',
    price: 360000, // ~15$
    image: 'Image/decor2.jpg',
    category: 'Decor',
    type: 'Ottoman',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'decor-seagrass-ottoman-trendy-round': {
    id: 'decor-seagrass-ottoman-trendy-round',
    name: 'Trendy Round Seagrass Woven Ottoman',
    price: 240000, // ~10$
    image: 'Image/decor3.jpg',
    category: 'Decor',
    type: 'Ottoman',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'decor-rattan-round-tray-popular': {
    id: 'decor-rattan-round-tray-popular',
    name: 'Popular weaving rattan round tray',
    price: 600000, // ~25$
    image: 'Image/decor4.png',
    category: 'Decor',
    type: 'Tray',
    rating: 4.6,
    sizes: ['One-Size']
  },
  'decor-wicker-bamboo-rattan-tray': {
    id: 'decor-wicker-bamboo-rattan-tray',
    name: 'Wholesale wicker bamboo rattan decorative tray',
    price: 720000, // ~30$
    image: 'Image/decor5.png',
    category: 'Decor',
    type: 'Tray',
    rating: 4.8,
    sizes: ['One-Size']
  },
  'decor-seagrass-cornhusk-area-rug': {
    id: 'decor-seagrass-cornhusk-area-rug',
    name: 'Handwoven Seagrass & Corn Husk Leaf Area Rug',
    price: 360000, // ~15$
    image: 'Image/decor6.jpg',
    category: 'Decor',
    type: 'Rug',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'decor-seagrass-lantern-minimalist': {
    id: 'decor-seagrass-lantern-minimalist',
    name: 'Minimalist Natural Seagrass Lantern Wholesale',
    price: 240000, // ~10$
    image: 'Image/decor7.jpg',
    category: 'Decor',
    type: 'Lantern',
    rating: 4.6,
    sizes: ['One-Size']
  }
});

// --- LIFESTYLE PRODUCTS ---
Object.assign(PRODUCTS_DATABASE, {
  'lifestyle-bamboo-placemat-light-yellow': {
    id: 'lifestyle-bamboo-placemat-light-yellow',
    name: 'Hot Selling Light Yellow Bamboo Placemat Wholesale',
    price: 480000, // ~20$
    image: 'Image/lifestyle1.jpg',
    category: 'Lifestyle',
    type: 'Placemat',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'lifestyle-bamboo-placemat-flower-shape': {
    id: 'lifestyle-bamboo-placemat-flower-shape',
    name: 'Light Yellow Flower Shape Bamboo Placemat',
    price: 360000, // ~15$
    image: 'Image/lifestyle2.jpg',
    category: 'Lifestyle',
    type: 'Placemat',
    rating: 4.6,
    sizes: ['One-Size']
  },
  'lifestyle-seagrass-placemat-minimalism': {
    id: 'lifestyle-seagrass-placemat-minimalism',
    name: 'Multiple sizes Minimalism design Seagrass Placemat',
    price: 240000, // ~10$
    image: 'Image/lifestyle3.jpg',
    category: 'Lifestyle',
    type: 'Placemat',
    rating: 4.6,
    sizes: ['One-Size']
  },
  'lifestyle-water-hyacinth-beach-bag-elegant': {
    id: 'lifestyle-water-hyacinth-beach-bag-elegant',
    name: 'Elegant Water Hyacinth Beach Handbag Wholesale',
    price: 600000, // ~25$
    image: 'Image/lifestyle4.jpg',
    category: 'Lifestyle',
    type: 'Handbag',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'lifestyle-water-hyacinth-beach-bag-popular': {
    id: 'lifestyle-water-hyacinth-beach-bag-popular',
    name: 'Popular Water Hyacinth Beach Handbag Wholesale',
    price: 720000, // ~30$
    image: 'Image/lifestyle5.jpg',
    category: 'Lifestyle',
    type: 'Handbag',
    rating: 4.8,
    sizes: ['One-Size']
  },
  'lifestyle-seagrass-pet-lounger': {
    id: 'lifestyle-seagrass-pet-lounger',
    name: 'Natural Seagrass lounger for your pet so cute',
    price: 360000, // ~15$
    image: 'Image/lifestyle6.png',
    category: 'Lifestyle',
    type: 'Pet',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'lifestyle-round-grass-house-rabbit': {
    id: 'lifestyle-round-grass-house-rabbit',
    name: 'Unique Design Round Grass House For Rabbit',
    price: 240000, // ~10$
    image: 'Image/lifestyle7.jpg',
    category: 'Lifestyle',
    type: 'Pet',
    rating: 4.6,
    sizes: ['One-Size']
  }
});

// --- STORAGE PRODUCTS ---
Object.assign(PRODUCTS_DATABASE, {
  'storage-belly-water-hyacinth-planter': {
    id: 'storage-belly-water-hyacinth-planter',
    name: 'Belly Water Hyacinth Basket Planter Wholesale',
    price: 480000, // ~20$
    image: 'Image/storage1.jpg',
    category: 'Storage',
    type: 'Planter',
    rating: 4.8,
    sizes: ['One-Size']
  },
  'storage-seagrass-woven-planter-home-decor': {
    id: 'storage-seagrass-woven-planter-home-decor',
    name: 'Seagrass Hand Woven Basket Planter for Home Decor',
    price: 360000, // ~15$
    image: 'Image/storage2.jpg',
    category: 'Storage',
    type: 'Planter',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'storage-collapsible-planter-multipurpose': {
    id: 'storage-collapsible-planter-multipurpose',
    name: 'Collapsible Planter Basket for multiple purposes',
    price: 240000, // ~10$
    image: 'Image/storage3.jpg',
    category: 'Storage',
    type: 'Basket',
    rating: 4.6,
    sizes: ['One-Size']
  },
  'storage-water-hyacinth-basket-farmer': {
    id: 'storage-water-hyacinth-basket-farmer',
    name: 'New Water Hyacinth Basket Planter For Farmer',
    price: 600000, // ~25$
    image: 'Image/storage4.jpg',
    category: 'Storage',
    type: 'Basket',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'storage-hyacinth-laundry-baskets-rustic': {
    id: 'storage-hyacinth-laundry-baskets-rustic',
    name: 'Rustic Style Water Hyacinth Laundry Baskets',
    price: 720000, // ~30$
    image: 'Image/storage5.png',
    category: 'Storage',
    type: 'Laundry Basket',
    rating: 4.8,
    sizes: ['One-Size']
  },
  'storage-belly-seagrass-basket-elegant': {
    id: 'storage-belly-seagrass-basket-elegant',
    name: 'Elegant Belly Handwoven Seagrass Basket',
    price: 360000, // ~15$
    image: 'Image/storage6.jpg',
    category: 'Storage',
    type: 'Basket',
    rating: 4.7,
    sizes: ['One-Size']
  },
  'storage-kitchen-basket-with-strap': {
    id: 'storage-kitchen-basket-with-strap',
    name: 'Beautiful Water Hyacinth Basket with Strap for Kitchen Decor',
    price: 240000, // ~10$
    image: 'Image/storage7.png',
    category: 'Storage',
    type: 'Basket',
    rating: 4.6,
    sizes: ['One-Size']
  }
});

// Get URL parameters
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Format price with dots (VND)
function formatPrice(price) {
  return price.toLocaleString('vi-VN') + 'đ';
}

// USD categories and exchange rate
const USD_CATEGORIES = new Set(['Decor', 'Lifestyle', 'Storage']);
const EXCHANGE_RATE_VND_PER_USD = 24000; // 1 USD = 24,000 VND

function vndToUsd(vnd) {
  return vnd / EXCHANGE_RATE_VND_PER_USD;
}

function formatUSD(amount) {
  // Show integer when possible, else up to 2 decimals, with $ after number to match list cards (e.g., 10$)
  const roundedTwo = Math.round(amount * 100) / 100;
  if (Math.abs(roundedTwo - Math.round(roundedTwo)) < 0.005) {
    return Math.round(roundedTwo) + '$';
  }
  return roundedTwo.toFixed(2) + '$';
}

// Calculate CoolCash reward (7.5% of price)
function calculateCoolCash(price) {
  return Math.floor(price * 0.075);
}

// Update price, discount and CoolCash display consistently
function updatePriceAndRewards(product) {
  const originalPriceEl = document.getElementById('original-price');
  const currentPriceEl = document.getElementById('product-price');
  const discountBadgeEl = document.querySelector('.discount-badge');
  const coolCashEl = document.getElementById('coolcash-amount');
  const isUSD = USD_CATEGORIES.has(product.category);

  // Determine current price (use salePrice if available)
  const hasSale = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
  const currentPriceVND = hasSale ? product.salePrice : product.price;
  const currentDisplayValue = isUSD ? vndToUsd(currentPriceVND) : currentPriceVND;

  // Update current price
  if (currentPriceEl) {
    currentPriceEl.textContent = isUSD ? formatUSD(currentDisplayValue) : formatPrice(currentDisplayValue);
  }

  // Update original price and discount badge if on sale
  if (hasSale) {
    if (originalPriceEl) {
      const originalDisplayValue = isUSD ? vndToUsd(product.price) : product.price;
      originalPriceEl.textContent = isUSD ? formatUSD(originalDisplayValue) : formatPrice(originalDisplayValue);
      originalPriceEl.style.display = '';
    }
    if (discountBadgeEl) {
      const discountPercent = Math.round(((product.price - product.salePrice) / product.price) * 100);
      discountBadgeEl.textContent = `-${discountPercent}%`;
      discountBadgeEl.style.display = '';
    }
  } else {
    // Hide original price and discount when not on sale
    if (originalPriceEl) {
      originalPriceEl.textContent = '';
      originalPriceEl.style.display = 'none';
    }
    if (discountBadgeEl) {
      discountBadgeEl.textContent = '';
      discountBadgeEl.style.display = 'none';
    }
  }

  // Update CoolCash based on current price
  if (coolCashEl) {
    const coolCashAmount = calculateCoolCash(currentPriceVND);
    // Display CoolCash in the same currency as current price
    if (isUSD) {
      const coolCashUSD = vndToUsd(coolCashAmount);
      coolCashEl.textContent = formatUSD(coolCashUSD);
    } else {
      coolCashEl.textContent = formatPrice(coolCashAmount);
    }
  }
}

// Load product data based on URL parameter
function loadProductData() {
  const productId = getURLParameter('id');
  
  if (!productId || !PRODUCTS_DATABASE[productId]) {
    // If no product ID or invalid ID, redirect to home.html
    window.location.href = '/home.html';
    return;
  }

  const product = PRODUCTS_DATABASE[productId];
  
  // Update page title
  document.getElementById('page-title').textContent = product.name + ' - Coolmate';
  document.title = product.name + ' - Coolmate';
  
  // Update breadcrumb
  document.getElementById('breadcrumb-category').textContent = product.category;
  document.getElementById('breadcrumb-product').textContent = product.name;
  
  // Update product info
  document.getElementById('product-title').textContent = product.name;
  document.getElementById('product-rating').textContent = `(${product.rating})`;
  
  // Update prices, discount and CoolCash consistently
  updatePriceAndRewards(product);
  
  // Update main image
  const mainImage = document.getElementById('main-product-image');
  if (mainImage) {
    mainImage.src = product.image;
    mainImage.alt = product.name;
    
    // Add error handling for image loading
    mainImage.onerror = function() {
      console.log('Image failed to load, using fallback');
      this.src = 'Image/ao1.avif'; // Fallback image
    };
    
    // Ensure image is visible
    mainImage.style.display = 'block';
    mainImage.style.width = '100%';
    mainImage.style.height = 'auto';
  }
  
  // Update rating stars
  updateRatingStars(product.rating);
  
  // Load sizes
  loadProductSizes(product.sizes);
}

// Update rating stars display
function updateRatingStars(rating) {
  const starsContainer = document.getElementById('product-stars');
  starsContainer.innerHTML = '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
    starsContainer.innerHTML += '<i class="fas fa-star"></i>';
  }
  
  if (hasHalfStar) {
    starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
  }
  
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsContainer.innerHTML += '<i class="far fa-star"></i>';
  }
}

// Load product sizes
function loadProductSizes(sizes) {
  const sizeOptions = document.getElementById('size-options');
  
  if (!sizeOptions) {
    console.error('Size options element not found!');
    return;
  }
  
  // Clear existing options
  sizeOptions.innerHTML = '';
  
  // Create size options
  sizes.forEach((size, index) => {
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'size-option' + (index === 0 ? ' selected' : ''); // Select first size by default
    sizeDiv.textContent = size;
    sizeDiv.setAttribute('data-size', size);
    
    sizeDiv.addEventListener('click', function() {
      // Remove selected class from all sizes
      document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked size
      this.classList.add('selected');
    });
    
    sizeOptions.appendChild(sizeDiv);
  });
  
  // Ensure the container is visible
  sizeOptions.style.display = 'flex';
  sizeOptions.parentElement.style.display = 'block';
}

// Quantity controls
function increaseQuantity() {
  const qtyDisplay = document.getElementById('qty-display');
  if (qtyDisplay) {
    let currentValue = parseInt(qtyDisplay.textContent) || 1;
    const maxValue = 10;
    if (currentValue < maxValue) {
      qtyDisplay.textContent = currentValue + 1;
    }
    return;
  }
  const quantityInput = document.getElementById('quantity');
  if (quantityInput) {
    let currentValue = parseInt(quantityInput.value) || 1;
    const maxValue = 10;
    if (currentValue < maxValue) {
      quantityInput.value = currentValue + 1;
    }
  }
}

function decreaseQuantity() {
  const qtyDisplay = document.getElementById('qty-display');
  if (qtyDisplay) {
    let currentValue = parseInt(qtyDisplay.textContent) || 1;
    const minValue = 1;
    if (currentValue > minValue) {
      qtyDisplay.textContent = currentValue - 1;
    }
    return;
  }
  const quantityInput = document.getElementById('quantity');
  if (quantityInput) {
    let currentValue = parseInt(quantityInput.value) || 1;
    const minValue = 1;
    if (currentValue > minValue) {
      quantityInput.value = currentValue - 1;
    }
  }
}

// Add to cart function
function addToCart() {
  const productId = getURLParameter('id');
  const product = PRODUCTS_DATABASE[productId];
  
  if (!product) return;
  
  const qtyDisplay = document.getElementById('qty-display');
  let quantity = 1;
  if (qtyDisplay) {
    quantity = parseInt(qtyDisplay.textContent) || 1;
  } else {
    const quantityInput = document.getElementById('quantity');
    quantity = parseInt(quantityInput?.value) || 1;
  }
  
  // Get selected size
  const selectedSizeElement = document.querySelector('.size-option.selected');
  const selectedSize = selectedSizeElement ? selectedSizeElement.textContent : 'M';

  // Create cart item
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    size: selectedSize,
    quantity: quantity
  };

  // Add to cart using the shopping cart system
  const isUSDCategory = USD_CATEGORIES.has(product.category);
  const displayCurrency = isUSDCategory ? 'USD' : 'VND';

  if (typeof shoppingCart !== 'undefined') {
    shoppingCart.addItem(cartItem.id, cartItem.name, cartItem.price, cartItem.image, cartItem.size, cartItem.quantity, displayCurrency);
  } else if (typeof cart !== 'undefined') {
    cart.addItem(cartItem.id, cartItem.name, cartItem.price, cartItem.image, cartItem.size, cartItem.quantity, displayCurrency);
  } else {
    console.log('Cart system not found. Product data:', cartItem);
  }
  
  // Show success feedback
  showAddToCartSuccess();
}

// Show add to cart success
function showAddToCartSuccess() {
  const btn = document.querySelector('.add-pill-btn') || document.querySelector('.add-to-cart-button');
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  
  btn.innerHTML = '<i class="fas fa-check"></i> Added to cart';
  btn.style.backgroundColor = '#4caf50';
  
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.backgroundColor = '';
  }, 2000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to existing size options (fallback)
  // Chỉ áp dụng chọn size cho phần chi tiết sản phẩm
  const sizeOptionsContainer = document.getElementById('size-options');
  if (sizeOptionsContainer) {
    sizeOptionsContainer.querySelectorAll('.size-option').forEach(option => {
      option.addEventListener('click', function() {
        sizeOptionsContainer.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
      });
    });
  }
  
  // Check if image element exists and add fallback
  const mainImage = document.getElementById('main-product-image');
  if (mainImage && !mainImage.src) {
    mainImage.src = 'Image/ao1.avif'; // Default image
  }
  
  // Add error handler for main image
  if (mainImage) {
    mainImage.onerror = function() {
      this.src = 'Image/ao1.avif';
    };
  }
  
  // Load product data
  setTimeout(() => {
    loadProductData();
  }, 100); // Small delay to ensure DOM is fully ready
});
