import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const BackupService = {
    /**
     * Exports key database tables to a single multi-sheet Excel file.
     * This serves as a manual portable backup.
     */
    async exportFullDatabase() {
        try {
            toast.loading("جاري تحضير نسخة احتياطية كاملة...");

            // List of critical tables to backup
            const tables = [
                'partners',
                'users',
                'trips',
                'bookings',
                'passengers',
                'buses',
                'drivers',
                'cities',
                'routes',
                'route_stops',
                'cancellation_policies',
                'cancel_policy_rules',
                'branches',
                'commissions',
                'payment_transactions',
                'seats'
            ];

            const wb = XLSX.utils.book_new();

            for (const table of tables) {
                // Using (supabase as any) to allow dynamic table names which might not be in the generated types
                const { data, error } = await (supabase as any).from(table).select('*');

                if (error) {
                    console.error(`Error backing up table ${table}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, table.substring(0, 31));
                }
            }

            const fileName = `ahjazly_full_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.dismiss();
            toast.success("تم تصدير النسخة الاحتياطية بنجاح");
        } catch (error) {
            console.error("Manual Backup Error:", error);
            toast.dismiss();
            toast.error("حدث خطأ أثناء إنشاء النسخة الاحتياطية");
        }
    },

    /**
     * Exports a specific table to JSON for more precise data structure preservation.
     */
    async exportTableAsJSON(tableName: string) {
        try {
            const { data, error } = await (supabase as any).from(tableName).select('*');

            if (error) throw error;

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${tableName}_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`تم تصدير جدول ${tableName} بنجاح`);
        } catch (error) {
            console.error("JSON Export Error:", error);
            toast.error("فشل تصدير البيانات بصيغة JSON");
        }
    },

    /**
     * Exports data specific to a partner.
     */
    async exportPartnerData(partnerId: string | number) {
        try {
            toast.loading("جاري تحضير بياناتك...");

            const wb = XLSX.utils.book_new();

            // Tables that have partner_id
            const partnerTables = [
                { name: 'trips', filter: 'partner_id' },
                { name: 'bookings', filter: 'partner_id' },
                { name: 'buses', filter: 'partner_id' },
                { name: 'drivers', filter: 'partner_id' },
                { name: 'branches', filter: 'partner_id' },
                { name: 'commissions', filter: 'partner_id' }
            ];

            for (const tableInfo of partnerTables) {
                let query = (supabase as any).from(tableInfo.name).select('*');

                if (tableInfo.name === 'bookings') {
                    // Bookings don't have partner_id directly, they relate through trips
                    // We can use a join-like filter: trips!inner(partner_id)
                    query = (supabase as any)
                        .from('bookings')
                        .select('*, trips!inner(partner_id)')
                        .eq('trips.partner_id', partnerId);
                } else {
                    query = query.eq(tableInfo.filter, partnerId);
                }

                const { data, error } = await query;

                if (error) {
                    console.error(`Error backing up table ${tableInfo.name}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    // Clean up the joined data if any before excel export
                    const cleanedData = data.map((row: any) => {
                        const { trips, ...rest } = row;
                        return rest;
                    });
                    const ws = XLSX.utils.json_to_sheet(cleanedData);
                    XLSX.utils.book_append_sheet(wb, ws, tableInfo.name);
                }
            }

            const fileName = `partner_data_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.dismiss();
            toast.success("تم تصدير بياناتك بنجاح");
        } catch (error) {
            console.error("Partner Export Error:", error);
            toast.dismiss();
            toast.error("حدث خطأ أثناء تصدير البيانات");
        }
    }
};
