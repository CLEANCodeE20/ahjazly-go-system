import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../controller/support_ticket_controller.dart';
import '../../domain/entities/support_ticket_entity.dart';

class MySupportTicketsPage extends GetView<SupportTicketController> {
  const MySupportTicketsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColor.background,
      appBar: AppBar(
        title: const Text(
          'تذاكر الدعم الخاصة بي',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColor.textPrimary,
      ),
      body: Obx(() {
        if (controller.isFetching.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.myTickets.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.support_agent_outlined, size: 60, color: AppColor.textSecondary.withOpacity(0.5)),
                const SizedBox(height: 16),
                Text(
                  'لا توجد تذاكر دعم حالياً',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeLarge,
                    color: AppColor.textSecondary,
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: controller.fetchTickets,
          child: ListView.builder(
            padding: EdgeInsets.all(AppDimensions.paddingMedium),
            itemCount: controller.myTickets.length,
            itemBuilder: (context, index) {
              final ticket = controller.myTickets[index];
              return _buildTicketCard(ticket);
            },
          ),
        );
      }),
    );
  }

  Widget _buildTicketCard(SupportTicketEntity ticket) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        side: BorderSide(color: AppColor.divider.withOpacity(0.5)),
      ),
      margin: EdgeInsets.only(bottom: AppDimensions.spacingMedium),
      child: ExpansionTile(
        title: Text(
          ticket.subject,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Row(
          children: [
            _buildStatusBadge(ticket.status),
            const SizedBox(width: 8),
            Text(
              ticket.category ?? '',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: AppDimensions.fontSizeSmall,
                color: AppColor.textSecondary,
              ),
            ),
          ],
        ),
        children: [
          Padding(
            padding: EdgeInsets.all(AppDimensions.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'تفاصيل المشكلة:',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ticket.description,
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'التاريخ: ${ticket.createdAt.day}/${ticket.createdAt.month}/${ticket.createdAt.year}',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: AppDimensions.fontSizeSmall,
                        color: AppColor.textSecondary,
                      ),
                    ),
                    Text(
                      'الأولوية: ${ticket.priority}',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: AppDimensions.fontSizeSmall,
                        color: AppColor.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;

    switch (status.toLowerCase()) {
      case 'open':
        color = Colors.blue;
        label = 'مفتوحة';
        break;
      case 'in_progress':
        color = Colors.orange;
        label = 'قيد المعالجة';
        break;
      case 'resolved':
        color = Colors.green;
        label = 'تم الحل';
        break;
      case 'closed':
        color = Colors.grey;
        label = 'مغلقة';
        break;
      default:
        color = Colors.grey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
