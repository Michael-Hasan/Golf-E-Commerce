import {
  ADMIN_PRODUCT_UPLOAD_ENDPOINT,
  GRAPHQL_ENDPOINT,
} from "../config/app-config";
import { isCatalogUuid } from "./app-utils";
import type {
  AccessoryItem,
  ApparelItem,
  BagItem,
  BallItem,
  CheckoutOrderResult,
  ClubItem,
  Mode,
  MyPageData,
  PlaceOrderInput,
  ProductDetailData,
  SaleItem,
  User,
  UserRole,
} from "../types/app";

export type AdminUser = User;
export type CatalogProductSource =
  | "CLUBS"
  | "BALLS"
  | "BAGS"
  | "APPAREL"
  | "ACCESSORIES"
  | "SALE";

export type AdminCatalogProduct = {
  id: string;
  source: CatalogProductSource;
  category: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

type AdminCatalogProductsResponse = {
  items: AdminCatalogProduct[];
  total: number;
  page: number;
  limit: number;
};

export async function callGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<{ data?: TData; error?: string }> {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      const rawBody = await res.text();
      if (!rawBody.trim()) {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        return {
          error: `The backend at ${GRAPHQL_ENDPOINT} returned an empty response.`,
        };
      }

      let json: {
        data?: TData;
        errors?: Array<{ message?: string }>;
      };

      try {
        json = JSON.parse(rawBody) as {
          data?: TData;
          errors?: Array<{ message?: string }>;
        };
      } catch {
        const contentType =
          res.headers.get("content-type") ?? "unknown content type";
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        return {
          error: `The backend at ${GRAPHQL_ENDPOINT} returned an invalid response (${contentType}).`,
        };
      }

      if (!res.ok) {
        return {
          error:
            json.errors?.[0]?.message ??
            `Request failed with status ${res.status} ${res.statusText}`,
        };
      }

      if (json.errors && json.errors.length) {
        return { error: json.errors[0].message ?? "Unknown error" };
      }

      return { data: json.data };
    } catch (error) {
      if (error instanceof TypeError && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        continue;
      }
      if (error instanceof TypeError) {
        return {
          error: `Could not reach the backend at ${GRAPHQL_ENDPOINT}. Make sure the backend server is running.`,
        };
      }
      return { error: error instanceof Error ? error.message : "Network error" };
    }
  }

  return {
    error: `Could not reach the backend at ${GRAPHQL_ENDPOINT}. Make sure the backend server is running.`,
  };
}

export async function callAuthMutation(
  mode: Mode,
  email: string,
  password: string,
  phone?: string,
): Promise<{ token?: string; error?: string }> {
  const mutationName = mode === "login" ? "login" : "signup";
  const query = `
    mutation ${mutationName}($input: ${mode === "login" ? "LoginInput!" : "SignupInput!"}) {
      ${mutationName}(input: $input) {
        accessToken
      }
    }
  `;

  const result = await callGraphql<{
    login?: { accessToken: string };
    signup?: { accessToken: string };
  }>(query, {
    input: mode === "login" ? { email, password } : { email, password, phone },
  });

  if (result.error) {
    return { error: result.error };
  }

  const payload = result.data?.[mutationName];
  const token = payload?.accessToken;
  if (!token) {
    return { error: "No token returned from server" };
  }

  return { token };
}

export async function fetchMyPage(
  token: string,
): Promise<{ data?: MyPageData; error?: string }> {
  const query = `
    query MyPage {
      myPage {
        displayName
        memberTier
        user {
          id
          email
          phone
          firstName
          lastName
          role
        }
        stats {
          totalOrders
          wishlistItems
          rewardPoints
        }
        recentOrders {
          orderNumber
          orderDate
          itemCount
          status
          totalAmount
        }
        wishlist {
          brand
          productName
          price
        }
        savedAddresses {
          label
          line1
          line2
          city
          region
          postalCode
          country
          isDefault
        }
      }
    }
  `;

  const result = await callGraphql<{ myPage: MyPageData }>(
    query,
    undefined,
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.myPage) {
    return { error: "Unable to load account details" };
  }
  return { data: result.data.myPage };
}

export async function updateMyProfile(
  token: string,
  input: { firstName: string; lastName: string; phone: string },
): Promise<{ data?: MyPageData; error?: string }> {
  const mutation = `
    mutation UpdateMyProfile($input: UpdateProfileInput!) {
      updateMyProfile(input: $input) {
        displayName
        memberTier
        user {
          id
          email
          phone
          firstName
          lastName
          role
        }
        stats {
          totalOrders
          wishlistItems
          rewardPoints
        }
        recentOrders {
          orderNumber
          orderDate
          itemCount
          status
          totalAmount
        }
        wishlist {
          brand
          productName
          price
        }
        savedAddresses {
          label
          line1
          line2
          city
          region
          postalCode
          country
          isDefault
        }
      }
    }
  `;

  const result = await callGraphql<{ updateMyProfile: MyPageData }>(
    mutation,
    {
      input,
    },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.updateMyProfile) {
    return { error: "Unable to update profile" };
  }
  return { data: result.data.updateMyProfile };
}

export async function fetchAdminUsers(
  token: string,
): Promise<{ data?: AdminUser[]; error?: string }> {
  const query = `
    query AdminUsers {
      adminUsers {
        id
        email
        phone
        firstName
        lastName
        role
      }
    }
  `;

  const result = await callGraphql<{ adminUsers: AdminUser[] }>(
    query,
    undefined,
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminUsers ?? [] };
}

export async function adminUpdateUserRole(
  token: string,
  userId: string,
  role: UserRole,
): Promise<{ data?: AdminUser; error?: string }> {
  const mutation = `
    mutation AdminUpdateUserRole($userId: String!, $role: UserRole!) {
      adminUpdateUserRole(userId: $userId, role: $role) {
        id
        email
        phone
        firstName
        lastName
        role
      }
    }
  `;

  const result = await callGraphql<{ adminUpdateUserRole: AdminUser }>(
    mutation,
    { userId, role },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.adminUpdateUserRole) {
    return { error: "Unable to update user role" };
  }
  return { data: result.data.adminUpdateUserRole };
}

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
  input: Omit<AdminCatalogProduct, "id">,
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
  input: Partial<Omit<AdminCatalogProduct, "id">>,
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
        : (json.message ?? "Image upload failed");
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

export async function fetchBrandCount(): Promise<{ data?: number; error?: string }> {
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
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.clubProducts) {
    return { error: "Failed to load club products" };
  }
  return { data: result.data.clubProducts };
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
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.ballProducts) {
    return { error: "Failed to load ball products" };
  }
  return { data: result.data.ballProducts };
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
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.bagProducts) {
    return { error: "Failed to load bag products" };
  }
  return { data: result.data.bagProducts };
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
}): Promise<{
  data?: { items: ApparelItem[]; total: number };
  error?: string;
}> {
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
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.apparelProducts) {
    return { error: "Failed to load apparel products" };
  }
  return { data: result.data.apparelProducts };
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
}): Promise<{
  data?: { items: AccessoryItem[]; total: number };
  error?: string;
}> {
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
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.accessoryProducts) {
    return { error: "Failed to load accessory products" };
  }
  return { data: result.data.accessoryProducts };
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
