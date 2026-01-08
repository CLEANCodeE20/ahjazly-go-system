import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Image, Tag, Settings, Megaphone } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ComponentsTab } from "@/components/sdui/ComponentsTab";
import { AdvertisementsTab } from "@/components/sdui/AdvertisementsTab";
import { PromotionsTab } from "@/components/sdui/PromotionsTab";
import { SiteSettingsTab } from "@/components/sdui/SiteSettingsTab";
import { PageLayoutsTab } from "@/components/sdui/PageLayoutsTab";

const SDUIManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("components");

  return (
    <AdminLayout
      title="إدارة واجهة المستخدم"
      subtitle="تحكم في مظهر ومحتوى الصفحات العامة"
      actions={
        <Button variant="outline" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          <span className="hidden sm:inline">العودة للوحة التحكم</span>
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid gap-2 overflow-x-auto">
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden md:inline">المكونات</span>
            </TabsTrigger>
            <TabsTrigger value="layouts" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden md:inline">الصفحات</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden md:inline">الإعلانات</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden md:inline">العروض</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">الإعدادات</span>
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
    </AdminLayout>
  );
};

export default SDUIManagement;
