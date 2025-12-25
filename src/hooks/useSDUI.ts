import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types for SDUI - using simple string types for flexibility
export interface UIComponent {
  component_id: number;
  component_type: string;
  component_name: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  background_image: string | null;
  link_url: string | null;
  link_text: string | null;
  button_text: string | null;
  button_url: string | null;
  button_style: string | null;
  custom_styles: Record<string, unknown> | null;
  custom_data: Record<string, unknown> | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  click_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface UIPageLayout {
  layout_id: number;
  page_key: "home" | "search" | "booking" | "about" | "contact" | "all";
  page_title: string;
  page_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UIComponentPlacement {
  placement_id: number;
  layout_id: number;
  component_id: number;
  position: string;
  display_order: number;
  is_visible: boolean;
  custom_config: Record<string, unknown> | null;
  created_at: string;
  component?: UIComponent;
}

export interface UIAdvertisement {
  ad_id: number;
  ad_name: string;
  ad_type: string;
  ad_position: string;
  target_pages: string[];
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  alt_text: string | null;
  advertiser_name: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  priority: number;
  click_count: number;
  impression_count: number;
  daily_budget: number | null;
  total_budget: number | null;
  cost_per_click: number | null;
  cost_per_impression: number | null;
  target_audience: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UIPromotion {
  promo_id: number;
  promo_code: string | null;
  promo_name: string;
  promo_type: string;
  discount_value: number | null;
  min_booking_amount: number | null;
  max_discount: number | null;
  applicable_routes: number[] | null;
  applicable_partners: number[] | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  banner_image: string | null;
  display_on_home: boolean;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
}

export interface UISiteSetting {
  setting_id: number;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  setting_group: string | null;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

// Hook for fetching UI components
export const useUIComponents = () => {
  return useQuery({
    queryKey: ["ui-components"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_components")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as unknown as UIComponent[];
    },
  });
};

// Hook for fetching page layouts
export const useUIPageLayouts = () => {
  return useQuery({
    queryKey: ["ui-page-layouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_page_layouts")
        .select("*")
        .order("layout_id");

      if (error) throw error;
      return data as unknown as UIPageLayout[];
    },
  });
};

// Hook for fetching advertisements
export const useUIAdvertisements = () => {
  return useQuery({
    queryKey: ["ui-advertisements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_advertisements")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as unknown as UIAdvertisement[];
    },
  });
};

// Hook for fetching promotions
export const useUIPromotions = () => {
  return useQuery({
    queryKey: ["ui-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_promotions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as UIPromotion[];
    },
  });
};

// Hook for fetching site settings
export const useUISiteSettings = () => {
  return useQuery({
    queryKey: ["ui-site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_site_settings")
        .select("*")
        .order("setting_group", { ascending: true });

      if (error) throw error;
      return data as unknown as UISiteSetting[];
    },
  });
};

// Hook for fetching components by page
export const usePageComponents = (pageKey: string) => {
  return useQuery({
    queryKey: ["page-components", pageKey],
    queryFn: async () => {
      const { data: layout, error: layoutError } = await supabase
        .from("ui_page_layouts")
        .select("layout_id")
        .eq("page_key", pageKey as "home" | "search" | "booking" | "about" | "contact" | "all")
        .eq("is_active", true)
        .single();

      if (layoutError || !layout) return [];

      const { data: placements, error: placementsError } = await supabase
        .from("ui_component_placements")
        .select(`
          *,
          component:ui_components (*)
        `)
        .eq("layout_id", layout.layout_id)
        .eq("is_visible", true)
        .order("display_order");

      if (placementsError) throw placementsError;
      return placements as unknown as UIComponentPlacement[];
    },
    enabled: !!pageKey,
  });
};


// Hook for fetching active ads for a page
export const usePageAds = (pageKey: string) => {
  return useQuery({
    queryKey: ["page-ads", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ui_advertisements")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) throw error;

      // Filter ads that target this page or 'all'
      return (data as unknown as UIAdvertisement[]).filter(
        ad => ad.target_pages?.includes(pageKey) || ad.target_pages?.includes("all")
      );
    },
    enabled: !!pageKey,
  });
};

// Input types for mutations (without readonly fields)
type ComponentInput = {
  component_type: string;
  component_name: string;
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  background_image?: string;
  link_url?: string;
  link_text?: string;
  button_text?: string;
  button_url?: string;
  button_style?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number;
};

type AdvertisementInput = {
  ad_name: string;
  ad_type: string;
  ad_position: string;
  target_pages?: string[];
  image_url?: string;
  mobile_image_url?: string;
  link_url?: string;
  alt_text?: string;
  advertiser_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  priority?: number;
};

type PromotionInput = {
  promo_code?: string;
  promo_name: string;
  promo_type: string;
  discount_value?: number | null;
  min_booking_amount?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  display_on_home?: boolean;
  terms_conditions?: string;
  banner_image?: string;
};

// Mutations
export const useCreateComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (component: ComponentInput) => {
      const { data, error } = await supabase
        .from("ui_components")
        .insert(component as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-components"] });
      toast({ title: "تم الإنشاء", description: "تم إنشاء المكون بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في إنشاء المكون", variant: "destructive" });
    },
  });
};

export const useUpdateComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ComponentInput> }) => {
      const { data, error } = await supabase
        .from("ui_components")
        .update(updates as any)
        .eq("component_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-components"] });
      toast({ title: "تم التحديث", description: "تم تحديث المكون بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث المكون", variant: "destructive" });
    },
  });
};

export const useDeleteComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("ui_components")
        .delete()
        .eq("component_id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-components"] });
      toast({ title: "تم الحذف", description: "تم حذف المكون بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في حذف المكون", variant: "destructive" });
    },
  });
};

export const useCreateAdvertisement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: AdvertisementInput) => {
      const { data, error } = await supabase
        .from("ui_advertisements")
        .insert(ad as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-advertisements"] });
      toast({ title: "تم الإنشاء", description: "تم إنشاء الإعلان بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في إنشاء الإعلان", variant: "destructive" });
    },
  });
};

export const useUpdateAdvertisement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<AdvertisementInput> }) => {
      const { data, error } = await supabase
        .from("ui_advertisements")
        .update(updates as any)
        .eq("ad_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-advertisements"] });
      toast({ title: "تم التحديث", description: "تم تحديث الإعلان بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث الإعلان", variant: "destructive" });
    },
  });
};

export const useDeleteAdvertisement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("ui_advertisements")
        .delete()
        .eq("ad_id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-advertisements"] });
      toast({ title: "تم الحذف", description: "تم حذف الإعلان بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في حذف الإعلان", variant: "destructive" });
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promo: PromotionInput) => {
      const { data, error } = await supabase
        .from("ui_promotions")
        .insert(promo as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-promotions"] });
      toast({ title: "تم الإنشاء", description: "تم إنشاء العرض بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في إنشاء العرض", variant: "destructive" });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<PromotionInput> }) => {
      const { data, error } = await supabase
        .from("ui_promotions")
        .update(updates as any)
        .eq("promo_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-promotions"] });
      toast({ title: "تم التحديث", description: "تم تحديث العرض بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث العرض", variant: "destructive" });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("ui_promotions")
        .delete()
        .eq("promo_id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-promotions"] });
      toast({ title: "تم الحذف", description: "تم حذف العرض بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في حذف العرض", variant: "destructive" });
    },
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from("ui_site_settings")
        .update({ setting_value: value })
        .eq("setting_key", key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-site-settings"] });
      toast({ title: "تم التحديث", description: "تم تحديث الإعداد بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث الإعداد", variant: "destructive" });
    },
  });
};

export const useUpdatePageLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UIPageLayout> }) => {
      const { data, error } = await supabase
        .from("ui_page_layouts")
        .update(updates)
        .eq("layout_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-page-layouts"] });
      toast({ title: "تم التحديث", description: "تم تحديث الصفحة بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تحديث الصفحة", variant: "destructive" });
    },
  });
};
