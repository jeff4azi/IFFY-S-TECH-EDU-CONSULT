-- ============================================
-- 0001_initial_schema.sql
-- Consolidated migration for Ace Educational Consult
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE service_field_type AS ENUM ('text', 'email', 'number', 'image', 'file', 'textarea');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'pending_verification');

-- ============================================
-- 1. Site Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    business_hours VARCHAR(255),
    whatsapp_number VARCHAR(50),
    whatsapp_group_link TEXT,
    social_links JSONB,
    payment_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Service Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Services Table
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    fields JSONB, -- Array of { name: string, type: service_field_type, required: boolean }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Testimonials Table
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Contact Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) NOT NULL UNIQUE, -- ACE-<timestamp>-<random>
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_data JSONB NOT NULL,
    status order_status DEFAULT 'pending',
    receipt_url TEXT,
    deliverable_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Create Storage Bucket
-- ============================================
-- Create storage bucket for order file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  true,
  10485760, -- 10 MB limit
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','text/csv',
    'application/zip','application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. Enable RLS on all tables
-- ============================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. Grant Schema and Table Permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================
-- 10. RLS Policies - Site Settings
-- ============================================
CREATE POLICY "allow_all" ON site_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 11. RLS Policies - Service Categories
-- ============================================
CREATE POLICY "allow_all" ON service_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 12. RLS Policies - Services
-- ============================================
CREATE POLICY "allow_all" ON services
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 13. RLS Policies - Testimonials
-- ============================================
CREATE POLICY "allow_all" ON testimonials
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 14. RLS Policies - Contact Messages
-- ============================================
CREATE POLICY "allow_all" ON contact_messages
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 15. RLS Policies - Orders
-- ============================================
CREATE POLICY "allow_all" ON orders
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 16. Storage Bucket Policies
-- ============================================
-- Allow public read access
CREATE POLICY "Allow public read on order-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-files');

-- Allow anyone to upload (orders are placed by unauthenticated users)
CREATE POLICY "Allow public upload to order-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'order-files');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on order-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'order-files' AND auth.role() = 'authenticated');

-- ============================================
-- 17. Updated_at Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 18. Seed Data
-- ============================================

-- Insert default site settings
INSERT INTO site_settings (
    phone_number, 
    email, 
    address, 
    business_hours, 
    whatsapp_number, 
    whatsapp_group_link,
    social_links, 
    payment_details
)
VALUES (
    '+234 800 000 0000',
    'contact@aceeducational.com',
    'Lagos, Nigeria',
    'Monday - Saturday: 8:00 AM - 8:00 PM',
    '2348000000000',
    '',
    '{"facebook": "#", "twitter": "#", "instagram": "#", "linkedin": "#"}'::jsonb,
    '{"bankName": "Zenith Bank", "accountNumber": "1234567890", "accountName": "Ace Educational Consult"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert initial testimonials
INSERT INTO testimonials (name, text, rating, approved)
VALUES 
    ('Happy Client', 'Very reliable and fast service. I received my result verification the same day.', 5, true),
    ('Happy Client', 'Excellent customer support and affordable pricing.', 5, true),
    ('Happy Client', 'Highly recommended for JAMB and WAEC services.', 5, true)
ON CONFLICT DO NOTHING;

-- Insert initial service categories
INSERT INTO service_categories (name)
VALUES 
    ('Examination Services'),
    ('JAMB Services'),
    ('Identity & Verification'),
    ('Digital & Utility Services'),
    ('University Services'),
    ('Other Services')
ON CONFLICT (name) DO NOTHING;

-- Insert initial services with custom fields

-- Examination Services
INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'WAEC GCE Registration', '₦38,500', 'Register for WAEC GCE with ease and confidence.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=WAEC%20examination%20registration%20form%20and%20certificate%20in%20Nigeria%20professional%20education&image_size=square_hd', '[{"name":"Full Name","type":"text","required":true},{"name":"Date of Birth","type":"text","required":true},{"name":"Phone Number","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'WAEC Result Checker', '₦5,350', 'Quickly check your WAEC results online.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=WAEC%20result%20checking%20online%20portal%20screen%20education&image_size=square_hd', '[{"name":"Exam Number","type":"text","required":true},{"name":"Exam Year","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'WAEC Verification', '₦5,500', 'Verify your WAEC certificate authenticity.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=certificate%20verification%20stamp%20and%20document%20education&image_size=square_hd', '[{"name":"Certificate Number","type":"text","required":true},{"name":"Candidate Name","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NECO Result Checker', '₦2,300', 'Check your NECO results instantly.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=NECO%20examination%20result%20sheet%20education&image_size=square_hd', '[{"name":"Exam Number","type":"text","required":true},{"name":"Exam Year","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NECO e-Verification Token', '₦6,000', 'Get your NECO e-verification token.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=digital%20token%20and%20security%20code%20education&image_size=square_hd', '[{"name":"Phone Number","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NECO e-Verification PDF', '₦5,800', 'Download NECO verification PDF.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=PDF%20document%20download%20education&image_size=square_hd', '[{"name":"Verification Code","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NABTEB GCE Registration', '₦25,000', 'Register for NABTEB GCE.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=NABTEB%20registration%20form%20education&image_size=square_hd', '[{"name":"Full Name","type":"text","required":true},{"name":"Phone Number","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NABTEB Result Checker', '₦900', 'Check NABTEB results quickly.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=result%20checker%20interface%20education&image_size=square_hd', '[{"name":"Exam Number","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NBAIS Result Checker', '₦1,300', 'Check NBAIS results online.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=examination%20result%20display%20education&image_size=square_hd', '[{"name":"Exam Number","type":"text","required":true},{"name":"Exam Year","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'Examination Services'
ON CONFLICT DO NOTHING;

-- JAMB Services
INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Admission Letter Printing', 'Contact for Price', 'Print your JAMB admission letter.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=university%20admission%20letter%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Full Name","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Original Result Printing', 'Contact for Price', 'Get your original JAMB result printed.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=JAMB%20result%20slip%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Exam Year","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Change of Course Processing', 'Contact for Price', 'Process your JAMB change of course.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=course%20change%20form%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Current Course","type":"text","required":true},{"name":"Desired Course","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Reprinting Services', 'Contact for Price', 'JAMB reprinting services available.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=printer%20printing%20document%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'O''Level Upload Support', 'Contact for Price', 'Upload your O''Level results to JAMB.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=upload%20document%20to%20portal%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Result Upload File","type":"file","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'CAPS Admission Processing', 'Contact for Price', 'JAMB CAPS admission assistance.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=university%20admission%20portal%20education&image_size=square_hd', '[{"name":"JAMB Registration Number","type":"text","required":true},{"name":"Full Name","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'JAMB Services'
ON CONFLICT DO NOTHING;

-- Identity & Verification
INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'NIN Services', 'Contact for Price', 'National Identity Number services.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Nigerian%20NIN%20identity%20card%20verification&image_size=square_hd', '[{"name":"Full Name","type":"text","required":true},{"name":"Phone Number","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Identity & Verification'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Lost NIN Retrieval', '₦500', 'Retrieve your lost NIN quickly.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=lost%20id%20card%20retrieval%20service&image_size=square_hd', '[{"name":"Full Name","type":"text","required":true},{"name":"Phone Number","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Identity & Verification'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'BVN Services', 'Contact for Price', 'Bank Verification Number services.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=bank%20verification%20number%20BVN%20card&image_size=square_hd', '[{"name":"Full Name","type":"text","required":true},{"name":"BVN Number","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Identity & Verification'
ON CONFLICT DO NOTHING;

-- Digital & Utility Services
INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Airtime Recharge', 'Contact for Price', 'Recharge your mobile airtime.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=mobile%20phone%20airtime%20recharge&image_size=square_hd', '[{"name":"Phone Number","type":"text","required":true},{"name":"Amount","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Data Subscription', 'Contact for Price', 'Subscribe to mobile data plans.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=mobile%20data%20subscription%20smartphone&image_size=square_hd', '[{"name":"Phone Number","type":"text","required":true},{"name":"Data Plan","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Electricity Bill Payment', 'Contact for Price', 'Pay your electricity bills online.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=electricity%20bill%20payment%20meter&image_size=square_hd', '[{"name":"Meter Number","type":"text","required":true},{"name":"Amount","type":"number","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'TV Subscription', 'Contact for Price', 'Renew your TV subscription.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=television%20subscription%20remote%20control&image_size=square_hd', '[{"name":"Smartcard/IUC Number","type":"text","required":true},{"name":"Package","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'PIN Vending', 'Contact for Price', 'Purchase various PINs.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=digital%20pin%20code%20security&image_size=square_hd', '[{"name":"PIN Type","type":"text","required":true},{"name":"Phone Number","type":"text","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;

INSERT INTO services (category_id, name, price, description, image_url, fields)
SELECT id, 'Digital Coupons', 'Contact for Price', 'Get digital coupons and vouchers.', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=digital%20coupon%20voucher%20discount&image_size=square_hd', '[{"name":"Coupon Type","type":"text","required":true},{"name":"Email Address","type":"email","required":true}]'::jsonb
FROM service_categories WHERE name = 'Digital & Utility Services'
ON CONFLICT DO NOTHING;



-- ============================================
-- Service Files Bucket
-- ============================================

-- Create service files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-files',
  'service-files',
  true,
  20971520, -- 20 MB limit
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;
-- ============================================
-- Service Images Bucket
-- ============================================

-- Create service images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  20971520, -- 20 MB limit
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies - Service Images Bucket
-- ============================================

-- Allow public read access
CREATE POLICY "service_images_public_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'service-images');

-- Allow authenticated users full access (insert, update, delete)
CREATE POLICY "service_images_authenticated_all" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'service-images')
    WITH CHECK (bucket_id = 'service-images');