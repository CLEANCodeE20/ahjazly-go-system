import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    Save,
    Loader2,
    ArrowLeft,
    Shield,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const UserProfile = () => {
    const navigate = useNavigate();
    const {
        profile,
        loading,
        updating,
        updateProfile,
        getAvatarInitials
    } = useUserProfile();

    const [formData, setFormData] = useState({
        full_name: "",
        phone_number: "",
        gender: ""
    });

    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                phone_number: profile.phone_number || "",
                gender: profile.gender || ""
            });
        }
    }, [profile]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const updates: any = {};

        if (formData.full_name !== profile?.full_name) updates.full_name = formData.full_name;
        if (formData.phone_number !== profile?.phone_number) updates.phone_number = formData.phone_number;
        if (formData.gender !== profile?.gender) updates.gender = formData.gender;

        if (Object.keys(updates).length > 0) {
            const success = await updateProfile(updates);
            if (success) {
                setHasChanges(false);
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="الملف الشخصي" subtitle="إدارة معلوماتك الشخصية">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) {
        return (
            <DashboardLayout title="الملف الشخصي" subtitle="إدارة معلوماتك الشخصية">
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">لم يتم العثور على بيانات الملف الشخصي</p>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="الملف الشخصي"
            subtitle="إدارة معلوماتك الشخصية وإعداداتك"
        >
            <div className="space-y-6">
                {/* Profile Header Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {getAvatarInitials()}
                            </div>
                            <div>
                                <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                                <CardDescription>{profile.email}</CardDescription>
                                <Badge variant="outline" className="mt-2">
                                    {profile.user_type === 'customer' ? 'عميل' : 
                                     profile.user_type === 'partner' ? 'شريك' : 
                                     profile.user_type === 'employee' ? 'موظف' : profile.user_type}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                        <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
                        <TabsTrigger value="security">الأمان</TabsTrigger>
                    </TabsList>

                    {/* Personal Information Tab */}
                    <TabsContent value="personal" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>المعلومات الأساسية</CardTitle>
                                <CardDescription>
                                    معلوماتك الشخصية الأساسية
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">الاسم الكامل *</Label>
                                        <div className="relative">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="full_name"
                                                value={formData.full_name}
                                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                                className="pr-10"
                                                placeholder="أدخل الاسم الكامل"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">البريد الإلكتروني</Label>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                value={profile.email || ""}
                                                disabled
                                                className="pr-10 bg-muted"
                                            />
                                            <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone_number">رقم الهاتف</Label>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="phone_number"
                                                value={formData.phone_number}
                                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                                className="pr-10"
                                                placeholder="+966 5X XXX XXXX"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">الجنس</Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(value) => handleInputChange('gender', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الجنس" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">ذكر</SelectItem>
                                                <SelectItem value="female">أنثى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!hasChanges || updating}
                                    >
                                        {updating ? (
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 ml-2" />
                                        )}
                                        حفظ التغييرات
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(-1)}
                                    >
                                        <ArrowLeft className="w-4 h-4 ml-2" />
                                        رجوع
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    الأمان والخصوصية
                                </CardTitle>
                                <CardDescription>
                                    إدارة إعدادات الأمان والخصوصية لحسابك
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <p className="font-medium">تغيير كلمة المرور</p>
                                            <p className="text-sm text-muted-foreground">
                                                قم بتحديث كلمة المرور بشكل دوري لحماية حسابك
                                            </p>
                                        </div>
                                        <Button variant="outline">
                                            تغيير
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border">
                                        <div>
                                            <p className="font-medium">المصادقة الثنائية</p>
                                            <p className="text-sm text-muted-foreground">
                                                أضف طبقة حماية إضافية لحسابك
                                            </p>
                                        </div>
                                        <Button variant="outline">
                                            إعداد
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-4">معلومات الحساب</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">تاريخ الإنشاء</span>
                                            <span>{profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-SA') : '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">حالة الحساب</span>
                                            <Badge variant={profile.account_status === 'active' ? 'default' : 'secondary'}>
                                                {profile.account_status === 'active' ? 'نشط' : profile.account_status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default UserProfile;
