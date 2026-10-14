import type { Category, SubCategory, Brand, Product } from "@/types/product";

export const categories: Category[] = [
  {
    "id": "cat_1",
    "name": "Men",
    "slug": "men"
  },
  {
    "id": "cat_2",
    "name": "Girls",
    "slug": "girls"
  },
  {
    "id": "cat_3",
    "name": "Baby Boy",
    "slug": "baby-boy"
  },
  {
    "id": "cat_4",
    "name": "Baby Girl",
    "slug": "baby-girl"
  }
];

export const subCategories: SubCategory[] = [
  {
    "id": "sub_1",
    "name": "Jackets",
    "slug": "jackets",
    "categorySlug": "men"
  },
  {
    "id": "sub_2",
    "name": "T-Shirts",
    "slug": "t-shirts",
    "categorySlug": "men"
  },
  {
    "id": "sub_3",
    "name": "Jeans",
    "slug": "jeans",
    "categorySlug": "men"
  },
  {
    "id": "sub_4",
    "name": "Dresses",
    "slug": "dresses",
    "categorySlug": "girls"
  },
  {
    "id": "sub_5",
    "name": "Sneakers",
    "slug": "sneakers",
    "categorySlug": "men"
  }
];

export const brands: Brand[] = [
  {
    "id": "brand_1",
    "name": "Nike",
    "slug": "nike"
  },
  {
    "id": "brand_2",
    "name": "Under Armour",
    "slug": "under-armour"
  },
  {
    "id": "brand_3",
    "name": "Tommy Hilfiger",
    "slug": "tommy-hilfiger"
  },
  {
    "id": "brand_4",
    "name": "Alexander McQueen",
    "slug": "alexander-mcqueen"
  }
];

export const products: Product[] = [
  {
    "id": "prod_1",
    "name": "Nike Men's Soccer Track Jacket",
    "slug": "nike-mens-soccer-track-jacket",
    "sku": "SKU-100001",
    "description": "Authentic Nike track jacket with full-zip front, breathable mesh lining, and classic stripe detail.",
    "material": "Polyester",
    "country": "Vietnam",
    "weight": 0.45,
    "stock": 42,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      "Blue",
      "White"
    ],
    "rating": 4.7,
    "reviewCount": 184,
    "originalPrice": 1290,
    "discountPercent": 15,
    "finalPrice": 1096.5,
    "categoryId": "cat_1",
    "categorySlug": "men",
    "categoryName": "Men",
    "subCategoryId": "sub_1",
    "subCategorySlug": "jackets",
    "subCategoryName": "Jackets",
    "brandId": "brand_1",
    "brandName": "Nike",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/0/06/Blue_Nike_US_N98_Men%27s_Soccer_Track_Jacket_front.JPG",
    "images": [
      "https://upload.wikimedia.org/wikipedia/commons/0/06/Blue_Nike_US_N98_Men%27s_Soccer_Track_Jacket_front.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/7/75/Blue_Nike_US_N98_Men%27s_Soccer_Track_Jacket_rear.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/c/cb/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_front_1.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/b/b6/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_front_2.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/2/21/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_rear.JPG"
    ],
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "prod_2",
    "name": "Under Armour Blue Performance T-Shirt",
    "slug": "under-armour-blue-performance-tshirt",
    "sku": "SKU-100002",
    "description": "Under Armour performance tee with moisture-wicking HeatGear fabric and athletic fit.",
    "material": "Polyester",
    "country": "China",
    "weight": 0.2,
    "stock": 68,
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "colors": [
      "Blue",
      "White",
      "Black"
    ],
    "rating": 4.5,
    "reviewCount": 92,
    "originalPrice": 499,
    "discountPercent": 10,
    "finalPrice": 449.1,
    "categoryId": "cat_1",
    "categorySlug": "men",
    "categoryName": "Men",
    "subCategoryId": "sub_2",
    "subCategorySlug": "t-shirts",
    "subCategoryName": "T-Shirts",
    "brandId": "brand_2",
    "brandName": "Under Armour",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/1/16/Under_Armour_T-Shirt_%28Blue%29.jpg",
    "images": [
      "https://upload.wikimedia.org/wikipedia/commons/1/16/Under_Armour_T-Shirt_%28Blue%29.jpg"
    ],
    "createdAt": "2026-01-02T00:00:00.000Z"
  },
  {
    "id": "prod_3",
    "name": "Tommy Hilfiger Classic Fit Jeans",
    "slug": "tommy-hilfiger-classic-fit-jeans",
    "sku": "SKU-100003",
    "description": "Classic-fit denim jeans by Tommy Hilfiger with straight leg and five-pocket styling.",
    "material": "Denim",
    "country": "Bangladesh",
    "weight": 0.55,
    "stock": 30,
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "colors": [
      "Blue",
      "Grey"
    ],
    "rating": 4.6,
    "reviewCount": 210,
    "originalPrice": 1499,
    "discountPercent": 20,
    "finalPrice": 1199.2,
    "categoryId": "cat_1",
    "categorySlug": "men",
    "categoryName": "Men",
    "subCategoryId": "sub_3",
    "subCategorySlug": "jeans",
    "subCategoryName": "Jeans",
    "brandId": "brand_3",
    "brandName": "Tommy Hilfiger",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/3/30/Blauwe_jeans%2C_merk_Tommy_Hilfiger%2C_maat_3334%2C_objectnr_86975-2%281%29.JPG",
    "images": [
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Blauwe_jeans%2C_merk_Tommy_Hilfiger%2C_maat_3334%2C_objectnr_86975-2%281%29.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/4/45/Blauwe_jeans%2C_merk_Tommy_Hilfiger%2C_maat_3334%2C_objectnr_86975-2%282%29.JPG"
    ],
    "createdAt": "2026-01-03T00:00:00.000Z"
  },
  {
    "id": "prod_4",
    "name": "Alexander McQueen Velvet Evening Dress",
    "slug": "alexander-mcqueen-velvet-evening-dress",
    "sku": "SKU-100004",
    "description": "Luxury velvet evening dress with structured silhouette and signature tailoring.",
    "material": "Silk",
    "country": "Italy",
    "weight": 0.6,
    "stock": 12,
    "sizes": [
      "XS",
      "S",
      "M",
      "L"
    ],
    "colors": [
      "Red",
      "Black",
      "Green"
    ],
    "rating": 4.9,
    "reviewCount": 64,
    "originalPrice": 4999,
    "discountPercent": 5,
    "finalPrice": 4749.05,
    "categoryId": "cat_2",
    "categorySlug": "girls",
    "categoryName": "Girls",
    "subCategoryId": "sub_4",
    "subCategorySlug": "dresses",
    "subCategoryName": "Dresses",
    "brandId": "brand_4",
    "brandName": "Alexander McQueen",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Alexander_McQueen_dress_photo_2011.jpg",
    "images": [
      "https://upload.wikimedia.org/wikipedia/commons/4/4c/Alexander_McQueen_dress_photo_2011.jpg"
    ],
    "createdAt": "2026-01-04T00:00:00.000Z"
  },
  {
    "id": "prod_5",
    "name": "Nike Vaporfly Next White Sneakers",
    "slug": "nike-vaporfly-next-white-sneakers",
    "sku": "SKU-100005",
    "description": "Nike Vaporfly Next running sneakers with responsive foam and breathable upper.",
    "material": "Synthetic",
    "country": "China",
    "weight": 0.35,
    "stock": 55,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      "White",
      "Blue"
    ],
    "rating": 4.8,
    "reviewCount": 420,
    "originalPrice": 1899,
    "discountPercent": 12,
    "finalPrice": 1671.12,
    "categoryId": "cat_1",
    "categorySlug": "men",
    "categoryName": "Men",
    "subCategoryId": "sub_5",
    "subCategorySlug": "sneakers",
    "subCategoryName": "Sneakers",
    "brandId": "brand_1",
    "brandName": "Nike",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/8/81/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_01.jpg",
    "images": [
      "https://upload.wikimedia.org/wikipedia/commons/8/81/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_01.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d5/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_03.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e1/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_04.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/37/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_05.jpg"
    ],
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
];
