-- SQL Script to load users and roles for GrainChain Spends system
-- This script creates users for each role that is hardcoded in the frontend

-- First, let's create the roles if they don't exist
INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'executor', 'Исполнитель') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'registrar', 'Регистратор') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'sub_registrar', 'Суб-регистратор') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'distributor', 'Распределитель') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'treasurer', 'Казначей') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, code, name) VALUES 
    (gen_random_uuid(), 'admin', 'Администратор') 
ON CONFLICT (code) DO NOTHING;

-- Create departments
INSERT INTO departments (id, name, code) VALUES 
    (gen_random_uuid(), 'Финансовый отдел', 'FIN') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (id, name, code) VALUES 
    (gen_random_uuid(), 'Административный отдел', 'ADMIN') 
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (id, name, code) VALUES 
    (gen_random_uuid(), 'Операционный отдел', 'OPS') 
ON CONFLICT (code) DO NOTHING;

-- Create positions
INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Исполнитель',
    'Создание и управление заявками на оплату',
    true
FROM departments d WHERE d.code = 'OPS'
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Регистратор',
    'Регистрация и классификация заявок',
    true
FROM departments d WHERE d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Суб-регистратор',
    'Помощник регистратора',
    true
FROM departments d WHERE d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Распределитель',
    'Распределение заявок по линиям',
    true
FROM departments d WHERE d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Казначей',
    'Управление кассовыми операциями',
    true
FROM departments d WHERE d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, department_id, title, description, is_active) 
SELECT 
    gen_random_uuid(),
    d.id,
    'Администратор',
    'Системный администратор',
    true
FROM departments d WHERE d.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Create users with specific IDs that are hardcoded in the frontend
-- Password hash for 'password123' (you should change this in production)
-- This is generated using: python generate_password_hash.py "password123"
-- The hash below is for 'password123'

-- Main executor user (hardcoded in frontend)
INSERT INTO users (id, full_name, email, phone, password_hash, is_active) VALUES 
    ('3394830b-1b62-4db4-a6e4-fdf76b5033f5', 'Исполнитель (Основной)', 'executor@gcpay.kz', '+7 777 123 4567', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true)
ON CONFLICT (id) DO NOTHING;

-- Main user (Айгуль Нурланова - hardcoded in AppRouter)
INSERT INTO users (id, full_name, email, phone, password_hash, is_active) VALUES 
    ('6c626090-ab4a-44c2-a16d-01b73423557b', 'Айгуль Нурланова', 'aigul@gcpay.kz', '+7 777 123 4568', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true)
ON CONFLICT (id) DO NOTHING;

-- Registrar user (hardcoded in backend)
INSERT INTO users (id, full_name, email, phone, password_hash, is_active) VALUES 
    ('8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d', 'Регистратор (Основной)', 'registrar@gcpay.kz', '+7 777 123 4569', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true)
ON CONFLICT (id) DO NOTHING;

-- Test user for development/testing (no specific role)
INSERT INTO users (id, full_name, email, phone, password_hash, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@gcpay.kz', '+7 777 000 0000', '$2b$12$AZhTfz/46LpI7VWgBEQHie.W5.kXUgraWF3JnxIWMXHNJ2CasLPCm', true)
ON CONFLICT (id) DO NOTHING;

-- Additional users for other roles
INSERT INTO users (id, full_name, email, phone, password_hash, is_active) VALUES 
    (gen_random_uuid(), 'Суб-регистратор 1', 'subregistrar1@gcpay.kz', '+7 777 123 4570', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true),
    (gen_random_uuid(), 'Распределитель 1', 'distributor1@gcpay.kz', '+7 777 123 4571', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true),
    (gen_random_uuid(), 'Казначей 1', 'treasurer1@gcpay.kz', '+7 777 123 4572', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true),
    (gen_random_uuid(), 'Администратор 1', 'admin1@gcpay.kz', '+7 777 123 4573', '$2b$12$k0ZIc73IjHzircyLezIXouOwLOn.oVD6pAb8pQZrcBR1ZP5tRvYY2', true)
ON CONFLICT (email) DO NOTHING;

-- Assign roles to users with specific IDs
-- Main executor user (3394830b-1b62-4db4-a6e4-fdf76b5033f5)
INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM roles r 
WHERE r.code = 'executor'
ON CONFLICT DO NOTHING;

-- Main user (6c626090-ab4a-44c2-a16d-01b73423557b) - Айгуль Нурланова - assign executor role
INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    '6c626090-ab4a-44c2-a16d-01b73423557b'::uuid,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM roles r 
WHERE r.code = 'executor'
ON CONFLICT DO NOTHING;

-- Registrar user (8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d)
INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    '8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d'::uuid,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM roles r 
WHERE r.code = 'registrar'
ON CONFLICT DO NOTHING;

-- Additional users roles
INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    u.id,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM users u, roles r 
WHERE u.email LIKE 'subregistrar%' AND r.code = 'sub_registrar'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    u.id,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM users u, roles r 
WHERE u.email LIKE 'distributor%' AND r.code = 'distributor'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    u.id,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM users u, roles r 
WHERE u.email LIKE 'treasurer%' AND r.code = 'treasurer'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (id, user_id, role_id, valid_from, valid_to, is_primary)
SELECT 
    gen_random_uuid(),
    u.id,
    r.id,
    CURRENT_DATE,
    NULL,
    true
FROM users u, roles r 
WHERE u.email LIKE 'admin%' AND r.code = 'admin'
ON CONFLICT DO NOTHING;

-- Assign positions to users with specific IDs
-- Main executor user (3394830b-1b62-4db4-a6e4-fdf76b5033f5)
INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    '3394830b-1b62-4db4-a6e4-fdf76b5033f5'::uuid,
    p.id,
    CURRENT_DATE,
    NULL
FROM positions p, departments d
WHERE p.title = 'Исполнитель' 
    AND p.department_id = d.id 
    AND d.code = 'OPS'
ON CONFLICT DO NOTHING;

-- Main user (6c626090-ab4a-44c2-a16d-01b73423557b) - Айгуль Нурланова
INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    '6c626090-ab4a-44c2-a16d-01b73423557b'::uuid,
    p.id,
    CURRENT_DATE,
    NULL
FROM positions p, departments d
WHERE p.title = 'Исполнитель' 
    AND p.department_id = d.id 
    AND d.code = 'OPS'
ON CONFLICT DO NOTHING;

-- Registrar user (8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d)
INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    '8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d'::uuid,
    p.id,
    CURRENT_DATE,
    NULL
FROM positions p, departments d
WHERE p.title = 'Регистратор' 
    AND p.department_id = d.id 
    AND d.code = 'FIN'
ON CONFLICT DO NOTHING;

-- Additional users positions
INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    u.id,
    p.id,
    CURRENT_DATE,
    NULL
FROM users u, positions p, departments d
WHERE u.email LIKE 'subregistrar%' 
    AND p.title = 'Суб-регистратор' 
    AND p.department_id = d.id 
    AND d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    u.id,
    p.id,
    CURRENT_DATE,
    NULL
FROM users u, positions p, departments d
WHERE u.email LIKE 'distributor%' 
    AND p.title = 'Распределитель' 
    AND p.department_id = d.id 
    AND d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    u.id,
    p.id,
    CURRENT_DATE,
    NULL
FROM users u, positions p, departments d
WHERE u.email LIKE 'treasurer%' 
    AND p.title = 'Казначей' 
    AND p.department_id = d.id 
    AND d.code = 'FIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_positions (id, user_id, position_id, valid_from, valid_to)
SELECT 
    gen_random_uuid(),
    u.id,
    p.id,
    CURRENT_DATE,
    NULL
FROM users u, positions p, departments d
WHERE u.email LIKE 'admin%' 
    AND p.title = 'Администратор' 
    AND p.department_id = d.id 
    AND d.code = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 
    u.full_name,
    u.email,
    r.name as role_name,
    p.title as position_title,
    d.name as department_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_positions up ON u.id = up.user_id
LEFT JOIN positions p ON up.position_id = p.id
LEFT JOIN departments d ON p.department_id = d.id
ORDER BY r.name, u.full_name;
