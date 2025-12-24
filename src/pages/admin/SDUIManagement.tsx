import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Image, Tag, Settings, Megaphone } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { ComponentsTab } from "@/components/sdui/ComponentsTab";
import { AdvertisementsTab } from "@/components/sdui/AdvertisementsTab";
import { PromotionsTab } from "@/components/sdui/PromotionsTab";
import { SiteSettingsTab } from "@/components/sdui/SiteSettingsTab";
import { PageLayoutsTab } from "@/components/sdui/PageLayoutsTab";

const SDUIManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("components");

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 mr-0 lg:mr-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">إدارة واجهة المستخدم</h1>
              <p className="text-muted-foreground mt-1">
                تحكم في مظهر ومحتوى الصفحات العامة
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للوحة التحكم
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid gap-2">
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">المكونات</span>
              </TabsTrigger>
              <TabsTrigger value="layouts" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">الصفحات</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">الإعلانات</span>
              </TabsTrigger>
              <TabsTrigger value="promotions" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">العروض</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">الإعدادات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components">
              <ComponentsTab />
            </TabsContent>

            <TabsContent value="layouts">
              <PageLayoutsTab />
            </TabsContent>

            <TabsContent value="ads">
              <AdvertisementsTab />
            </TabsContent>

            <TabsContent value="promotions">
              <PromotionsTab />
            </TabsContent>

            <TabsContent value="settings">
              <SiteSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SDUIManagement;
