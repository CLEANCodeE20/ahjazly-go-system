import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/constants/Color.dart';
import '../../../../../core/constants/nameRoute.dart';
import '../../../../auth/controller/AuthService.dart';
import '../../../controller/WizardController.dart';


class BookingSummaryStep extends StatelessWidget {
  const BookingSummaryStep({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final wizard = Get.find<WizardController>();
    final trip = wizard.trip!;

    final totalPassengers = wizard.passengers.length;
    final adults = wizard.adultsCount;
    final children = wizard.childrenCount;
    final totalPrice = wizard.totalPrice;
    
    // Colors
    // Colors
    // final Color primary = const Color(0xff007AFF);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
             Icon(Icons.assignment_outlined, size: 28, color: Theme.of(context).colorScheme.primary),
             const SizedBox(width: 8),
             Text(
              "ملخص الحجز",
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Trip Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.04), blurRadius: 10, offset: const Offset(0, 4))
            ],
            border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.1))
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("من", style: Theme.of(context).textTheme.bodySmall),
                      Text(trip.cityFrom, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                   Icon(Icons.arrow_forward, color: Theme.of(context).colorScheme.primary, size: 18),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text("إلى", style: Theme.of(context).textTheme.bodySmall),
                      Text(trip.cityTo, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 6),
                  Text("${trip.dateFrom}  •  ${trip.timeFrom}", style: Theme.of(context).textTheme.bodyMedium),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: trip.isVIP ? Colors.orange.withOpacity(0.1) : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8)
                    ),
                    child: Text(
                      trip.isVIP ? "VIP" : "عادي",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: trip.isVIP ? Colors.orange : Theme.of(context).colorScheme.primary
                      ),
                    ),
                  )
                ],
              )
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        Text(
          "بيانات المسافرين",
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        
        Expanded(
          child: Obx(() {
            final passengers = wizard.passengers;
            return ListView.separated(
              itemCount: passengers.length,
              separatorBuilder: (ctx, i) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final p = passengers[index];
                final isAdult = index < wizard.adultsCount;
                final typeLabel = isAdult ? "بالغ" : "طفل";
                
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.02) : const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.1))
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        child: Text("${index + 1}", style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.fullName.isEmpty ? "اسم غير محدد" : p.fullName,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              "$typeLabel  •  ${p.idNumber.isEmpty ? '---' : p.idNumber}",
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          Icon(Icons.event_seat, size: 18, color: Theme.of(context).colorScheme.primary),
                          Text(p.seatCode ?? "-", style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                        ],
                      )
                    ],
                  ),
                );
              },
            );
          }),
        ),
        
        const SizedBox(height: 16),
        
        // Price Summary
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.1)),
             boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.04), blurRadius: 10)
            ],
          ),
          child: Column(
            children: [
              if (adults > 0)
                _priceRow(context, "بالغ ($adults)", "${adults * trip.priceAdult} ر.س"),
              if (children > 0)
                _priceRow(context, "طفل ($children)", "${children * trip.priceChild} ر.س"),
              
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("الإجمالي الكلي", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  Text(
                    "$totalPrice ر.س",
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                ],
              )
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        
         Row(
            children: [
              Expanded(
                child: SizedBox(
                   height: 50,
                  child: OutlinedButton(
                    onPressed: wizard.previousStep,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                    ),
                    child: const Text("تعديل"),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                   height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      // Check for Guest
                      final authService = Get.find<AuthService>();
                      if (authService.isGuest) {
                         Get.defaultDialog(
                          title: "تسجيل الدخول مطلوب",
                          middleText: "لا يمكنك إتمام الحجز كضيف. يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.",
                          confirmTextColor: Colors.white,
                          onConfirm: () {
                            // authService.isBookingFlow.value = true; // Feature deprecated
                            Get.back(); // Close dialog
                            Get.toNamed(AppRoute.Login);
                          },
                          textConfirm: "تسجيل الدخول",
                          textCancel: "إلغاء",
                          cancelTextColor: AppColor.primary,
                          buttonColor: AppColor.primary,
                        );
                        return;
                      }

                      final ok = await wizard.createBooking();
                      if (ok) {
                        wizard.nextStep(); 
                      }
                    },
                     style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Theme.of(context).colorScheme.onPrimary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2
                    ),
                    child: const Text(
                      "تأكيد الحجز والدفع",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _priceRow(BuildContext context, String label, String amount) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(amount, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
