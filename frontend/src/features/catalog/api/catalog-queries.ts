import {
  ADMIN_PRODUCT_UPLOAD_ENDPOINT,
} from "../../../config/app-config";
import { isCatalogUuid } from "../../../lib/app-utils";
import { callGraphql } from "./graphql";
import { ensureField } from "../utils/response-helpers";
import type {
  AccessoryItem,
  ApparelItem,
  BagItem,
  BallItem,
  CheckoutOrderResult,
  ClubItem,
  ProductDetailData,
  PlaceOrderInput,
  SaleItem,
} from "../../../types/app";
import type {
  AdminCatalogProduct,
  AdminCatalogProductsResponse,
} from "../types/catalog";

export type AdminCatalogProductInput = Omit<AdminCatalogProduct, "id">;

export async function fetchAdminCatalogProducts(
  token: string,
): Promise<{ data?: AdminCatalogProduct[]; error?: string }> {
  const query = `
    query AdminCatalogProducts($input: CatalogProductsQueryInput) {
      adminCatalogProducts(input: $input) {
        items {
          id
          source
          category
          brand
          name
          price
          originalPrice
          salePrice
          rating
          reviewCount
          badge
          imageUrl
          description
          isFeatured
          isActive
        }
        total
        page
        limit
      }
    }
  `;
  const result = await callGraphql<{
    adminCatalogProducts: AdminCatalogProductsResponse;
  }>(query, { input: { page: 1, limit: 100, includeInactive: true } }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminCatalogProducts.items ?? [] };
}

export async function adminCreateCatalogProduct(
  token: string,
  input: AdminCatalogProductInput,
): Promise<{ data?: AdminCatalogProduct; error?: string }> {
  const mutation = `
    mutation AdminCreateCatalogProduct($input: CreateCatalogProductInput!) {
      adminCreateCatalogProduct(input: $input) {
        id
        source
        category
        brand
        name
        price
        originalPrice
        salePrice
        rating
        reviewCount
        badge
        imageUrl
        description
        isFeatured
        isActive
      }
    }
  `;
  const result = await callGraphql<{
    adminCreateCatalogProduct: AdminCatalogProduct;
  }>(mutation, { input }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminCreateCatalogProduct };
}

export async function adminUpdateCatalogProduct(
  token: string,
  id: string,
  input: Partial<AdminCatalogProductInput>,
): Promise<{ data?: AdminCatalogProduct; error?: string }> {
  const mutation = `
    mutation AdminUpdateCatalogProduct($id: String!, $input: UpdateCatalogProductInput!) {
      adminUpdateCatalogProduct(id: $id, input: $input) {
        id
        source
        category
        brand
        name
        price
        originalPrice
        salePrice
        rating
        reviewCount
        badge
        imageUrl
        description
        isFeatured
        isActive
      }
    }
  `;
  const result = await callGraphql<{
    adminUpdateCatalogProduct: AdminCatalogProduct;
  }>(mutation, { id, input }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminUpdateCatalogProduct };
}

export async function adminDeleteCatalogProduct(
  token: string,
  id: string,
): Promise<{ data?: boolean; error?: string }> {
  const mutation = `
    mutation AdminDeleteCatalogProduct($id: String!) {
      adminDeleteCatalogProduct(id: $id)
    }
  `;
  const result = await callGraphql<{ adminDeleteCatalogProduct: boolean }>(
    mutation,
    { id },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminDeleteCatalogProduct ?? false };
}

export async function uploadAdminProductImage(
  token: string,
  file: File,
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(ADMIN_PRODUCT_UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = (await response.json()) as
      | { imageUrl?: string; filename?: string; message?: string }
      | { message?: string | string[] };

    if (!response.ok) {
      const message = Array.isArray(json.message)
        ? json.message[0]
        : json.message ?? "Image upload failed";
      return { error: message };
    }
    const imageUrl = "imageUrl" in json ? json.imageUrl : undefined;
    if (!imageUrl) {
      return { error: "Image upload failed" };
    }
    return { imageUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}

export async function fetchSaleProducts(
  category: string,
  sort: "DISCOUNT_DESC" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC",
  search?: string,
): Promise<{ data?: SaleItem[]; error?: string }> {
  const query = `
    query SaleProducts($input: SaleProductsInput) {
      saleProducts(input: $input) {
        id
        category
        saleGroup
        brand
        name
        rating
        reviewCount
        salePrice
        originalPrice
        badge
        imageUrl
      }
    }
  `;

  const result = await callGraphql<{ saleProducts: SaleItem[] }>(query, {
    input: {
      category,
      sort,
      search,
    },
  });
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.saleProducts ?? [] };
}

export async function fetchBrandCount(): Promise<{
  data?: number;
  error?: string;
}> {
  const query = `query { brandCount }`;
  const result = await callGraphql<{ brandCount: number }>(query, {});
  if (result.error) return { error: result.error };
  return { data: result.data?.brandCount ?? 0 };
}

export async function fetchClubProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: ClubItem[]; total: number }; error?: string }> {
  const query = `
    query ClubProducts($input: ClubProductsInput) {
      clubProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    clubProducts: { items: ClubItem[]; total: number };
  }>(query, { input });
  const ensured = ensureField(
    result,
    "clubProducts",
    "Failed to load club products",
  );
  if (ensured.error) {
    return { error: ensured.error };
  }
  return { data: ensured.data };
}

export async function fetchFeaturedProducts(
  limit = 8,
): Promise<{ data?: ClubItem[]; error?: string }> {
  const query = `
    query FeaturedProducts($limit: Float) {
      featuredProducts(limit: $limit) {
        id
        brand
        name
        price
        originalPrice
        imageUrl
      }
    }
  `;

  const result = await callGraphql<{ featuredProducts: ClubItem[] }>(query, {
    limit,
  });
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.featuredProducts ?? [] };
}

export async function fetchBallProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: BallItem[]; total: number }; error?: string }> {
  const query = `
    query BallProducts($input: BallProductsInput) {
      ballProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    ballProducts: { items: BallItem[]; total: number };
  }>(query, { input });
  const ensured = ensureField(
    result,
    "ballProducts",
    "Failed to load ball products",
  );
  if (ensured.error) {
    return { error: ensured.error };
  }
  return { data: ensured.data };
}

export async function fetchBagProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: BagItem[]; total: number }; error?: string }> {
  const query = `
    query BagProducts($input: BagProductsInput) {
      bagProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    bagProducts: { items: BagItem[]; total: number };
  }>(query, { input });
  const ensured = ensureField(
    result,
    "bagProducts",
    "Failed to load bag products",
  );
  if (ensured.error) {
    return { error: ensured.error };
  }
  return { data: ensured.data };
}

export async function fetchApparelProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: ApparelItem[]; total: number }; error?: string }> {
  const query = `
    query ApparelProducts($input: ApparelProductsInput) {
      apparelProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    apparelProducts: { items: ApparelItem[]; total: number };
  }>(query, { input });
  const ensured = ensureField(
    result,
    "apparelProducts",
    "Failed to load apparel products",
  );
  if (ensured.error) {
    return { error: ensured.error };
  }
  return { data: ensured.data };
}

export async function fetchAccessoryProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: AccessoryItem[]; total: number }; error?: string }> {
  const query = `
    query AccessoryProducts($input: AccessoryProductsInput) {
      accessoryProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    accessoryProducts: { items: AccessoryItem[]; total: number };
  }>(query, { input });
  const ensured = ensureField(
    result,
    "accessoryProducts",
    "Failed to load accessory products",
  );
  if (ensured.error) {
    return { error: ensured.error };
  }
  return { data: ensured.data };
}

export async function fetchProductById(
  id: string,
): Promise<{ data?: ProductDetailData; error?: string }> {
  const trimmed = id.trim();
  if (!isCatalogUuid(trimmed)) {
    return { error: "LEGACY_OR_INVALID_PRODUCT_ID" };
  }

  const query = `
    query ProductById($id: String!) {
      productById(id: $id) {
        id
        source
        category
        brand
        name
        rating
        reviewCount
        price
        originalPrice
        badge
        imageUrl
        description
      }
    }
  `;

  const result = await callGraphql<{ productById: ProductDetailData | null }>(
    query,
    {
      id: trimmed,
    },
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.productById) {
    return { error: "Product not found" };
  }
  return { data: result.data.productById };
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ data?: CheckoutOrderResult; error?: string }> {
  const mutation = `
    mutation PlaceOrder($input: PlaceOrderInput!) {
      placeOrder(input: $input) {
        orderNumber
        placedAtIso
        subtotal
        shippingCost
        tax
        total
        currency
        paymentMethod
        shippingMethod
        contactEmail
        deliveryName
        deliveryAddressLine1
        deliveryAddressLine2
        deliveryCity
        deliveryRegion
        deliveryPostalCode
        deliveryCountry
        items {
          id
          brand
          name
          quantity
          unitPrice
          lineTotal
        }
      }
    }
  `;
  const result = await callGraphql<{ placeOrder: CheckoutOrderResult }>(
    mutation,
    { input },
  );
  if (result.error) return { error: result.error };
  if (!result.data?.placeOrder) return { error: "Failed to place order" };
  return { data: result.data.placeOrder };
}
