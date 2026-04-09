import { callGraphql } from "./graphql";
import type { Mode, MyPageData, User, UserRole } from "../../../types/app";

export type AdminUser = User;

export async function callAuthMutation(
  mode: Mode,
  email: string,
  password: string,
  phone?: string,
): Promise<{ token?: string; error?: string }> {
  const mutationName = mode === "login" ? "login" : "signup";
  const query = `
    mutation ${mutationName}($input: ${
    mode === "login" ? "LoginInput!" : "SignupInput!"
  }) {
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

  const result = await callGraphql<{ myPage: MyPageData }>(query, undefined, token);
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
  const result = await callGraphql<{
    adminUpdateUserRole: AdminUser;
  }>(mutation, { userId, role }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminUpdateUserRole };
}
