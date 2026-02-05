

import 'package:travelsystem/core/classes/StatusRequest.dart';

StatRequst handlingData(response) {
  if(response is StatRequst) { // يعني أن الاستجابة هي مجرد الكود نفسه خطأ أو غيره
    return response;
  } else if(response == null) {
    return StatRequst.fielure; // أو أي حالة مناسبة عند عدم وجود بيانات
  } else {
    return StatRequst.succes; // في حالة وجود بيانات صحيحة
  }
}
