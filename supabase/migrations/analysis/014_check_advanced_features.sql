-- ============================================
-- فحص الميزات المتقدمة (لمعرفة وضع الخطة الشاملة)
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('bus_classes', 'bus_layouts', 'fares', 'bus_layout_seats');
