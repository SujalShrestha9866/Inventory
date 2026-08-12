-- Business Management System
-- Final corrected schema

CREATE DATABASE management_system;

-- Category
CREATE TABLE category (
                          category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          category_name VARCHAR(50)  NOT NULL UNIQUE,
                          created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product
CREATE TABLE product (
                         product_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                         category_id   UUID         NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT,
                         product_name  VARCHAR(100) NOT NULL,
                         selling_price DECIMAL(10,4) NOT NULL CHECK (selling_price >= 0),
                         unit          VARCHAR(20)  NOT NULL,
                         is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
                         created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventory  (one row per product — enforced by UNIQUE on product_id)
CREATE TABLE inventory (
                           inventory_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                           product_id         UUID          NOT NULL UNIQUE REFERENCES product(product_id),
                           remaining_quantity DECIMAL(10,4) NOT NULL CHECK (remaining_quantity >= 0),  -- FIX 1: column name spelling
                           updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventory log
CREATE TABLE inventory_log (
                               log_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                               product_id      UUID          NOT NULL REFERENCES product(product_id),
                               change_quantity DECIMAL(10,4) NOT NULL CHECK (change_quantity > 0),
                               change_type     VARCHAR(10)   NOT NULL CHECK (change_type IN ('IN', 'OUT')),
                               reason          VARCHAR(30)   NOT NULL CHECK (reason IN ('Sales','Purchase','SalesReturn','PurchaseReturn','Damages','Adjustment')),
                               reference_type  VARCHAR(255),
                               created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Party
CREATE TABLE party (
                       party_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                       party_name    VARCHAR(50) NOT NULL,
                       party_address VARCHAR(60) NOT NULL,
                       party_contact VARCHAR(30) NOT NULL UNIQUE,
                       is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
                       created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Party role  (FIX 7: UNIQUE on party_id + role to prevent duplicates)
CREATE TABLE party_role (
                            party_role_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                            party_id      UUID        NOT NULL REFERENCES party(party_id),
                            role          VARCHAR(50) NOT NULL CHECK (role IN ('Customer', 'Supplier')),
                            created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE (party_id, role)
);

-- Staff
CREATE TABLE staff (
                       staff_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                       staff_name        VARCHAR(50)   NOT NULL,
                       staff_role        VARCHAR(50)   NOT NULL,
                       staff_contact     VARCHAR(30)   NOT NULL UNIQUE,
                       staff_email       VARCHAR(100)  UNIQUE,
                       staff_salary      DECIMAL(10,4) NOT NULL CHECK (staff_salary > 0),
                       staff_joining_date DATE         NOT NULL,
                       is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
                       created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System user  (linked to staff via staff_id)
CREATE TABLE system_user (
                             system_user_id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                             staff_id               UUID         NOT NULL UNIQUE REFERENCES staff(staff_id),
                             system_user_name       VARCHAR(30)  NOT NULL UNIQUE,
                             system_user_email      VARCHAR(100) UNIQUE,
                             system_user_password_hash VARCHAR(255) NOT NULL,
                             user_role              VARCHAR(20)  NOT NULL CHECK (user_role IN ('Admin', 'Staff')),
                             is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
                             created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sale
CREATE TABLE sale (
                      sales_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                      party_id   UUID        NOT NULL REFERENCES party(party_id),
                      sales_by   UUID        NOT NULL REFERENCES staff(staff_id),
                      sales_type VARCHAR(20) NOT NULL CHECK (sales_type IN ('Cash','OnlineTransfer','Credit','Return')),
                      sales_date DATE        NOT NULL,
                      created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP   -- FIX 2: removed trailing comma
);

-- Sale item
CREATE TABLE sale_item (
                           sale_item_id   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                           sales_id       UUID          NOT NULL REFERENCES sale(sales_id),
                           product_id     UUID          NOT NULL REFERENCES product(product_id),
                           sales_quantity DECIMAL(10,4) NOT NULL CHECK (sales_quantity > 0),
                           sales_price    DECIMAL(10,4) NOT NULL CHECK (sales_price >= 0),
                           created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Purchase
CREATE TABLE purchase (
                          purchase_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                          party_id      UUID        NOT NULL REFERENCES party(party_id),
                          created_by    UUID        NOT NULL REFERENCES staff(staff_id),
                          purchase_type VARCHAR(20) NOT NULL CHECK (purchase_type IN ('Cash','OnlineTransfer','Credit','Return')),
                          purchase_date DATE        NOT NULL,
                          created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Purchase item
CREATE TABLE purchase_item (
                               purchase_item_id UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                               purchase_id      UUID          NOT NULL REFERENCES purchase(purchase_id),
                               product_id       UUID          NOT NULL REFERENCES product(product_id),
                               expiry_date      DATE,
                               product_quantity DECIMAL(10,4) NOT NULL CHECK (product_quantity > 0),
                               purchase_price   DECIMAL(10,4) NOT NULL CHECK (purchase_price > 0),
                               created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ledger
CREATE TABLE ledger (
                        ledger_id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                        party_id         UUID          NOT NULL REFERENCES party(party_id),
                        transaction_type VARCHAR(20)   NOT NULL CHECK (transaction_type IN ('Sale','Purchase','Payment','Adjustment')),  -- FIX 4
                        reference_id     UUID          NOT NULL,
                        credit           DECIMAL(10,4) NOT NULL CHECK (credit >= 0),   -- FIX 3
                        debit            DECIMAL(10,4) NOT NULL CHECK (debit >= 0),    -- FIX 3
                        created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment
CREATE TABLE payment (
                         payment_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                         party_id       UUID          REFERENCES party(party_id),
                         staff_id       UUID          REFERENCES staff(staff_id),
                         payment_type   VARCHAR(20)   NOT NULL CHECK (payment_type IN ('Received','Paid')),  -- FIX 5
                         payment_method VARCHAR(20)   NOT NULL CHECK (payment_method IN ('Cash','Cheque','OnlineTransfer')),
                         amount         DECIMAL(10,4) NOT NULL CHECK (amount > 0),
                         reference_note VARCHAR(200)  NOT NULL,
                         payment_date   DATE          NOT NULL,
                         created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         CHECK (party_id IS NOT NULL OR staff_id IS NOT NULL)
);

-- Expenses
CREATE TABLE expenses (
                          expense_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
                          paid_by        UUID          NOT NULL REFERENCES staff(staff_id),
                          expense_type   VARCHAR(100)  NOT NULL,
                          expense_name   VARCHAR(100)  NOT NULL,
                          expense_amount DECIMAL(10,4) NOT NULL CHECK (expense_amount > 0),
                          payment_method VARCHAR(20)   NOT NULL CHECK (payment_method IN ('Cash','Cheque','OnlineTransfer')),  -- FIX 6
                          expense_date   DATE          NOT NULL,
                          created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);