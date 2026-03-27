-- BizBranches MySQL Database Schema
-- Run this to create all tables from scratch

-- If running in phpMyAdmin, select your database first (bizbranchespk_bizbranches)
-- These lines are for CLI usage only:
CREATE DATABASE IF NOT EXISTS bizbranchespk_bizbranches CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bizbranchespk_bizbranches;

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
    province VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(12) DEFAULT NULL,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_digits VARCHAR(20) DEFAULT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    website_normalized VARCHAR(500) DEFAULT NULL,
    facebook_url VARCHAR(500) DEFAULT NULL,
    gmb_url VARCHAR(500) DEFAULT NULL,
    youtube_url VARCHAR(500) DEFAULT NULL,
    profile_username VARCHAR(100) DEFAULT NULL,
    swift_code VARCHAR(20) DEFAULT NULL,
    branch_code VARCHAR(20) DEFAULT NULL,
    city_dialing_code VARCHAR(10) DEFAULT NULL,
    iban VARCHAR(500) DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    logo_public_id VARCHAR(200) DEFAULT NULL,
    payment_proof_url TEXT DEFAULT NULL,
    sender_name VARCHAR(255) DEFAULT NULL,
    status ENUM('pending','approved') NOT NULL DEFAULT 'pending',
    approved_at DATETIME DEFAULT NULL,
    approved_by ENUM('auto','admin') DEFAULT NULL,
    featured TINYINT(1) NOT NULL DEFAULT 0,
    featured_at DATETIME DEFAULT NULL,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT UNSIGNED DEFAULT 0,
    latitude DECIMAL(10,7) DEFAULT NULL,
    longitude DECIMAL(10,7) DEFAULT NULL,
    location_verified TINYINT(1) NOT NULL DEFAULT 0,
    source VARCHAR(20) DEFAULT NULL,
    created_by VARCHAR(50) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_category_city (category, city),
    INDEX idx_status (status),
    INDEX idx_featured (featured, featured_at),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email),
    INDEX idx_phone_digits (phone_digits),
    INDEX idx_website_normalized (website_normalized),
    INDEX idx_location_verified (location_verified),
    FULLTEXT INDEX ft_search (name, description, category, city, area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    image_url LONGTEXT DEFAULT NULL,
    image_public_id VARCHAR(200) DEFAULT NULL,
    count INT UNSIGNED DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    business_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business_created (business_id, created_at),
    INDEX idx_business_rating (business_id, rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users / Profiles table
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    handle VARCHAR(100) DEFAULT NULL,
    name VARCHAR(200) DEFAULT NULL,
    full_name VARCHAR(200) DEFAULT NULL,
    display_name VARCHAR(200) DEFAULT NULL,
    title VARCHAR(200) DEFAULT NULL,
    headline VARCHAR(300) DEFAULT NULL,
    role VARCHAR(100) DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    photo_url VARCHAR(500) DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    picture VARCHAR(500) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username),
    INDEX idx_handle (handle),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting table (replaces in-memory store)
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    route_path VARCHAR(100) NOT NULL DEFAULT 'global',
    request_count INT UNSIGNED NOT NULL DEFAULT 1,
    window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_path (ip_address, route_path),
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No default seed data; populate via your application or imports.
