import 'package:get/get.dart';
import '../../../core/usecase/usecase.dart';
import '../domain/usecases/get_cancellation_policies_usecase.dart';

import '../data/models/cancel_policy_model.dart';

class CancelPoliciesController extends GetxController {
  final GetCancellationPoliciesUseCase _getPoliciesUseCase = Get.find();
  
  final companies = <CompanyCancelPolicies>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  final expandedPolicies = RxMap<int, int?>();

  @override
  void onInit() {
    super.onInit();
    fetchFromApi();
  }

  Future<void> fetchFromApi() async {
    isLoading.value = true;
    errorMessage.value = '';
    
    try {
      final result = await _getPoliciesUseCase(NoParams());
      
      result.fold(
        (failure) {
          errorMessage.value = 'خطأ في جلب سياسات الإلغاء';
        },
        (policyEntities) {
          // Group policies by partner
          final groupedPolicies = <String, List<CancelPolicy>>{};
          
          for (var entity in policyEntities) {
            final partnerName = entity.partnerName ?? 'سياسات عامة';
            if (!groupedPolicies.containsKey(partnerName)) {
              groupedPolicies[partnerName] = [];
            }
            
            groupedPolicies[partnerName]!.add(CancelPolicy(
              id: entity.policyId,
              title: entity.policyName,
              description: entity.description ?? '',
              refundPercentage: entity.refundPercentage.toDouble(),
              daysBeforeTrip: entity.daysBeforeTrip,
              rules: entity.rules?.map((rule) {
                return CancelPolicyRule(
                  id: rule.ruleId,
                  hoursBeforeTrip: rule.minHoursBeforeDeparture != null 
                      ? rule.minHoursBeforeDeparture!.toInt() 
                      : 0,
                  refundPercentage: rule.refundPercentage.toDouble(),
                );
              }).toList(),
            ));
          }

          companies.value = groupedPolicies.entries.map((entry) {
            return CompanyCancelPolicies(
              companyId: groupedPolicies.keys.toList().indexOf(entry.key),
              companyName: entry.key,
              policies: entry.value,
            );
          }).toList();
          
          expandedPolicies.clear();
        },
      );
    } catch (e) {
      errorMessage.value = 'خطأ في جلب سياسات الإلغاء: $e';
    } finally {
      isLoading.value = false;
    }
  }

  void togglePolicy(int companyId, int policyId) {
    final current = expandedPolicies[companyId];
    if (current == policyId) {
      expandedPolicies[companyId] = null;
    } else {
      expandedPolicies[companyId] = policyId;
    }
  }
}
