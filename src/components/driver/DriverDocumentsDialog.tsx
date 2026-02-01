import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { useDriverDocuments, useUploadDriverDocument } from "@/hooks/useDrivers";

interface DriverDocumentsDialogProps {
    driverId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DriverDocumentsDialog = ({ driverId, open, onOpenChange }: DriverDocumentsDialogProps) => {
    const { data: documents, isLoading } = useDriverDocuments(driverId);
    const uploadDocument = useUploadDriverDocument();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState("license");
    const [documentNumber, setDocumentNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const handleUpload = async () => {
        if (!selectedFile || !driverId) return;

        await uploadDocument.mutateAsync({
            driverId,
            file: selectedFile,
            documentType,
            documentNumber: documentNumber || undefined,
            expiryDate: expiryDate || undefined,
        });

        setSelectedFile(null);
        setDocumentNumber("");
        setExpiryDate("");
    };

    const getStatusBadge = (status: string) => {
        const config = {
            pending: { icon: Clock, variant: "secondary" as const, label: "قيد المراجعة" },
            approved: { icon: CheckCircle, variant: "default" as const, label: "معتمد" },
            rejected: { icon: XCircle, variant: "destructive" as const, label: "مرفوض" },
            expired: { icon: XCircle, variant: "outline" as const, label: "منتهي" },
        };

        const { icon: Icon, variant, label } = config[status as keyof typeof config] || config.pending;

        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {label}
            </Badge>
        );
    };

    const getDocumentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            license: "رخصة القيادة",
            national_id: "الهوية الوطنية",
            health_certificate: "شهادة صحية",
            criminal_record: "صحيفة السوابق",
            contract: "عقد العمل",
            other: "أخرى",
        };
        return labels[type] || type;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>مستندات السائق</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <div className="border border-border/50 bg-muted/20 rounded-xl p-5 space-y-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-foreground">رفع مستند جديد</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground mr-1">نوع المستند</Label>
                                    <Select value={documentType} onValueChange={setDocumentType}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="license">رخصة القيادة</SelectItem>
                                            <SelectItem value="national_id">الهوية الوطنية</SelectItem>
                                            <SelectItem value="health_certificate">شهادة صحية</SelectItem>
                                            <SelectItem value="criminal_record">صحيفة السوابق</SelectItem>
                                            <SelectItem value="contract">عقد العمل</SelectItem>
                                            <SelectItem value="other">أخرى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground mr-1">تاريخ الانتهاء (اختياري)</Label>
                                    <Input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground mr-1">رقم الوثيقة (اختياري)</Label>
                                    <Input
                                        placeholder="مثلاً: رقم الرخصة"
                                        value={documentNumber}
                                        onChange={(e) => setDocumentNumber(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground mr-1">الملف</Label>
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="bg-background cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 hover:file:bg-primary/20 transition-all"
                                />
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploadDocument.isPending}
                                className="w-full gradient-primary shadow-lg shadow-primary/20 border-0 h-10"
                            >
                                {uploadDocument.isPending ? (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 ml-2" />
                                )}
                                رفع المستند الآن
                            </Button>
                        </div>

                        {/* Documents List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-foreground">المستندات المرفوعة</h3>
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                    {documents?.length || 0} ملفات
                                </Badge>
                            </div>

                            {documents && documents.length > 0 ? (
                                <div className="grid gap-3">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.document_id}
                                            className="group border border-border/50 bg-card hover:border-primary/30 hover:shadow-md rounded-xl p-4 flex items-center justify-between transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{getDocumentTypeLabel(doc.document_type)}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span>{doc.document_name || "مستند"}</span>
                                                        {doc.document_number && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                                <span className="font-medium text-foreground/70">رقم: {doc.document_number}</span>
                                                            </>
                                                        )}
                                                        {doc.expiry_date && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                                <span>ينتهي: {new Date(doc.expiry_date).toLocaleDateString("ar-SA")}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(doc.verification_status)}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => window.open(doc.document_url, "_blank")}
                                                >
                                                    عرض
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>لا توجد مستندات مرفوعة لهذا السائق</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
};
