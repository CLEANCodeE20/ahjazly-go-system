-- Create ENUM for component types
CREATE TYPE public.ui_component_type AS ENUM (
  'banner',
  'hero_section',
  'text_block',
  'image_gallery',
  'promo_carousel',
  'cta_button',
  'feature_grid',
  'testimonials',
  'faq_section',
  'search_widget',
  'partner_logos',
  'popular_routes',
  'custom_html'
);

-- Create ENUM for component status
CREATE TYPE public.ui_component_status AS ENUM (
  'draft',
  'published',
  'scheduled',
  'archived'
);

-- Create ENUM for target pages
CREATE TYPE public.ui_target_page AS ENUM (
  'home',
  'search',
  'booking',
  'about',
  'contact',
  'all'
);

-- Create table for UI components
CREATE TABLE public.ui_components (
  component_id SERIAL PRIMARY KEY,
  component_type ui_component_type NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  content TEXT,
  image_url TEXT,
  background_image TEXT,
  link_url TEXT,
  link_text VARCHAR(100),
  button_text VARCHAR(50),
  button_url TEXT,
  button_style VARCHAR(50) DEFAULT 'primary',
  custom_styles JSONB DEFAULT '{}',
  custom_data JSONB DEFAULT '{}',
  status ui_component_status DEFAULT 'draft',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  priority INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for page layouts
CREATE TABLE public.ui_page_layouts (
  layout_id SERIAL PRIMARY KEY,
  page_key ui_target_page NOT NULL,
  page_title VARCHAR(100) NOT NULL,
  page_description TEXT,
  meta_title VARCHAR(100),
  meta_description VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for component placements (which component goes where)
CREATE TABLE public.ui_component_placements (
  placement_id SERIAL PRIMARY KEY,
  layout_id INTEGER REFERENCES public.ui_page_layouts(layout_id) ON DELETE CASCADE,
  component_id INTEGER REFERENCES public.ui_components(component_id) ON DELETE CASCADE,
  position VARCHAR(50) NOT NULL DEFAULT 'main', -- header, main, sidebar, footer
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  custom_config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- Create table for advertisements
CREATE TABLE public.ui_advertisements (
  ad_id SERIAL PRIMARY KEY,
  ad_name VARCHAR(100) NOT NULL,
  ad_type VARCHAR(50) NOT NULL, -- banner, sidebar, popup, native
  ad_position VARCHAR(50) NOT NULL, -- top, bottom, left, right, inline
  target_pages ui_target_page[] DEFAULT '{all}',
  image_url TEXT,
  mobile_image_url TEXT,
  link_url TEXT,
  alt_text VARCHAR(255),
  advertiser_name VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  daily_budget NUMERIC(10,2),
  total_budget NUMERIC(10,2),
  cost_per_click NUMERIC(6,4),
  cost_per_impression NUMERIC(6,4),
  target_audience JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for promotional offers
CREATE TABLE public.ui_promotions (
  promo_id SERIAL PRIMARY KEY,
  promo_code VARCHAR(50) UNIQUE,
  promo_name VARCHAR(100) NOT NULL,
  promo_type VARCHAR(50) NOT NULL, -- discount_percentage, discount_fixed, free_seat, upgrade
  discount_value NUMERIC(10,2),
  min_booking_amount NUMERIC(10,2),
  max_discount NUMERIC(10,2),
  applicable_routes INTEGER[], -- route_ids
  applicable_partners INTEGER[], -- partner_ids
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  banner_image TEXT,
  display_on_home BOOLEAN DEFAULT true,
  terms_conditions TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for site settings (global configurations)
CREATE TABLE public.ui_site_settings (
  setting_id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text', -- text, boolean, json, color, image
  setting_group VARCHAR(50), -- general, theme, seo, contact, social
  description VARCHAR(255),
  is_public BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT now()
);

-- Insert default page layouts
INSERT INTO public.ui_page_layouts (page_key, page_title, page_description) VALUES
  ('home', 'الصفحة الرئيسية', 'الصفحة الرئيسية للموقع'),
  ('search', 'البحث عن رحلات', 'صفحة نتائج البحث'),
  ('booking', 'حجز التذاكر', 'صفحة إتمام الحجز'),
  ('about', 'من نحن', 'صفحة التعريف بالشركة'),
  ('contact', 'اتصل بنا', 'صفحة التواصل');

-- Insert default site settings
INSERT INTO public.ui_site_settings (setting_key, setting_value, setting_type, setting_group, description) VALUES
  ('site_name', 'أحجزلي', 'text', 'general', 'اسم الموقع'),
  ('site_logo', '/logo.PNG', 'image', 'general', 'شعار الموقع'),
  ('primary_color', '#f59e0b', 'color', 'theme', 'اللون الأساسي'),
  ('secondary_color', '#1e3a5f', 'color', 'theme', 'اللون الثانوي'),
  ('contact_phone', '+966xxxxxxxxx', 'text', 'contact', 'رقم الهاتف'),
  ('contact_email', 'info@ahjzli.com', 'text', 'contact', 'البريد الإلكتروني'),
  ('whatsapp_number', '+966xxxxxxxxx', 'text', 'contact', 'رقم الواتساب'),
  ('facebook_url', '', 'text', 'social', 'رابط فيسبوك'),
  ('twitter_url', '', 'text', 'social', 'رابط تويتر'),
  ('instagram_url', '', 'text', 'social', 'رابط انستجرام'),
  ('show_promo_banner', 'true', 'boolean', 'general', 'عرض بانر العروض'),
  ('maintenance_mode', 'false', 'boolean', 'general', 'وضع الصيانة');

-- Enable RLS
ALTER TABLE public.ui_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_component_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Public can view published components"
ON public.ui_components FOR SELECT
USING (status = 'published' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage all components"
ON public.ui_components FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active layouts"
ON public.ui_page_layouts FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage layouts"
ON public.ui_page_layouts FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view visible placements"
ON public.ui_component_placements FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can manage placements"
ON public.ui_component_placements FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active ads"
ON public.ui_advertisements FOR SELECT
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage ads"
ON public.ui_advertisements FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active promotions"
ON public.ui_promotions FOR SELECT
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can manage promotions"
ON public.ui_promotions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view public settings"
ON public.ui_site_settings FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage settings"
ON public.ui_site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_ui_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_ui_components_updated_at
BEFORE UPDATE ON public.ui_components
FOR EACH ROW EXECUTE FUNCTION public.update_ui_updated_at();

CREATE TRIGGER update_ui_advertisements_updated_at
BEFORE UPDATE ON public.ui_advertisements
FOR EACH ROW EXECUTE FUNCTION public.update_ui_updated_at();

CREATE TRIGGER update_ui_promotions_updated_at
BEFORE UPDATE ON public.ui_promotions
FOR EACH ROW EXECUTE FUNCTION public.update_ui_updated_at();

CREATE TRIGGER update_ui_page_layouts_updated_at
BEFORE UPDATE ON public.ui_page_layouts
FOR EACH ROW EXECUTE FUNCTION public.update_ui_updated_at();