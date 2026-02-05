import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Validation Schema
const bankDetailsSchema = z.object({
    bankName: z.string()
        .min(2, "اسم البنك مطلوب")
        .max(100, "اسم البنك طويل جداً"),

    iban: z.string()
        .regex(/^SA\d{22}$/, "رقم الآيبان غير صحيح (يجب أن يبدأ بـ SA ويتكون من 24 حرف)")
        .trim(),

    accountNumber: z.string()
        .min(1, "رقم الحساب مطلوب")
        .max(50, "رقم الحساب طويل جداً")
        .trim(),

    swiftCode: z.string()
        .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "رمز السويفت غير صحيح (مثال: RIBLSARI)")
        .optional()
        .or(z.literal("")),
});

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

const BankDetails = () => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasExistingData, setHasExistingData] = useState(false);

    const form = useForm<BankDetailsFormValues>({
        resolver: zodResolver(bankDetailsSchema),
        defaultValues: {
            bankName: "",
            iban: "",
            accountNumber: "",
            swiftCode: "",
        },
    });

    // Fetch existing bank details
    useEffect(() => {
        const fetchBankDetails = async () => {
            if (!userRole?.partner_id) {
                toast({
                    title: "خطأ",
                    description: "لم يتم العثور على معرف الشريك",
                    variant: "destructive",
                });
                navigate("/partner");
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("partners")
                    .select("bank_name, iban, account_number, swift_code")
                    .eq("partner_id", userRole.partner_id)
                    .single();

                if (error) throw error;

                if (data) {
                    // Check if any bank data exists
                    const hasData = !!(data.bank_name || data.iban || data.account_number || data.swift_code);
                    setHasExistingData(hasData);

                    // Populate form with existing data
                    form.reset({
                        bankName: data.bank_name || "",
                        iban: data.iban || "",
                        accountNumber: data.account_number || "",
                        swiftCode: data.swift_code || "",
                    });
                }
            } catch (error: any) {
                console.error("Error fetching bank details:", error);
                toast({
                    title: "خطأ",
                    description: "فشل في تحميل البيانات البنكية",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBankDetails();
    }, [userRole, navigate, form]);

    const onSubmit = async (values: BankDetailsFormValues) => {
        if (!userRole?.partner_id) {
            toast({
                title: "خطأ",
                description: "لم يتم العثور على معرف الشريك",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from("partners")
                .update({
                    bank_name: values.bankName,
                    iban: values.iban,
                    account_number: values.accountNumber,
                    swift_code: values.swiftCode || null,
                })
                .eq("partner_id", userRole.partner_id);

            if (error) throw error;

            toast({
                title: "تم الحفظ بنجاح",
                description: "تم حفظ البيانات البنكية بنجاح",
            });

            setHasExistingData(true);
        } catch (error: any) {
            console.error("Error saving bank details:", error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في حفظ البيانات البنكية",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">البيانات البنكية</h1>
                <p className="text-muted-foreground">
                    قم بإدخال أو تحديث بياناتك البنكية لاستلام المدفوعات
                </p>
            </div>

            {!hasExistingData && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                            يرجى إكمال البيانات البنكية
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            البيانات البنكية مطلوبة لاستلام المدفوعات من المنصة
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        معلومات الحساب البنكي
                    </CardTitle>
                    <CardDescription>
                        جميع الحقول مطلوبة باستثناء رمز السويفت
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Bank Name */}
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اسم البنك *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="مثال: البنك الأهلي السعودي" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            اسم البنك الذي تتعامل معه الشركة
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* IBAN */}
                            <FormField
                                control={form.control}
                                name="iban"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رقم الآيبان (IBAN) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="SA0000000000000000000000"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 حرف
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Account Number */}
                            <FormField
                                control={form.control}
                                name="accountNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رقم الحساب *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="رقم الحساب البنكي" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            رقم الحساب البنكي الخاص بالشركة
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* SWIFT Code */}
                            <FormField
                                control={form.control}
                                name="swiftCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>رمز السويفت (SWIFT Code)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="RIBLSARI"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            رمز السويفت اختياري (8 أو 11 حرف)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 ml-2" />
                                            حفظ البيانات
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/partner")}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">معلومات مهمة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• تأكد من صحة البيانات البنكية قبل الحفظ</p>
                    <p>• سيتم استخدام هذه البيانات لتحويل المدفوعات الخاصة بك</p>
                    <p>• يمكنك تحديث البيانات في أي وقت</p>
                    <p>• رمز السويفت مطلوب فقط للتحويلات الدولية</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default BankDetails;
