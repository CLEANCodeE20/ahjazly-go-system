import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    IdCard,
    Save,
    Loader2,
    ArrowLeft,
    Shield,
    CheckCircle2,
    AlertCircle,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AvatarUpload } from "@/components/users/AvatarUpload";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const UserProfile = () => {
    const navigate = useNavigate();
    const {
        profile,
        loading,
        updating,
        updateProfile,
        uploadAvatar,
        deleteAvatar,
        getAvatarInitials
    } = useUserProfile();

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || "",
        phone_number: profile?.phone_number || "",
        bio: profile?.bio || "",
        date_of_birth: profile?.date_of_birth || "",
        nationality: profile?.nationality || "",
        id_number: profile?.id_number || "",
        gender: profile?.gender || ""
    });

    const [hasChanges, setHasChanges] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const updates: any = {};

        // Only include changed fields
        if (formData.full_name !== profile?.full_name) updates.full_name = formData.full_name;
        if (formData.phone_number !== profile?.phone_number) updates.phone_number = formData.phone_number;
        if (formData.bio !== profile?.bio) updates.bio = formData.bio;
        if (formData.date_of_birth !== profile?.date_of_birth) updates.date_of_birth = formData.date_of_birth;
        if (formData.nationality !== profile?.nationality) updates.nationality = formData.nationality;
        if (formData.id_number !== profile?.id_number) updates.id_number = formData.id_number;
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
                {/* Profile Completion Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">اكتمال الملف الشخصي</CardTitle>
                                <CardDescription>
                                    أكمل معلوماتك للحصول على تجربة أفضل
                                </CardDescription>
                            </div>
                            <div className="text-3xl font-bold text-primary">
                                {profile.profile_completion_percentage}%
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={profile.profile_completion_percentage} className="h-2" />
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {!profile.avatar_url && (
                                <Badge variant="outline" className="gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    أضف صورة شخصية
                                </Badge>
                            )}
                            {!profile.email_verified && (
                                <Badge variant="outline" className="gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    تحقق من البريد الإلكتروني
                                </Badge>
                            )}
                            {!profile.phone_verified && (
                                <Badge variant="outline" className="gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    تحقق من رقم الهاتف
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                        <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
                        <TabsTrigger value="security">الأمان</TabsTrigger>
                    </TabsList>

                    {/* Personal Information Tab */}
                    <TabsContent value="personal" className="space-y-6">
                        {/* Avatar Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>الصورة الشخصية</CardTitle>
                                <CardDescription>
                                    قم بتحميل صورة شخصية لتمييز حسابك
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AvatarUpload
                                    currentAvatar={profile.avatar_url}
                                    initials={getAvatarInitials()}
                                    onUpload={uploadAvatar}
                                    onDelete={deleteAvatar}
                                    uploading={updating}
                                />
                            </CardContent>
                        </Card>

                        {/* Basic Information */}
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
                                            {profile.email_verified && (
                                                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                                            )}
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
                                            {profile.phone_verified && (
                                                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                                            )}
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

                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                                        <div className="relative">
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                                className="pr-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nationality">الجنسية</Label>
                                        <div className="relative">
                                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="nationality"
                                                value={formData.nationality}
                                                onChange={(e) => handleInputChange('nationality', e.target.value)}
                                                className="pr-10"
                                                placeholder="السعودية"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="id_number">رقم الهوية</Label>
                                        <div className="relative">
                                            <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="id_number"
                                                value={formData.id_number}
                                                onChange={(e) => handleInputChange('id_number', e.target.value)}
                                                className="pr-10"
                                                placeholder="1XXXXXXXXX"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="bio">نبذة عنك</Label>
                                        <Textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            placeholder="اكتب نبذة مختصرة عنك..."
                                            rows={4}
                                        />
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
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <p className="font-medium">حالة الحساب</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.account_status === 'active' ? 'نشط' : profile.account_status}
                                        </p>
                                    </div>
                                    <Badge variant={profile.account_status === 'active' ? 'default' : 'secondary'}>
                                        {profile.account_status === 'active' ? 'نشط' : profile.account_status}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <p className="font-medium">نوع الحساب</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.user_type === 'customer' ? 'عميل' : profile.user_type}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b">
                                    <div>
                                        <p className="font-medium">تاريخ الإنشاء</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(profile.created_at).toLocaleDateString('ar-SA')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium">آخر تسجيل دخول</p>
                                        <p className="text-sm text-muted-foreground">
                                            {profile.last_login_at
                                                ? new Date(profile.last_login_at).toLocaleString('ar-SA')
                                                : 'غير متوفر'}
                                        </p>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/settings')}>
                                    <Edit className="w-4 h-4 ml-2" />
                                    إدارة كلمة المرور والأمان
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default UserProfile;
