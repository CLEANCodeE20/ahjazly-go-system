import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Settings, Eye } from "lucide-react";
import { useUIPageLayouts, useUpdatePageLayout, type UIPageLayout } from "@/hooks/useSDUI";

const pageLabels: Record<string, string> = {
  home: "الصفحة الرئيسية",
  search: "البحث عن رحلات",
  booking: "حجز التذاكر",
  about: "من نحن",
  contact: "اتصل بنا",
  all: "جميع الصفحات",
};

export const PageLayoutsTab = () => {
  const { data: layouts, isLoading } = useUIPageLayouts();
  const updateLayout = useUpdatePageLayout();

  const toggleActive = async (layout: UIPageLayout) => {
    await updateLayout.mutateAsync({
      id: layout.layout_id,
      updates: { is_active: !layout.is_active },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>الصفحات المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصفحة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layouts?.map((layout) => (
                <TableRow key={layout.layout_id}>
                  <TableCell className="font-medium">
                    {pageLabels[layout.page_key] || layout.page_title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {layout.page_description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={layout.is_active ? "default" : "secondary"}>
                      {layout.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={layout.is_active}
                          onCheckedChange={() => toggleActive(layout)}
                          disabled={updateLayout.isPending}
                        />
                        {updateLayout.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${layout.page_key === "home" ? "" : layout.page_key}`, "_blank")}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        معاينة
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>كيفية استخدام SDUI</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ol className="space-y-2 text-muted-foreground">
            <li>
              <strong>المكونات:</strong> أنشئ مكونات مثل البانرات والأقسام
            </li>
            <li>
              <strong>الإعلانات:</strong> أضف إعلانات في مواقع مختلفة
            </li>
            <li>
              <strong>العروض:</strong> أنشئ أكواد خصم وعروض ترويجية
            </li>
            <li>
              <strong>الإعدادات:</strong> خصص مظهر الموقع ومعلومات التواصل
            </li>
          </ol>
          <p className="mt-4 text-sm">
            جميع التغييرات ستظهر مباشرة في الصفحات العامة بعد نشرها.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
