import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';

import 'core/supabase/supabase_config.dart';

const String supabaseUrl = SupabaseConfig.url;
const String supabaseKey = SupabaseConfig.anonKey;

Future<void> main() async {
  // ملاحظة: هذا السكريبت يحتاج لبيانات حقيقية ليعمل
  // يمكنك تشغيله من خلال عمل دالة داخل التطبيق أو كملف مستقل إذا قمت بتوفير المفاتيح
  
  print('--- بدء تشخيص أهلية التقييم ---');
  
  try {
    // محاكاة استدعاء الوظيفة التشخيصية
    // p_user_id: BIGINT (المعرف الداخلي)
    // p_trip_id: BIGINT
    // p_booking_id: BIGINT
    
    final client = SupabaseClient(supabaseUrl, supabaseKey);
    
    // يرجى استبدال هذه القيم بالقيم التي تحاول تقييمها
    final testParams = {
      'p_user_id': 1, // استبدله بـ user_id الخاص بك
      'p_trip_id': 1, // استبدله بـ trip_id الرحلة
      'p_booking_id': 1, // استبدله بـ booking_id الحجز
    };

    print('جاري فحص الأهلية للبيانات: $testParams');

    final result = await client.rpc('can_user_rate_trip', params: testParams);
    
    print('النتيجة: $result');
    if (result == true) {
      print('✅ المستخدم مؤهل للتقييم!');
    } else {
      print('❌ المستخدم غير مؤهل (بدون رسالة خطأ محددة)');
    }

  } on PostgrestException catch (e) {
    print('--- اكتشاف خطأ تشخيصي ---');
    print('الرسالة: ${e.message}');
    print('التفاصيل: ${e.details}');
    print('التلميح: ${e.hint}');
    print('الكود: ${e.code}');
  } catch (e) {
    print('خطأ غير متوقع: $e');
  }
}
