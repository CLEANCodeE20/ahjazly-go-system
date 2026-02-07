import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:intl/intl.dart' as intl;
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:travelsystem/core/constants/Color.dart';
import 'package:travelsystem/core/constants/dimensions.dart';
import 'package:travelsystem/features/booking/domain/entities/booking_entity.dart';

class TicketViewScreen extends StatelessWidget {
  TicketViewScreen({super.key});

  final ScreenshotController screenshotController = ScreenshotController();

  Future<void> _saveTicket(BookingEntity booking) async {
    try {
      if (Platform.isAndroid || Platform.isIOS) {
        var status = await Permission.storage.request();
        if (!status.isGranted) {
           var photosStatus = await Permission.photos.request();
           if (!photosStatus.isGranted) {
             Get.snackbar('تنبيه'.tr, 'يرجى منح صلاحية الوصول للصور لحفظ التذكرة'.tr, 
               snackPosition: SnackPosition.BOTTOM);
             return;
           }
        }
      }

      final Uint8List? image = await screenshotController.capture();
      if (image != null) {
        final result = await ImageGallerySaver.saveImage(
          image,
          quality: 100,
          name: "ticket_${booking.bookingId}",
        );
        
        if (result['isSuccess'] == true) {
          Get.snackbar('نجاح'.tr, 'تم حفظ التذكرة في معرض الصور'.tr, 
            backgroundColor: Colors.green, colorText: Colors.white, snackPosition: SnackPosition.BOTTOM);
        } else {
          throw Exception('Save failed');
        }
      }
    } catch (e) {
      Get.snackbar('خطأ'.tr, 'فشل حفظ التذكرة'.tr, 
        backgroundColor: Colors.red, colorText: Colors.white, snackPosition: SnackPosition.BOTTOM);
    }
  }

  Future<void> _shareTicket(BookingEntity booking) async {
    try {
      final Uint8List? image = await screenshotController.capture();
      if (image != null) {
        final directory = await getTemporaryDirectory();
        final imagePath = await File('${directory.path}/share_ticket_${booking.bookingId}.png').create();
        await imagePath.writeAsBytes(image);
        
        final shareText = 'تذكرة حجز رحلة من ${booking.originCity} إلى ${booking.destinationCity}\nرقم الحجز: #${booking.bookingId}';
        
        await Share.shareXFiles(
          [XFile(imagePath.path)],
          text: shareText,
        );
      }
    } catch (e) {
      Get.snackbar('خطأ'.tr, 'فشل مشاركة التذكرة'.tr, 
        backgroundColor: Colors.red, colorText: Colors.white, snackPosition: SnackPosition.BOTTOM);
    }
  }

  @override
  Widget build(BuildContext context) {
    final BookingEntity booking = Get.arguments as BookingEntity;
    
    final depDate = intl.DateFormat('yyyy/MM/dd').format(booking.departureTime);
    final depTime = intl.DateFormat('HH:mm').format(booking.departureTime);
    final arrTime = intl.DateFormat('HH:mm').format(booking.arrivalTime);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black, size: 20),
          onPressed: () => Get.back(),
        ),
        title: Text(
          'تفاصيل التذكرة'.tr,
          style: const TextStyle(
            color: Colors.black,
            fontFamily: 'Cairo',
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          children: [
            const SizedBox(height: 10),
            // Ticket Main Card
            Container(
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Screenshot(
                controller: screenshotController,
                child: ClipPath(
                  clipper: TicketClipper(),
                  child: Container(
                    color: Colors.white,
                    child: Column(
                      children: [
                        // Upper Part
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildInfoColumn('الشركة'.tr, booking.companyName, isBold: true),
                                  _buildInfoColumn('نوع الرحلة'.tr, booking.busClass),
                                ],
                              ),
                              if (booking.tripStatus != null && booking.tripStatus != 'scheduled' && booking.bookingStatus.toLowerCase() == 'confirmed') ...[
                                 const SizedBox(height: 15),
                                 _buildTripStatusBadge(booking),
                              ],
                              const SizedBox(height: 20),
                              const SizedBox(height: 20),
                              if (booking.passengers != null && booking.passengers!.length > 1) ...[
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Text('المسافرون'.tr, style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 12)),
                                ),
                                const SizedBox(height: 8),
                                ...booking.passengers!.map((p) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildInfoColumn('الاسم'.tr, p.fullName, isBold: true),
                                      _buildInfoColumn('المقعد'.tr, p.seatId?.toString() ?? 'N/A'),
                                    ],
                                  ),
                                )).toList(),
                              ] else ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildInfoColumn('اسم المسافر'.tr, booking.passengerName ?? booking.fullName, isBold: true),
                                    _buildInfoColumn('رقم التواصل'.tr, booking.passengerPhone ?? (booking.paymentStatus == 'Paid' ? '05xxxxxxxx' : 'قيد الانتظار'.tr)),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildInfoColumn('رقم المقعد'.tr, booking.seatNumber ?? 'N/A', isBold: true),
                                    _buildInfoColumn('حالة الحجز'.tr, booking.bookingStatus.tr),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 30),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildTimeLocation(depTime, booking.originCity, 'وقت الانطلاق'.tr),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            Row(
                                              children: List.generate(
                                                10,
                                                (index) => Expanded(
                                                  child: Container(
                                                    height: 1,
                                                    margin: const EdgeInsets.symmetric(horizontal: 2),
                                                    color: Colors.grey.withOpacity(0.3),
                                                  ),
                                                ),
                                              ),
                                            ),
                                            Transform.rotate(
                                              angle: 1.57, // 90 degrees
                                              child: Icon(Icons.directions_bus, color: AppColor.color_primary, size: 20),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(depDate, style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  _buildTimeLocation(arrTime, booking.destinationCity, 'وقت الوصول'.tr, crossAxisAlignment: CrossAxisAlignment.end),
                                ],
                              ),
                            ],
                          ),
                        ),
                        // Divider
                        Row(
                          children: List.generate(
                            30,
                            (index) => Expanded(
                              child: Container(
                                height: 1,
                                margin: const EdgeInsets.symmetric(horizontal: 2),
                                color: index.isEven ? Colors.grey.withOpacity(0.3) : Colors.transparent,
                              ),
                            ),
                          ),
                        ),
                        // Lower Part (QR)
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Text('بطاقة الصعود'.tr, style: const TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
                              const SizedBox(height: 15),
                              Container(
                                padding: const EdgeInsets.all(15),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(15),
                                  border: Border.all(color: Colors.grey.shade100, width: 2),
                                ),
                                child: QrImageView(
                                  data: 'Booking: ${booking.bookingId}\nPassenger: ${booking.passengerName ?? booking.fullName}\nSeat: ${booking.seatNumber ?? "N/A"}\nFrom: ${booking.originCity} To: ${booking.destinationCity}',
                                  version: QrVersions.auto,
                                  size: 160.0,
                                  eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                                  dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text('#${booking.bookingId}', style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.bold, color: AppColor.color_primary, letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
            // Payment Summary
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _buildPaymentRow('سعر التذكرة'.tr, '${booking.basePrice} ر.س'),
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 12),
                  _buildPaymentRow('المجموع'.tr, '${booking.basePrice} ر.س', isTotal: true),
                ],
              ),
            ),
            const SizedBox(height: 30),
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF9B69B4),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _saveTicket(booking),
                    icon: const Icon(Icons.download_rounded),
                    label: Text('تحميل'.tr, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF9B69B4)),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _shareTicket(booking),
                    icon: const Icon(Icons.share_outlined, color: Color(0xFF9B69B4)),
                    label: Text('مشاركة'.tr, style: const TextStyle(fontFamily: 'Cairo', color: Color(0xFF9B69B4), fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value, {bool isBold = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 12)),
        Text(value, style: TextStyle(fontFamily: 'Cairo', fontWeight: isBold ? FontWeight.bold : FontWeight.w600, fontSize: 14, color: Colors.black87)),
      ],
    );
  }

  Widget _buildTimeLocation(String time, String city, String label, {CrossAxisAlignment crossAxisAlignment = CrossAxisAlignment.start}) {
    return Column(
      crossAxisAlignment: crossAxisAlignment,
      children: [
        Text(time, style: const TextStyle(fontFamily: 'Cairo', fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
        Text(city, style: const TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black54)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildPaymentRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontFamily: 'Cairo', fontSize: isTotal ? 16 : 14, fontWeight: isTotal ? FontWeight.bold : FontWeight.normal, color: isTotal ? Colors.black : Colors.grey[700])),
        Text(value, style: TextStyle(fontFamily: 'Cairo', fontSize: isTotal ? 16 : 14, fontWeight: FontWeight.bold, color: isTotal ? AppColor.color_primary : Colors.black87)),
      ],
    );
  }

  Widget _buildTripStatusBadge(BookingEntity booking) {
    Color color;
    String message;
    IconData icon;

    switch (booking.tripStatus?.toLowerCase()) {
      case 'delayed':
        color = Colors.amber.shade900;
        icon = Icons.timer_rounded;
        message = 'تأخير في الرحلة: ${booking.delayMinutes ?? 0} دقيقة';
        break;
      case 'diverted':
        color = Colors.orange.shade900;
        icon = Icons.shuffle_rounded;
        message = 'تم تغيير مسار الرحلة';
        break;
      case 'emergency':
        color = Colors.red.shade900;
        icon = Icons.warning_amber_rounded;
        message = 'حالة طارئة - تواصل مع الدعم';
        break;
      default:
        return const SizedBox();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text(
            message,
            style: TextStyle(
              color: color,
              fontFamily: 'Cairo',
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class TicketClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    double radius = 15;
    double cutoutRadius = 12;
    double cutoutPosition = size.height * 0.55;

    path.lineTo(0, cutoutPosition - cutoutRadius);
    path.arcToPoint(Offset(0, cutoutPosition + cutoutRadius), radius: Radius.circular(cutoutRadius), clockwise: true);
    path.lineTo(0, size.height - radius);
    path.arcToPoint(Offset(radius, size.height), radius: Radius.circular(radius), clockwise: false);
    path.lineTo(size.width - radius, size.height);
    path.arcToPoint(Offset(size.width, size.height - radius), radius: Radius.circular(radius), clockwise: false);
    path.lineTo(size.width, cutoutPosition + cutoutRadius);
    path.arcToPoint(Offset(size.width, cutoutPosition - cutoutRadius), radius: Radius.circular(cutoutRadius), clockwise: true);
    path.lineTo(size.width, radius);
    path.arcToPoint(Offset(size.width - radius, 0), radius: Radius.circular(radius), clockwise: false);
    path.lineTo(radius, 0);
    path.arcToPoint(Offset(0, radius), radius: Radius.circular(radius), clockwise: false);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}
