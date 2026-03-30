export type SupportFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  audience: string;
  featured: boolean;
};

export type SupportTicket = {
  id: string;
  referenceNumber: string;
  name: string;
  email: string;
  topic: string;
  orderNumber?: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export type SupportOrderStatus = {
  orderNumber: string;
  placedAtIso: string;
  status: string;
  shippingMethod: string;
  paymentMethod: string;
  deliveryName: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryCountry: string;
  total: number;
  items: Array<{
    id: string;
    brand: string;
    name: string;
    quantity: number;
    lineTotal: number;
  }>;
};

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const GRAPHQL_ENDPOINT = `${API_BASE}/graphql`;

async function callGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: TData; error?: string }> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = (await response.json()) as {
      data?: TData;
      errors?: Array<{ message?: string }>;
    };

    if (!response.ok) {
      return {
        error:
          json.errors?.[0]?.message ??
          `Request failed with status ${response.status}`,
      };
    }

    if (json.errors?.length) {
      return {
        error: json.errors[0].message ?? 'Request failed.',
      };
    }

    return { data: json.data };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Could not reach the support service.',
    };
  }
}

export async function fetchSupportFaqs(
  locale?: string,
  category?: string,
  featuredOnly?: boolean,
) {
  const query = `
    query SupportFaqs($locale: String, $category: String, $featuredOnly: Boolean) {
      supportFaqs(locale: $locale, category: $category, featuredOnly: $featuredOnly) {
        id
        category
        question
        answer
        audience
        featured
      }
    }
  `;

  return callGraphql<{ supportFaqs: SupportFaq[] }>(query, {
    locale,
    category,
    featuredOnly,
  });
}

export async function submitSupportRequest(input: {
  name: string;
  email: string;
  topic: string;
  orderNumber?: string;
  message: string;
}) {
  const mutation = `
    mutation SubmitSupportRequest($input: CreateSupportRequestInput!) {
      submitSupportRequest(input: $input) {
        id
        referenceNumber
        name
        email
        topic
        orderNumber
        message
        status
        createdAt
      }
    }
  `;

  return callGraphql<{ submitSupportRequest: SupportTicket }>(mutation, { input });
}

export async function lookupSupportOrder(orderNumber: string, email: string) {
  const query = `
    query SupportOrderLookup($orderNumber: String!, $email: String!) {
      supportOrderLookup(orderNumber: $orderNumber, email: $email) {
        orderNumber
        placedAtIso
        status
        shippingMethod
        paymentMethod
        deliveryName
        deliveryCity
        deliveryRegion
        deliveryCountry
        total
        items {
          id
          brand
          name
          quantity
          lineTotal
        }
      }
    }
  `;

  return callGraphql<{ supportOrderLookup: SupportOrderStatus }>(query, {
    orderNumber,
    email,
  });
}
