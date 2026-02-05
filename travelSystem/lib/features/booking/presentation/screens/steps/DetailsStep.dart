import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../controller/WizardController.dart';

class DetailsStep extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    WizardController controller = Get.find();
    final trip = controller.trip!;

    Color primary = Color(0xff007AFF); // الأزرق الأساسي
    Color accent = Color(0xff4CD964);  // الأخضر للعناصر المميزة
    Color background = Color(0xffF8F8FA); // خلفية هادئة

    return SingleChildScrollView(
      child: Container(
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
                color: Colors.black12, blurRadius: 18, spreadRadius: 2,
                offset: Offset(0, 3)
            ),
          ],
        ),
        padding: const EdgeInsets.all(22),
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // رأس البطاقة
            Row(
              children: [
                Icon(Icons.directions_bus, color: primary, size: 30),
                const SizedBox(width: 10),
                Text(
                  trip.tripType,
                  style: TextStyle(
                    color: primary, fontWeight: FontWeight.bold, fontSize: 21,
                  ),
                ),
                Spacer(),
                Container(
                  decoration: BoxDecoration(
                    color: accent.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 7),
                  child: Row(
                    children: [
                      Icon(trip.isVIP ? Icons.star : Icons.card_travel, color: accent, size: 17),
                      SizedBox(width: 4),
                      Text(
                        trip.isVIP ? "VIP" : "عادي",
                        style: TextStyle(
                          color: accent, fontWeight: FontWeight.bold, fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Divider(height: 32, thickness: 1.3, color: primary.withOpacity(0.13)),
            // المدن والاتجاه والتاريخ
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(Icons.location_on, color: primary, size: 22),
                SizedBox(width: 3),
                Text(trip.cityFrom,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                Icon(Icons.arrow_forward_sharp, size: 19, color: accent),
                Text(trip.cityTo,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                Spacer(),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.timer, color: accent, size: 17),
                      SizedBox(width: 3),
                      Text(trip.duration, style: TextStyle(fontSize: 13, color: primary)),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.event, color: accent, size: 22),
                SizedBox(width: 3),
                Text("${trip.dateFrom} - ${trip.timeFrom}",
                    style: TextStyle(fontSize: 15, color: Colors.black87)),
                Spacer(),
                Text("رقم الرحلة: ${trip.tripNumber}",
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
            SizedBox(height: 14),
            // تفاصيل الشركة
            Row(
              children: [
                Icon(Icons.business, color: Colors.blueGrey, size: 20),
                SizedBox(width: 5),
                Text(trip.companyName, style: TextStyle(color: Colors.blueGrey, fontSize: 15)),
              ],
            ),
            SizedBox(height: 15),
            // بطاقة المقاعد والسعر
            Container(
              decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(13),
                  boxShadow: [
                    BoxShadow(color: Colors.grey[200]!, blurRadius: 8, offset: Offset(0,3))
                  ]
              ),
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(Icons.chair, color: accent, size: 24),
                  SizedBox(width: 7),
                  Text(
                    "${trip.availableSeats} مقعد متوفر",
                    style: TextStyle(color: accent, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
            ),
            SizedBox(height: 18),
            // مربع الأسعار
            Row(
              children: [
                _priceBox("للكبار", trip.priceAdult, primary),
                SizedBox(width: 10),
                _priceBox("للأطفال", trip.priceChild, accent),
              ],
            ),
            SizedBox(height: 24),
            // معلومات إضافية: يمكن التوسعة لأي ملحوظات أخرى عن الرحلة
            Container(
              padding: EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: accent.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(Icons.security, color: primary, size: 21),
                  SizedBox(width: 7),
                  Text(
                    "الرحلة تشمل واي فاي وتأمين السفر",
                    style: TextStyle(color: primary, fontWeight: FontWeight.w600),
                  )
                ],
              ),
            ),
            SizedBox(height: 38),
            SizedBox(
              width: double.infinity,
              height: 53,
              child: ElevatedButton.icon(
                icon: Icon(Icons.arrow_forward, size: 22),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
                label: Text(
                  "التالي",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.3),
                ),
                onPressed: controller.nextStep,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _priceBox(String label, num amount, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 10, horizontal: 0),
        decoration: BoxDecoration(
          color: color.withOpacity(0.09),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Column(
          children: [
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
            SizedBox(height: 5),
            Text(
              "$amount ر.س",
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87
              ),
            ),
          ],
        ),
      ),
    );
  }
}
