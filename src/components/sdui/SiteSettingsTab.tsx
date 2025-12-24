import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import {
  useUISiteSettings,
  useUpdateSiteSetting,
  type UISiteSetting,
} from "@/hooks/useSDUI";

const groupLabels: Record<string, string> = {
  general: "الإعدادات العامة",
  theme: "المظهر",
  contact: "معلومات التواصل",
  social: "وسائل التواصل الاجتماعي",
};

export const SiteSettingsTab = () => {
  const { data: settings, isLoading } = useUISiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value || "";
      });
      setLocalSettings(settingsMap);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setChangedKeys((prev) => new Set(prev).add(key));
  };

  const handleSave = async (key: string) => {
    await updateSetting.mutateAsync({ key, value: localSettings[key] });
    setChangedKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const handleSaveAll = async () => {
    for (const key of changedKeys) {
      await updateSetting.mutateAsync({ key, value: localSettings[key] });
    }
    setChangedKeys(new Set());
  };

  const groupedSettings = settings?.reduce((acc, setting) => {
    const group = setting.setting_group || "general";
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, UISiteSetting[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderInput = (setting: UISiteSetting) => {
    const value = localSettings[setting.setting_key] || "";
    const isChanged = changedKeys.has(setting.setting_key);

    switch (setting.setting_type) {
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) =>
                handleChange(setting.setting_key, checked.toString())
              }
            />
            <span className="text-sm text-muted-foreground">
              {value === "true" ? "مفعل" : "معطل"}
            </span>
          </div>
        );
      case "color":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <Input
              value={value}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              placeholder="https://..."
            />
            {value && (
              <img
                src={value}
                alt="Preview"
                className="h-12 object-contain bg-muted rounded"
              />
            )}
          </div>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {changedKeys.size > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSaveAll} disabled={updateSetting.isPending}>
            {updateSetting.isPending && (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            )}
            <Save className="w-4 h-4 ml-2" />
            حفظ جميع التغييرات ({changedKeys.size})
          </Button>
        </div>
      )}

      {groupedSettings &&
        Object.entries(groupedSettings).map(([group, groupSettings]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle>{groupLabels[group] || group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupSettings.map((setting) => (
                <div
                  key={setting.setting_key}
                  className="flex flex-col gap-2 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-base">
                      {setting.description || setting.setting_key}
                    </Label>
                    {changedKeys.has(setting.setting_key) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(setting.setting_key)}
                        disabled={updateSetting.isPending}
                      >
                        حفظ
                      </Button>
                    )}
                  </div>
                  {renderInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
};
