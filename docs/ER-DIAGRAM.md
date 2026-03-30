# Golf E-Commerce — Entity Relationship Diagram

High-level data model (Amazon-style e-commerce architecture).

## Visual diagram

A rendered ER diagram image is available at:

**`assets/golf-ecommerce-er-diagram.png`**

---

## How to view the Mermaid source

- **GitHub / GitLab:** Renders Mermaid below automatically.
- **VS Code:** Install extension "Markdown Preview Mermaid Support" and preview this file.
- **Online:** Paste the code block into [mermaid.live](https://mermaid.live).

---

## Mermaid ER diagram

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string phone
        string password_hash
        timestamp created_at
    }

    addresses {
        uuid id PK
        uuid user_id FK
        string label
        string street
        string city
        string state
        string postal_code
        string country
        boolean is_default
        timestamp created_at
    }

    categories {
        uuid id PK
        uuid parent_id FK
        string name
        string slug UK
        string description
        int sort_order
        timestamp created_at
    }

    products {
        uuid id PK
        uuid category_id FK
        string name
        string slug UK
        string description
        decimal price
        string sku UK
        int stock_quantity
        string image_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    orders {
        uuid id PK
        uuid user_id FK
        uuid shipping_address_id FK
        string status
        decimal subtotal
        decimal tax
        decimal shipping_cost
        decimal total
        string currency
        timestamp created_at
        timestamp updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }

    cart_items {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        int quantity
        timestamp created_at
        timestamp updated_at
    }

    reviews {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        int rating
        string title
        text body
        boolean is_verified_purchase
        timestamp created_at
    }

    users ||--o{ addresses : "has"
    users ||--o{ orders : "places"
    users ||--o{ cart_items : "has"
    users ||--o{ reviews : "writes"

    categories ||--o{ products : "contains"
    categories ||--o| categories : "parent"

    products ||--o{ order_items : "ordered as"
    products ||--o{ cart_items : "in cart"
    products ||--o{ reviews : "receives"

    orders ||--|{ order_items : "contains"
    orders }o--|| addresses : "ships to"
```

---

## Entity summary

| Entity       | Purpose |
|-------------|---------|
| **users**   | Customer accounts (auth, profile). |
| **addresses** | Shipping/billing addresses per user. |
| **categories** | Product taxonomy (e.g. Clubs, Balls, Bags); supports parent/child. |
| **products** | Catalog (name, price, SKU, stock, category). |
| **orders**  | Customer orders (totals, status, shipping address). |
| **order_items** | Line items (product, quantity, price at order time). |
| **cart_items** | Active shopping cart (user, product, quantity). |
| **reviews** | Product reviews (user, rating, title, body, optional verified purchase). |

---

## Implemented vs planned

- **Implemented:** `users` (see `backend/src/users/user.entity.ts`).
- **Planned:** `addresses`, `categories`, `products`, `orders`, `order_items`, `cart_items`, `reviews` — to be added as you build out the API.
