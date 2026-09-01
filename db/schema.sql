
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS orders (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  uid                     VARCHAR(50)  DEFAULT NULL,
  order_number            VARCHAR(50)  DEFAULT NULL,
  institution_id          INT          DEFAULT NULL,
  institution_name        VARCHAR(200) DEFAULT NULL,
  institution_abbr        VARCHAR(50)  DEFAULT NULL,
  institution_domain      VARCHAR(200) DEFAULT NULL,
  payment_status          ENUM('none','unpaid','paid','down_payment','refunded','cancelled') DEFAULT 'none',
  payment_method          VARCHAR(100) DEFAULT NULL,
  payment_reference       VARCHAR(100) DEFAULT NULL,
  payment_proof           TEXT         DEFAULT NULL,
  payment_proof_uploaded_on DATETIME   DEFAULT NULL,
  payment_detail          TEXT         DEFAULT NULL,
  payment_journal_code    VARCHAR(50)  DEFAULT NULL,
  dp_payment_method       VARCHAR(100) DEFAULT NULL,
  dp_payment_detail       TEXT         DEFAULT NULL,
  dp_payment_proof        TEXT         DEFAULT NULL,
  dp_payment_proof_uploaded_on DATETIME DEFAULT NULL,
  dp_payment_journal_code VARCHAR(50)  DEFAULT NULL,
  payment_due_date        DATE         DEFAULT NULL,
  discount_code           VARCHAR(50)  DEFAULT NULL,
  discount_type           VARCHAR(20)  DEFAULT NULL,
  discount_value          DECIMAL(15,2) DEFAULT 0,
  tax_percent             DECIMAL(10,2) DEFAULT 0,
  tax_value               DECIMAL(15,2) DEFAULT 0,
  shipping_fee            DECIMAL(15,2) DEFAULT 0,
  other_fee               DECIMAL(15,2) DEFAULT 0,
  subtotal                DECIMAL(15,2) DEFAULT 0,
  total_amount            DECIMAL(15,2) DEFAULT 0,
  dp_amount               DECIMAL(15,2) DEFAULT 0,
  grand_total             DECIMAL(15,2) DEFAULT 0,
  order_type              ENUM('package','id_card','lanyard','custom','service') DEFAULT 'custom',
  order_date              DATE         DEFAULT NULL,
  deadline                DATE         DEFAULT NULL,
  status                  ENUM('ordered','confirmed','in_production','qc','ready','shipped','delivered','done','rejected','cancelled','pending') DEFAULT 'pending',
  status_printed          VARCHAR(20)  DEFAULT 'waiting',
  notes                   TEXT         DEFAULT NULL,
  images                  TEXT         DEFAULT NULL,
  drive_folder_id         INT          DEFAULT NULL,
  pic_name                VARCHAR(200) DEFAULT NULL,
  pic_phone               VARCHAR(50)  DEFAULT NULL,
  review                  TEXT         DEFAULT NULL,
  rating                  DECIMAL(3,1) DEFAULT NULL,
  shipping_address        TEXT         DEFAULT NULL,
  shipping_contact        VARCHAR(100) DEFAULT NULL,
  created_by              TEXT         DEFAULT NULL,
  is_archive              TINYINT(1)   DEFAULT 0,
  is_portfolio            TINYINT(1)   DEFAULT 0,
  is_sponsor              TINYINT(1)   DEFAULT 0,
  is_kkn                  TINYINT(1)   DEFAULT 0,
  kkn_source              VARCHAR(100) DEFAULT NULL,
  kkn_period              VARCHAR(100) DEFAULT NULL,
  kkn_year                VARCHAR(20)  DEFAULT NULL,
  is_personal             TINYINT(1)   DEFAULT 0,
  kkn_type                VARCHAR(100) DEFAULT NULL,
  kkn_detail              TEXT         DEFAULT NULL,
  created_on              DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on             DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on              DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_status (status),
  KEY idx_orders_payment_status (payment_status),
  KEY idx_orders_order_date (order_date),
  KEY idx_orders_institution_id (institution_id),
  KEY idx_orders_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  order_number        VARCHAR(50)  DEFAULT NULL,
  product_id          INT          DEFAULT NULL,
  category_id         INT          DEFAULT NULL,
  category_name       VARCHAR(200) DEFAULT NULL,
  price_rule_id       INT          DEFAULT NULL,
  price_rule_min_qty  INT          DEFAULT NULL,
  price_rule_value    DECIMAL(15,2) DEFAULT NULL,
  variant_id          INT          DEFAULT NULL,
  variant_name        VARCHAR(200) DEFAULT NULL,
  variant_price       DECIMAL(15,2) DEFAULT NULL,
  variant_final_price DECIMAL(15,2) DEFAULT NULL,
  product_name        VARCHAR(200) DEFAULT NULL,
  product_type        ENUM('single','package','material','custom','addon') DEFAULT 'single',
  qty                 INT          DEFAULT 1,
  unit_price          DECIMAL(15,2) DEFAULT 0,
  discount_type       VARCHAR(20)  DEFAULT NULL,
  discount_value      DECIMAL(15,2) DEFAULT 0,
  tax_percent         DECIMAL(10,2) DEFAULT 0,
  subtotal            DECIMAL(15,2) DEFAULT 0,
  discount_total      DECIMAL(15,2) DEFAULT 0,
  tax_value           DECIMAL(15,2) DEFAULT 0,
  total_after_tax     DECIMAL(15,2) DEFAULT 0,
  notes               TEXT         DEFAULT NULL,
  created_on          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on         DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on          DATETIME     DEFAULT NULL,
  KEY idx_order_items_order_number (order_number),
  KEY idx_order_items_product_id (product_id),
  KEY idx_order_items_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  category_id       INT          DEFAULT NULL,
  category_name     VARCHAR(200) DEFAULT NULL,
  uid               VARCHAR(50)  DEFAULT NULL,
  code              VARCHAR(50)  DEFAULT NULL,
  name              VARCHAR(200) DEFAULT NULL,
  image             TEXT         DEFAULT NULL,
  description       TEXT         DEFAULT NULL,
  type              ENUM('single','package','material') DEFAULT 'single',
  show_in_dashboard TINYINT(1)   DEFAULT 0,
  subtotal          DECIMAL(15,2) DEFAULT 0,
  hpp_price         DECIMAL(15,2) DEFAULT 0,
  discount_value    DECIMAL(15,2) DEFAULT 0,
  tax_fee           DECIMAL(15,2) DEFAULT 0,
  other_fee         DECIMAL(15,2) DEFAULT 0,
  total_price       DECIMAL(15,2) DEFAULT 0,
  created_on        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on       DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on        DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_products_code (code),
  KEY idx_products_category_id (category_id),
  KEY idx_products_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  fullname       VARCHAR(200) DEFAULT NULL,
  email          VARCHAR(200) DEFAULT NULL,
  phone          VARCHAR(20)  DEFAULT NULL,
  role           ENUM('admin','user','manager','staff','developer','ceo','customer') DEFAULT 'customer',
  session_token  VARCHAR(255) DEFAULT NULL,
  session_expired DATETIME    DEFAULT NULL,
  is_active      TINYINT(1)   DEFAULT 1,
  deleted        TINYINT(1)   DEFAULT 0,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_auth (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          DEFAULT NULL,
  email              VARCHAR(200) DEFAULT NULL,
  password_hash      VARCHAR(255) DEFAULT NULL,
  email_verified     TINYINT(1)   DEFAULT 0,
  last_login         DATETIME     DEFAULT NULL,
  failed_attempt     INT          DEFAULT 0,
  locked_until       DATETIME     DEFAULT NULL,
  session_token_hash VARCHAR(64)  DEFAULT NULL,
  session_expired_at DATETIME     DEFAULT NULL,
  session_ip         VARCHAR(45)  DEFAULT NULL,
  session_user_agent VARCHAR(255) DEFAULT NULL,
  created_on         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on        DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on         DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_user_auth_email (email),
  KEY idx_user_auth_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS institutions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uid         VARCHAR(50)  DEFAULT NULL,
  name        VARCHAR(200) DEFAULT NULL,
  abbr        VARCHAR(50)  DEFAULT NULL,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_institutions_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS institution_domains (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  institution_id INT          DEFAULT NULL,
  domain         VARCHAR(200) DEFAULT NULL,
  is_primary     TINYINT(1)   DEFAULT 0,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on     DATETIME     DEFAULT NULL,
  KEY idx_institution_domains_institution_id (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_categories (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(200) DEFAULT NULL,
  description          TEXT         DEFAULT NULL,
  default_drive_folders TEXT        DEFAULT NULL,
  idx_idcard_front     INT          DEFAULT 0,
  idx_idcard_back      INT          DEFAULT 0,
  idx_lanyard          INT          DEFAULT 0,
  idx_sablon_depan     INT          DEFAULT 0,
  idx_sablon_belakang  INT          DEFAULT 0,
  created_on           DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on          DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on           DATETIME     DEFAULT NULL,
  KEY idx_product_categories_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_components (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  product_id     INT          DEFAULT NULL,
  commodity_id   INT          DEFAULT NULL,
  commodity_name VARCHAR(200) DEFAULT NULL,
  qty            DECIMAL(15,2) DEFAULT 0,
  unit_price     DECIMAL(15,2) DEFAULT 0,
  subtotal       DECIMAL(15,2) DEFAULT 0,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on     DATETIME     DEFAULT NULL,
  KEY idx_product_components_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_package_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  package_id   INT          DEFAULT NULL,
  package_name VARCHAR(200) DEFAULT NULL,
  product_id   INT          DEFAULT NULL,
  product_name VARCHAR(200) DEFAULT NULL,
  qty          INT          DEFAULT 1,
  unit_price   DECIMAL(15,2) DEFAULT 0,
  discount     DECIMAL(15,2) DEFAULT 0,
  subtotal     DECIMAL(15,2) DEFAULT 0,
  note         TEXT         DEFAULT NULL,
  seq          INT          DEFAULT 0,
  created_on   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on  DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on   DATETIME     DEFAULT NULL,
  KEY idx_product_package_items_package_id (package_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_price_rules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uid         VARCHAR(50)  DEFAULT NULL,
  product_id  INT          DEFAULT NULL,
  min_qty     INT          DEFAULT 1,
  price       DECIMAL(15,2) DEFAULT 0,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_product_price_rules_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uid         VARCHAR(50)  DEFAULT NULL,
  product_id  INT          DEFAULT NULL,
  variant_name VARCHAR(200) DEFAULT NULL,
  base_price  DECIMAL(15,2) DEFAULT 0,
  is_default  TINYINT(1)   DEFAULT 0,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_product_variants_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  uid                    VARCHAR(50)  DEFAULT NULL,
  name                   VARCHAR(200) DEFAULT NULL,
  category               ENUM('id_card_with_lanyard','cotton_combed_premium') DEFAULT NULL,
  cotton_combed_category ENUM('kaos','sablon') DEFAULT NULL,
  price_s_xl             DECIMAL(15,2) DEFAULT 0,
  price_2xl              DECIMAL(15,2) DEFAULT 0,
  price_3xl              DECIMAL(15,2) DEFAULT 0,
  price_4xl              DECIMAL(15,2) DEFAULT 0,
  price_5xl              DECIMAL(15,2) DEFAULT 0,
  price_long_sleeve      DECIMAL(15,2) DEFAULT 0,
  price_per_meter        DECIMAL(15,2) DEFAULT 0,
  type                   ENUM('online','offline') DEFAULT 'offline',
  address                TEXT         DEFAULT NULL,
  location               VARCHAR(200) DEFAULT NULL,
  phone                  VARCHAR(50)  DEFAULT NULL,
  external_link          VARCHAR(300) DEFAULT NULL,
  created_on             DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on            DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on             DATETIME     DEFAULT NULL,
  KEY idx_suppliers_category (category),
  KEY idx_suppliers_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_commodities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  parent_id         INT          DEFAULT NULL,
  level             INT          DEFAULT 1,
  supplier_id       INT          DEFAULT NULL,
  supplier_name     VARCHAR(200) DEFAULT NULL,
  commodity_id      INT          DEFAULT NULL,
  commodity_name    VARCHAR(200) DEFAULT NULL,
  category          VARCHAR(100) DEFAULT NULL,
  qty               DECIMAL(15,2) DEFAULT 0,
  current_stock     DECIMAL(15,2) DEFAULT 0,
  unit              VARCHAR(20)  DEFAULT NULL,
  unit_price        DECIMAL(15,2) DEFAULT 0,
  capacity_per_unit DECIMAL(15,2) DEFAULT 0,
  is_package        TINYINT(1)   DEFAULT 0,
  is_affected_side  TINYINT(1)   DEFAULT 0,
  price             DECIMAL(15,2) DEFAULT 0,
  modified_on       DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on        DATETIME     DEFAULT NULL,
  created_on        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  KEY idx_supplier_commodities_supplier_id (supplier_id),
  KEY idx_supplier_commodities_commodity_id (commodity_id),
  KEY idx_supplier_commodities_parent_id (parent_id),
  KEY idx_supplier_commodities_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commodities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uid               VARCHAR(50)  DEFAULT NULL,
  component_id      INT          DEFAULT NULL,
  code              VARCHAR(50)  DEFAULT NULL,
  name              VARCHAR(200) DEFAULT NULL,
  unit              VARCHAR(20)  DEFAULT NULL,
  conversion_factor DECIMAL(10,4) DEFAULT 1,
  base_price        DECIMAL(15,2) DEFAULT 0,
  created_on        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on       DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on        DATETIME     DEFAULT NULL,
  KEY idx_commodities_code (code),
  KEY idx_commodities_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS components (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(50)  DEFAULT NULL,
  name                 VARCHAR(200) DEFAULT NULL,
  unit                 VARCHAR(20)  DEFAULT NULL,
  stock_qty            DECIMAL(15,2) DEFAULT 0,
  requirement_per_pkt  DECIMAL(15,2) DEFAULT 0,
  created_on           DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on          DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on           DATETIME     DEFAULT NULL,
  KEY idx_components_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(50)  DEFAULT NULL,
  supplier_id     INT          DEFAULT NULL,
  supplier_name   VARCHAR(200) DEFAULT NULL,
  status          ENUM('pending','approved','received','cancelled') DEFAULT 'pending',
  order_date      DATE         DEFAULT NULL,
  received_date   DATE         DEFAULT NULL,
  shipping_cost   DECIMAL(15,2) DEFAULT 0,
  admin_fee       DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  created_on      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on     DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on      DATETIME     DEFAULT NULL,
  KEY idx_purchase_orders_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  po_number      VARCHAR(50)   DEFAULT NULL,
  supplier_id    INT           DEFAULT NULL,
  commodity_id   INT           DEFAULT NULL,
  commodity_name VARCHAR(200)  DEFAULT NULL,
  qty            DECIMAL(15,2) DEFAULT 0,
  unit           VARCHAR(20)   DEFAULT NULL,
  unit_price     DECIMAL(15,2) DEFAULT 0,
  created_on     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME      DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on     DATETIME      DEFAULT NULL,
  KEY idx_purchase_order_items_po_number (po_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_logs (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  trx_code                  VARCHAR(50)  DEFAULT NULL,
  direction                 ENUM('IN','OUT') DEFAULT 'IN',
  category                  VARCHAR(100) DEFAULT NULL,
  order_trx_code            VARCHAR(50)  DEFAULT NULL,
  supplier_id               INT          DEFAULT NULL,
  total_item_qty            INT          DEFAULT 0,
  total_item_price          DECIMAL(15,2) DEFAULT 0,
  discount_value            DECIMAL(15,2) DEFAULT 0,
  admin_cost                DECIMAL(15,2) DEFAULT 0,
  shipping_cost             DECIMAL(15,2) DEFAULT 0,
  sablon_supplier_id        INT          DEFAULT NULL,
  sablon_kebutuhan_per_meter DECIMAL(10,4) DEFAULT 0,
  sablon_cost               DECIMAL(15,2) DEFAULT 0,
  sablon_discount_value     DECIMAL(15,2) DEFAULT 0,
  sablon_admin_cost         DECIMAL(15,2) DEFAULT 0,
  sablon_shipping_cost      DECIMAL(15,2) DEFAULT 0,
  final_amount              DECIMAL(15,2) DEFAULT 0,
  laba_bersih               DECIMAL(15,2) DEFAULT 0,
  kaos_payment_proof_paid   TEXT         DEFAULT NULL,
  kaos_payment_proof_dp     TEXT         DEFAULT NULL,
  sablon_payment_proof_paid TEXT         DEFAULT NULL,
  sablon_payment_proof_dp   TEXT         DEFAULT NULL,
  payment_status            ENUM('none','unpaid','paid','down_payment') DEFAULT 'none',
  description               TEXT         DEFAULT NULL,
  created_on                DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on               DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on                DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_stock_logs_trx_code (trx_code),
  KEY idx_stock_logs_order_trx_code (order_trx_code),
  KEY idx_stock_logs_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_log_items (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  stock_log_id       INT          DEFAULT NULL,
  supplier_id        INT          DEFAULT NULL,
  order_trx_code     VARCHAR(50)  DEFAULT NULL,
  product_id         INT          DEFAULT NULL,
  direction          ENUM('IN','OUT') DEFAULT 'IN',
  commodity_id       INT          DEFAULT NULL,
  commodity_name     VARCHAR(200) DEFAULT NULL,
  is_commodity_parent TINYINT(1)  DEFAULT 0,
  category           VARCHAR(100) DEFAULT NULL,
  movement_type      ENUM('consumption','purchase','return') DEFAULT 'purchase',
  qty                DECIMAL(15,2) DEFAULT 0,
  needs_per_meter    DECIMAL(10,4) DEFAULT 0,
  supplier_price     DECIMAL(15,2) DEFAULT 0,
  selling_price      DECIMAL(15,2) DEFAULT 0,
  price_per_unit     DECIMAL(15,2) DEFAULT 0,
  subtotal           DECIMAL(15,2) DEFAULT 0,
  created_on         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  deleted_on         DATETIME     DEFAULT NULL,
  KEY idx_stock_log_items_stock_log_id (stock_log_id),
  KEY idx_stock_log_items_commodity_id (commodity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  uid                VARCHAR(50)  DEFAULT NULL,
  code               VARCHAR(50)  DEFAULT NULL,
  name               VARCHAR(200) DEFAULT NULL,
  ref_account_number VARCHAR(100) DEFAULT NULL,
  ref_account_holder VARCHAR(100) DEFAULT NULL,
  is_bank            TINYINT(1)   DEFAULT 0,
  group_code         VARCHAR(20)  DEFAULT NULL,
  group_type         ENUM('asset','liability','equity','income','expense') DEFAULT NULL,
  group_name         VARCHAR(200) DEFAULT NULL,
  is_editable        TINYINT(1)   DEFAULT 1,
  created_on         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on        DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on         DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_accounts_code (code),
  KEY idx_accounts_group_type (group_type),
  KEY idx_accounts_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_groups (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uid         VARCHAR(50)  DEFAULT NULL,
  code        VARCHAR(20)  DEFAULT NULL,
  name        VARCHAR(200) DEFAULT NULL,
  level       INT          DEFAULT 0,
  parent_id   INT          DEFAULT NULL,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_account_groups_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_ledgers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uid         VARCHAR(50)  DEFAULT NULL,
  group_code  VARCHAR(20)  DEFAULT NULL,
  group_name  VARCHAR(200) DEFAULT NULL,
  coa_code    VARCHAR(50)  DEFAULT NULL,
  coa_name    VARCHAR(200) DEFAULT NULL,
  debit       DECIMAL(15,2) DEFAULT 0,
  credit      DECIMAL(15,2) DEFAULT 0,
  balance     DECIMAL(15,2) DEFAULT 0,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_ledger_journals (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  uid           VARCHAR(50)  DEFAULT NULL,
  journal_code  VARCHAR(50)  DEFAULT NULL,
  journal_number VARCHAR(50) DEFAULT NULL,
  journal_date  DATE         DEFAULT NULL,
  description   TEXT         DEFAULT NULL,
  created_on    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on    DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_account_ledger_journals_journal_code (journal_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_ledger_mutations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  journal_code VARCHAR(50)  DEFAULT NULL,
  trx_code     VARCHAR(50)  DEFAULT NULL,
  trx_date     DATE         DEFAULT NULL,
  ledger_id    INT          DEFAULT NULL,
  account_code VARCHAR(50)  DEFAULT NULL,
  account_name VARCHAR(200) DEFAULT NULL,
  category     VARCHAR(100) DEFAULT NULL,
  notes        TEXT         DEFAULT NULL,
  receipt_url  TEXT         DEFAULT NULL,
  debit        DECIMAL(15,2) DEFAULT 0,
  credit       DECIMAL(15,2) DEFAULT 0,
  created_on   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on  DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on   DATETIME     DEFAULT NULL,
  KEY idx_account_ledger_mutations_trx_code (trx_code),
  KEY idx_account_ledger_mutations_account_code (account_code),
  KEY idx_account_ledger_mutations_journal_code (journal_code),
  KEY idx_account_ledger_mutations_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bank_accounts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  bank_name      VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(50)  DEFAULT NULL,
  holder_name    VARCHAR(100) DEFAULT NULL,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on     DATETIME     DEFAULT NULL,
  KEY idx_bank_accounts_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `transaction` — legacy simple cashflow (modul TransactionAPI)
CREATE TABLE IF NOT EXISTS `transaction` (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  date        DATE         DEFAULT NULL,
  type        ENUM('Income','Expense') DEFAULT 'Income',
  category    VARCHAR(100) DEFAULT NULL,
  amount      DECIMAL(15,2) DEFAULT 0,
  description TEXT         DEFAULT NULL,
  bank_id     INT          DEFAULT NULL,
  proof_image TEXT         DEFAULT NULL,
  is_auto     TINYINT(1)   DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_transaction_type (type),
  KEY idx_transaction_category (category),
  KEY idx_transaction_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) DEFAULT NULL,
  structural  VARCHAR(100) DEFAULT NULL,
  phone       VARCHAR(50)  DEFAULT NULL,
  status      ENUM('active','inactive','on_leave') DEFAULT 'active',
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_employees_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_attendances (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT          DEFAULT NULL,
  employee_name    VARCHAR(200) DEFAULT NULL,
  presence_date    DATE         DEFAULT NULL,
  time_in          DATETIME     DEFAULT NULL,
  time_out         DATETIME     DEFAULT NULL,
  location_lat_in  VARCHAR(50)  DEFAULT NULL,
  location_long_in VARCHAR(50)  DEFAULT NULL,
  selfie_path      TEXT         DEFAULT NULL,
  presence_status  ENUM('present','permit','sick','absent') DEFAULT 'present',
  created_on       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on      DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on       DATETIME     DEFAULT NULL,
  KEY idx_employee_attendances_employee_id (employee_id),
  KEY idx_employee_attendances_presence_date (presence_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_salaries (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT          DEFAULT NULL,
  employee_name VARCHAR(200) DEFAULT NULL,
  base_salary   DECIMAL(15,2) DEFAULT 0,
  allowances    DECIMAL(15,2) DEFAULT 0,
  payment_type  ENUM('monthly','daily') DEFAULT 'monthly',
  created_on    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on    DATETIME     DEFAULT NULL,
  KEY idx_employee_salaries_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_salary_slips (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  employee_id         INT          DEFAULT NULL,
  employee_name       VARCHAR(200) DEFAULT NULL,
  period              VARCHAR(20)  DEFAULT NULL,
  payment_type        VARCHAR(20)  DEFAULT NULL,
  work_days_count     INT          DEFAULT 0,
  paid_base_salary    DECIMAL(15,2) DEFAULT 0,
  variable_allowances DECIMAL(15,2) DEFAULT 0,
  deductions          DECIMAL(15,2) DEFAULT 0,
  net_salary          DECIMAL(15,2) DEFAULT 0,
  payment_status      ENUM('pending','paid','failed') DEFAULT 'pending',
  created_on          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on         DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on          DATETIME     DEFAULT NULL,
  KEY idx_employee_salary_slips_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  asset_name    VARCHAR(200) DEFAULT NULL,
  category      VARCHAR(100) DEFAULT NULL,
  purchase_date DATE         DEFAULT NULL,
  location      VARCHAR(200) DEFAULT NULL,
  status        ENUM('Good','Damaged','Maintenance') DEFAULT 'Good',
  total_value   DECIMAL(15,2) DEFAULT 0,
  total_unit    INT          DEFAULT 0,
  created_on    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on    DATETIME     DEFAULT NULL,
  KEY idx_assets_category (category),
  KEY idx_assets_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_upload_folders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  uid          VARCHAR(50)  DEFAULT NULL,
  order_number VARCHAR(50)  DEFAULT NULL,
  folder_name  VARCHAR(200) DEFAULT NULL,
  parent_id    INT          DEFAULT NULL,
  level        INT          DEFAULT 1,
  product_id   INT          DEFAULT NULL,
  product_name VARCHAR(200) DEFAULT NULL,
  purpose      ENUM('id_card_front','id_card_back','lanyard','sablon_front','sablon_back') DEFAULT 'id_card_front',
  created_by   INT          DEFAULT NULL,
  created_on   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on  DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on   DATETIME     DEFAULT NULL,
  KEY idx_order_upload_folders_order_number (order_number),
  KEY idx_order_upload_folders_parent_id (parent_id),
  KEY idx_order_upload_folders_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_upload_files (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(50)  DEFAULT NULL,
  order_number   VARCHAR(50)  DEFAULT NULL,
  folder_id      INT          DEFAULT NULL,
  folder_name    VARCHAR(200) DEFAULT NULL,
  folder_purpose ENUM('id_card_front','id_card_back','lanyard') DEFAULT 'id_card_front',
  product_id     INT          DEFAULT NULL,
  product_name   VARCHAR(200) DEFAULT NULL,
  file_type      ENUM('front','back','lanyard') DEFAULT 'front',
  file_url       TEXT         DEFAULT NULL,
  file_name      VARCHAR(255) DEFAULT NULL,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  deleted_on     DATETIME     DEFAULT NULL,
  KEY idx_order_upload_files_order_number (order_number),
  KEY idx_order_upload_files_folder_id (folder_id),
  KEY idx_order_upload_files_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_designs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_number  VARCHAR(50)  DEFAULT NULL,
  template_id   VARCHAR(50)  DEFAULT NULL,
  template_name VARCHAR(200) DEFAULT NULL,
  category      ENUM('id_card','lanyard') DEFAULT 'id_card',
  preview_image TEXT         DEFAULT NULL,
  created_on    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on    DATETIME     DEFAULT NULL,
  KEY idx_order_designs_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_twibbon_assignments (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  order_trx_code        VARCHAR(50)  DEFAULT NULL,
  unique_code           VARCHAR(100) DEFAULT NULL,
  twibbon_template_id   INT          DEFAULT NULL,
  twibbon_template_name VARCHAR(200) DEFAULT NULL,
  category              ENUM('idcard','lanyard') DEFAULT 'idcard',
  public_url_link       VARCHAR(300) DEFAULT NULL,
  created_on            DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on           DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on            DATETIME     DEFAULT NULL,
  KEY idx_order_twibbon_assignments_order_trx_code (order_trx_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS x_twibbon_templates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) DEFAULT NULL,
  category    ENUM('twibbon-idcard','twibbon-lanyard') DEFAULT 'twibbon-idcard',
  base_image  TEXT         DEFAULT NULL,
  rules       TEXT         DEFAULT NULL,
  style_mode  VARCHAR(20)  DEFAULT 'dynamic',
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_x_twibbon_templates_category (category),
  KEY idx_x_twibbon_templates_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS x_shirt_colors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) DEFAULT NULL,
  image_url   TEXT         DEFAULT NULL,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  KEY idx_x_shirt_colors_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS x_design_templates (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) DEFAULT NULL,
  category     VARCHAR(50)  DEFAULT NULL,
  image_url    TEXT         DEFAULT NULL,
  layout_rules TEXT         DEFAULT NULL,
  style_mode   VARCHAR(20)  DEFAULT 'dynamic',
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_x_design_templates_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_contents (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) DEFAULT NULL,
  slug           VARCHAR(200) DEFAULT NULL,
  image          TEXT         DEFAULT NULL,
  image_gallery  TEXT         DEFAULT NULL,
  description    TEXT         DEFAULT NULL,
  link           VARCHAR(300) DEFAULT NULL,
  type           ENUM('highlight-event','news','hero-section','testimonial','partner','cta-banner','stats') DEFAULT 'news',
  seq            INT          DEFAULT 0,
  total_order    INT          DEFAULT 0,
  value          VARCHAR(100) DEFAULT NULL,
  suffix         VARCHAR(50)  DEFAULT NULL,
  icon_type      VARCHAR(50)  DEFAULT NULL,
  promotion_type VARCHAR(50)  DEFAULT NULL,
  is_active      TINYINT(1)   DEFAULT 1,
  deleted        TINYINT(1)   DEFAULT 0,
  created_on     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cms_contents_type (type),
  KEY idx_cms_contents_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discount_codes (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  code               VARCHAR(50)  DEFAULT NULL,
  name               VARCHAR(200) DEFAULT NULL,
  description        TEXT         DEFAULT NULL,
  discount_type      ENUM('percentage','amount') DEFAULT 'amount',
  discount_value     DECIMAL(15,2) DEFAULT 0,
  max_discount_amount DECIMAL(15,2) DEFAULT NULL,
  min_order_amount   DECIMAL(15,2) DEFAULT 0,
  valid_from         DATETIME     DEFAULT NULL,
  valid_until        DATETIME     DEFAULT NULL,
  user_limit         INT          DEFAULT NULL,
  active             TINYINT(1)   DEFAULT 1,
  created_on         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on        DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on         DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_discount_codes_code (code),
  KEY idx_discount_codes_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(50)  DEFAULT NULL,
  institution_name VARCHAR(200) DEFAULT NULL,
  name             VARCHAR(100) DEFAULT NULL,
  rating           TINYINT      DEFAULT 5,
  comment          TEXT         DEFAULT NULL,
  status           ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_on       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on      DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on       DATETIME     DEFAULT NULL,
  KEY idx_testimonials_status (status),
  KEY idx_testimonials_deleted_on (deleted_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  `key`       VARCHAR(100) DEFAULT NULL,
  value       TEXT         DEFAULT NULL,
  description TEXT         DEFAULT NULL,
  created_on  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  modified_on DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_on  DATETIME     DEFAULT NULL,
  UNIQUE KEY uq_settings_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          DEFAULT NULL,
  email      VARCHAR(200) DEFAULT NULL,
  ip_address VARCHAR(45)  DEFAULT NULL,
  success    TINYINT(1)   DEFAULT 0,
  created_on DATETIME     DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_logs_email (email),
  KEY idx_login_logs_created_on (created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
