import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/constants/Color.dart';
import '../../../../auth/controller/AuthService.dart';
import '../../../controller/WizardController.dart';
import '../../../data/models/passenger_model.dart';
import '../../widgets/id_photo_upload_widget.dart';


class PassengerDetailsStep extends StatefulWidget {
  const PassengerDetailsStep({Key? key}) : super(key: key);

  @override
  State<PassengerDetailsStep> createState() => _PassengerDetailsStepState();
}

class _PassengerDetailsStepState extends State<PassengerDetailsStep> {
  // final _formKey = GlobalKey<FormState>(); // Removed to prevent duplicate key errors
  
  // Colors from DetailsStep for consistency
  // Colors from AppColor schema
  // final Color primary = const Color(0xff007AFF); // Replaced
  // final Color accent = const Color(0xff4CD964);  // Replaced
  // final Color background = const Color(0xffF8F8FA); // Replaced

  @override
  Widget build(BuildContext context) {
    final wizard = Get.find<WizardController>();
    final auth = Get.find<AuthService>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
          Row(
            children: [
              Icon(Icons.people_alt, color: Theme.of(context).colorScheme.primary, size: 28),
              const SizedBox(width: 10),
              Text(
                "بيانات المسافرين",
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "يرجى تعبئة البيانات بدقة لتفادي أي مشاكل في الحجز",
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          
          Expanded(
            child: Obx(() {
              final passengers = wizard.passengers;
              return ListView.separated(
                itemCount: passengers.length,
                separatorBuilder: (ctx, i) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final p = passengers[index];
                  // Using UniqueKey to force rebuild when list changes or re-orders
                  return _buildPassengerCard(index, p, wizard, auth);
                },
              );
            }),
          ),
          
          const SizedBox(height: 20),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: wizard.previousStep,
                    icon: Icon(Icons.arrow_back, color: Theme.of(context).textTheme.bodyLarge?.color),
                    label: Text("رجوع", style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontSize: 16)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Theme.of(context).dividerColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Manual validation to avoid GlobalKey issues with dynamic lists
                      bool isValid = true;
                      for (var i = 0; i < wizard.passengers.length; i++) {
                        var p = wizard.passengers[i];
                        if (p.fullName == null || p.fullName!.length < 3) isValid = false;
                        if (p.idNumber == null || p.idNumber!.length < 5) isValid = false;
                        if (p.gender == null) isValid = false;
                        if (p.phoneNumber == null || p.phoneNumber!.length < 9) isValid = false;
                        
                        // Make ID photo mandatory for adults
                        bool isAdult = i < wizard.adultsCount;
                        if (isAdult && (p.idPhoto == null || p.idPhoto!.isEmpty)) {
                          isValid = false;
                        }
                      }

                      if (isValid) {
                        wizard.nextStep();
                      } else {
                        Get.snackbar(
                          "تنبيه",
                          "يرجى التأكد من تعبئة جميع الحقول ورفع صورة الهوية لجميع البالغين",
                          backgroundColor: Colors.redAccent.withOpacity(0.1),
                          colorText: Colors.red,
                          snackPosition: SnackPosition.BOTTOM
                        );
                      }
                    },
                    icon: const Icon(Icons.check_circle_outline, size: 20),
                    label: const Text("تأكيد ومتابعة", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
  }

  Widget _buildPassengerCard(int index, PassengerModel p, WizardController wizard, AuthService auth) {
    final isAdult = index < wizard.adultsCount;
    final typeLabel = isAdult ? "بالغ" : "طفل";
    final isFirstPassenger = index == 0;
    
    // We can use a local flag for "isMyself" but since the state is in the model,
    // we implicitly check if user data matches. 
    // However, to make it explicit UI toggle, we can just check if p.fullName == auth.userName (simplistic)
    // Or better, let's just hold a local set of indices that are "myself".
    // For simplicity in this stateless widget logic:
    // If it's the first passenger and the user is logged in, show the toggle.
    
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 10,
            spreadRadius: 1,
            offset: const Offset(0, 4)
          ),
        ],
        border: Border.all(color: isDark ? Colors.white10 : theme.dividerColor.withOpacity(0.1)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isAdult ? Theme.of(context).colorScheme.primary.withOpacity(0.1) : Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  isAdult ? Icons.person : Icons.child_care,
                  color: isAdult ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.secondary,
                  size: 20
                ),
              ),
              const SizedBox(width: 10),
              Text(
                "مسافر ${index + 1} - $typeLabel",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              if (isFirstPassenger && auth.isAuthenticated)
                 _buildMyselfToggle(p, auth, wizard),
            ],
          ),
          
          Divider(height: 24, thickness: 1, color: Colors.grey.withOpacity(0.1)),
          
          // Full Name
          _buildTextField(
            key: ValueKey("name_${index}_${p.fullName ?? 'empty'}"),
            label: "الاسم الكامل (كما في الهوية)",
            icon: Icons.badge_outlined,
            initialValue: p.fullName,
            onChanged: (v) => _updatePassenger(wizard, index, fullName: v),
            validator: (v) {
              if (v == null || v.trim().length < 3) return "يجب إدخال الاسم الثلاثي على الأقل";
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          // ID Number
          _buildTextField(
            key: ValueKey("id_${index}_${p.idNumber ?? 'empty'}"),
            label: "رقم الهوية / الجواز",
            icon: Icons.branding_watermark_outlined,
            initialValue: p.idNumber,
            keyboardType: TextInputType.text,
            onChanged: (v) => _updatePassenger(wizard, index, idNumber: v),
            validator: (v) {
              if (v == null || v.isEmpty) return "رقم الهوية مطلوب";
              if (v.length < 5) return "رقم الهوية قصير جداً";
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              // Gender
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: (p.gender != null && ['M', 'F'].contains(p.gender)) ? p.gender : null,
                  decoration: _inputDecoration("الجنس", Icons.wc),
                  items: const [
                    DropdownMenuItem(value: 'M', child: Text('ذكر')),
                    DropdownMenuItem(value: 'F', child: Text('أنثى')),
                  ],
                  onChanged: (v) => _updatePassenger(wizard, index, gender: v),
                  validator: (v) => v == null ? "مطلوب" : null,
                ),
              ),
              const SizedBox(width: 12),
              // DoB
              Expanded(
                child: _buildTextField(
                  label: "تاريخ الميلاد",
                  icon: Icons.calendar_today,
                  initialValue: p.birthDate,
                  readOnly: true, // Show date picker instead
                  onTap: () async {
                    DateTime initialDate = DateTime.now().subtract(const Duration(days: 365*20));
                    if (p.birthDate != null && p.birthDate!.isNotEmpty) {
                      try {
                        initialDate = DateTime.parse(p.birthDate!);
                      } catch (_) {}
                    }
                    
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: initialDate,
                      firstDate: DateTime(1900),
                      lastDate: DateTime.now(),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: ColorScheme.fromSeed(
                              seedColor: Theme.of(context).colorScheme.primary,
                              brightness: Theme.of(context).brightness,
                            ),
                          ),
                          child: child!,
                        );
                      }
                    );
                    
                    if (picked != null) {
                      // Format: YYYY-MM-DD
                      String formatted = "${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}";
                      // We need to re-render the field with new value, 
                      // but since we are inside ListView with controllers re-created on build...
                      // Actually simplistic approach: update logic and trigger rebuild via GetX
                       _updatePassenger(wizard, index, birthDate: formatted);
                    }
                  },
                  validator: (v) {
                     // Check regular expression if manual, but here it's readOnly picker
                     if (p.birthDate == null || p.birthDate!.isEmpty) return "مطلوب";
                     return null;
                  },
                  // A trick to show the value in the field since we aren't using a persistent controller in state
                  // p.birthDate is the source of truth
                  key: ValueKey("dob_$index${p.birthDate}"), 
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Phone Number
          _buildTextField(
            key: ValueKey("phone_${index}_${p.phoneNumber ?? 'empty'}"),
            label: "رقم الجوال",
            icon: Icons.phone_android,
            initialValue: p.phoneNumber,
            keyboardType: TextInputType.phone,
            onChanged: (v) => _updatePassenger(wizard, index, phoneNumber: v),
            validator: (v) {
              if (v == null || v.isEmpty) return "رقم الجوال مطلوب";
              // Basic regex for digits
              if (!RegExp(r'^[0-9]+$').hasMatch(v)) return "أرقام فقط";
              if (v.length < 9) return "الرقم غير صحيح";
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          // ID Photo Upload
          IdPhotoUploadWidget(
            passengerIndex: index,
            idPhoto: p.idPhoto,
            onPhotoSelected: (idx, url) => wizard.updatePassengerIdPhoto(idx, url),
          ),
        ],
      ),
    );
  }

  Widget _buildMyselfToggle(PassengerModel p, AuthService auth, WizardController wizard) {
    bool isMyself = (p.fullName == auth.userName && p.phoneNumber == auth.userId.toString());
    
    return InkWell(
      onTap: () {
         if (!isMyself) {
           // Fill with my data
           p.fullName = auth.userName ?? "";
           p.phoneNumber = auth.userId.toString();
           // ID number might not be in auth, so leave it or try to fetch if stored
         } else {
           // Clear data
           p.fullName = "";
           p.phoneNumber = "";
         }
         wizard.passengers.refresh();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isMyself ? Theme.of(context).colorScheme.primary.withOpacity(0.1) : Theme.of(context).dividerColor.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isMyself ? Theme.of(context).colorScheme.primary : Colors.transparent)
        ),
        child: Row(
          children: [
            Icon(
              isMyself ? Icons.check_circle : Icons.circle_outlined, 
              size: 16, 
              color: isMyself ? Theme.of(context).colorScheme.primary : Colors.grey
            ),
            const SizedBox(width: 6),
            Text(
              "أنا المسافر",
              style: TextStyle(
                color: isMyself ? Theme.of(context).colorScheme.primary : Colors.grey[600],
                fontSize: 12,
                fontWeight: FontWeight.bold
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required IconData icon,
    String? initialValue,
    ValueChanged<String>? onChanged,
    FormFieldValidator<String>? validator,
    TextInputType? keyboardType,
    bool readOnly = false,
    VoidCallback? onTap,
    Key? key,
  }) {
    return TextFormField(
      key: key ?? ValueKey(initialValue), // Important to update when model changes
      initialValue: initialValue,
      decoration: _inputDecoration(label, icon),
      onChanged: onChanged,
      validator: validator,
      keyboardType: keyboardType,
      readOnly: readOnly,
      onTap: onTap,
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    final theme = Theme.of(context);
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: theme.textTheme.bodyMedium?.color, fontSize: 13),
      prefixIcon: Icon(icon, color: theme.colorScheme.primary.withOpacity(0.6), size: 20),
      filled: true,
      fillColor: theme.brightness == Brightness.dark ? Colors.white.withOpacity(0.02) : const Color(0xFFF0F3FA),
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: theme.dividerColor.withOpacity(0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: theme.colorScheme.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: theme.colorScheme.error, width: 1),
      ),
    );
  }

  void _updatePassenger(WizardController w, int index, {String? fullName, String? idNumber, String? gender, String? birthDate, String? phoneNumber}) {
    if (fullName != null) w.passengers[index].fullName = fullName;
    if (idNumber != null) w.passengers[index].idNumber = idNumber;
    if (gender != null) w.passengers[index].gender = gender;
    if (birthDate != null) w.passengers[index].birthDate = birthDate;
    if (phoneNumber != null) w.passengers[index].phoneNumber = phoneNumber;
    
    // We don't call refresh() here on every char to avoid rebuilding the WHOLE list if not needed,
    // but the GetX Obx list might need it to update state elsewhere. 
    // In this widget, we use Form validation at the end, so state sync is important.
    // If we call w.passengers.refresh(), the ListView rebuilds.
    // Since we are using TextFormField with initialValue, rebuilding might reset cursor if we don't manage controllers carefully.
    // SOLUTION: We update the underlying model WITHOUT calling refresh() for text fields to avoid list rebuilds while typing.
    // However, for non-text fields like gender/date, we CAN call refresh() since they don't have typing cursor issues.
    // For now, we'll just update the model and rely on the final validation step.
  }
}
