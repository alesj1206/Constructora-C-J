-- Initial schema for the admin web, on local MySQL (replaces Supabase Auth).
-- Credentials and role live in a single `users` table. Passwords are stored as
-- bcrypt hashes; the application verifies them and issues a signed JWT cookie.

CREATE DATABASE IF NOT EXISTS constructora_cj
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE constructora_cj;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('manager', 'site_engineer', 'accountant', 'warehouseman') NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;
