/**
 * مكون إنشاء التقارير المخصص
 * يتيح للمستخدم إنشاء تقارير مخصصة حسب احتياجاته
 */
import React, { useState, useEffect } from 'react';
import { ReportConfig, DEFAULT_REPORT_CONFIG } from '../../types/report';
import { BaseReportTemplate } from './BaseReportTemplate';

interface ReportField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    label: string;
    visible: boolean;
    order: number;
}

interface ReportFilter {
    fieldId: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
    value: any;
}

interface ReportBuilderProps {
    initialConfig?: Partial<ReportConfig>;
    onSave?: (config: ReportConfig, fields: ReportField[], filters: ReportFilter[]) => void;
    onLoad?: (id: string) => void;
    reportTypes?: Array<{ id: string; name: string; description: string }>;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
    initialConfig = {},
    onSave,
    onLoad,
    reportTypes = []
}) => {
    const [reportTitle, setReportTitle] = useState<string>('تقرير مخصص جديد');
    const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
    const [selectedFields, setSelectedFields] = useState<ReportField[]>([]);
    const [filters, setFilters] = useState<ReportFilter[]>([]);
    const [currentFilter, setCurrentFilter] = useState<Omit<ReportFilter, 'fieldId'> & { fieldId?: string }>({
        operator: 'equals',
        value: ''
    });
    const [newFieldName, setNewFieldName] = useState<string>('');
    const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'boolean' | 'select'>('text');
    const [reportType, setReportType] = useState<string>('');
    const [savedReports, setSavedReports] = useState<Array<{ id: string; name: string }>>([]);
    const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

    // تهيئة الحقول الافتراضية
    useEffect(() => {
        const defaultFields: ReportField[] = [
            { id: 'id', name: 'id', type: 'number', label: 'الرقم', visible: false, order: 0 },
            { id: 'name', name: 'name', type: 'text', label: 'الاسم', visible: true, order: 1 },
            { id: 'date', name: 'date', type: 'date', label: 'التاريخ', visible: true, order: 2 },
            { id: 'amount', name: 'amount', type: 'number', label: 'المبلغ', visible: true, order: 3 },
            { id: 'status', name: 'status', type: 'text', label: 'الحالة', visible: true, order: 4 },
        ];
        setAvailableFields(defaultFields);
        setSelectedFields(defaultFields.filter(field => field.visible));
    }, []);

    // تبديل رؤية الحقل
    const toggleFieldVisibility = (fieldId: string) => {
        setAvailableFields(prev => prev.map(field => 
            field.id === fieldId ? { ...field, visible: !field.visible } : field
        ));
        
        setSelectedFields(prev => {
            const fieldExists = prev.some(f => f.id === fieldId);
            if (fieldExists) {
                return prev.filter(f => f.id !== fieldId);
            } else {
                const fieldToAdd = availableFields.find(f => f.id === fieldId);
                return fieldToAdd ? [...prev, { ...fieldToAdd }] : prev;
            }
        });
    };

    // ترتيب الحقول
    const reorderField = (fieldId: string, direction: 'up' | 'down') => {
        setSelectedFields(prev => {
            const fieldIndex = prev.findIndex(f => f.id === fieldId);
            if (fieldIndex === -1) return prev;

            const newOrder = [...prev];
            if (direction === 'up' && fieldIndex > 0) {
                [newOrder[fieldIndex - 1], newOrder[fieldIndex]] = 
                [newOrder[fieldIndex], newOrder[fieldIndex - 1]];
            } else if (direction === 'down' && fieldIndex < newOrder.length - 1) {
                [newOrder[fieldIndex], newOrder[fieldIndex + 1]] = 
                [newOrder[fieldIndex + 1], newOrder[fieldIndex]];
            }

            // تحديث الترتيب
            return newOrder.map((field, index) => ({ ...field, order: index + 1 }));
        });
    };

    // إضافة تصفية
    const addFilter = () => {
        if (!currentFilter.fieldId) return;

        const newFilter: ReportFilter = {
            fieldId: currentFilter.fieldId,
            operator: currentFilter.operator,
            value: currentFilter.value
        };

        setFilters([...filters, newFilter]);
        setCurrentFilter({ operator: 'equals', value: '' });
    };

    // حذف تصفية
    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    // إضافة حقل جديد
    const addCustomField = () => {
        if (!newFieldName.trim()) return;

        const newField: ReportField = {
            id: newFieldName.toLowerCase().replace(/\s+/g, '_'),
            name: newFieldName,
            type: newFieldType,
            label: newFieldName,
            visible: true,
            order: selectedFields.length + 1
        };

        setAvailableFields([...availableFields, newField]);
        setSelectedFields([...selectedFields, newField]);
        setNewFieldName('');
    };

    // حفظ التقرير
    const handleSaveReport = () => {
        if (!onSave) return;

        const config: ReportConfig = {
            ...DEFAULT_REPORT_CONFIG,
            ...initialConfig,
            reportInfo: {
                ...DEFAULT_REPORT_CONFIG.reportInfo,
                ...initialConfig.reportInfo,
                title: reportTitle
            }
        };

        onSave(config, selectedFields, filters);
    };

    // تحميل تقرير محفوظ
    const handleLoadReport = (id: string) => {
        if (onLoad) {
            onLoad(id);
        }
    };

    return (
        <div className="report-builder">
            <div className="builder-header">
                <h2>منشئ التقارير المخصص</h2>
                <div className="header-actions">
                    <select 
                        value={reportType} 
                        onChange={(e) => setReportType(e.target.value)}
                        className="report-type-select"
                    >
                        <option value="">نوع التقرير</option>
                        {reportTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={handleSaveReport}>
                        حفظ التقرير
                    </button>
                </div>
            </div>

            <div className="builder-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
                    onClick={() => setActiveTab('builder')}
                >
                    إنشاء
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                >
                    معاينة
                </button>
            </div>

            {activeTab === 'builder' && (
                <div className="builder-content">
                    <div className="builder-section">
                        <h3>إعدادات التقرير</h3>
                        <div className="form-group">
                            <label>اسم التقرير:</label>
                            <input
                                type="text"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="builder-section">
                        <h3>الحقول المتاحة</h3>
                        <div className="fields-list">
                            {availableFields.map(field => (
                                <div key={field.id} className="field-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={field.visible}
                                            onChange={() => toggleFieldVisibility(field.id)}
                                        />
                                        {field.label} ({field.type})
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="add-field-form">
                            <h4>إضافة حقل مخصص</h4>
                            <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="اسم الحقل"
                                className="form-control"
                            />
                            <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as any)}
                                className="form-control"
                            >
                                <option value="text">نص</option>
                                <option value="number">رقم</option>
                                <option value="date">تاريخ</option>
                                <option value="boolean">قيمة منطقية</option>
                                <option value="select">قائمة اختيار</option>
                            </select>
                            <button className="btn btn-secondary" onClick={addCustomField}>
                                إضافة
                            </button>
                        </div>
                    </div>

                    <div className="builder-section">
                        <h3>الحقول المحددة</h3>
                        <div className="selected-fields">
                            {selectedFields.map((field, index) => (
                                <div key={field.id} className="selected-field">
                                    <span>{field.label} ({field.type})</span>
                                    <div className="field-actions">
                                        <button 
                                            className="btn btn-sm btn-outline"
                                            onClick={() => reorderField(field.id, 'up')}
                                            disabled={index === 0}
                                        >
                                            ↑
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline"
                                            onClick={() => reorderField(field.id, 'down')}
                                            disabled={index === selectedFields.length - 1}
                                        >
                                            ↓
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => toggleFieldVisibility(field.id)}
                                        >
                                            إزالة
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="builder-section">
                        <h3>التصفيات</h3>
                        <div className="filter-controls">
                            <select
                                value={currentFilter.fieldId || ''}
                                onChange={(e) => setCurrentFilter({...currentFilter, fieldId: e.target.value})}
                                className="form-control"
                            >
                                <option value="">اختر الحقل</option>
                                {availableFields.map(field => (
                                    <option key={field.id} value={field.id}>{field.label}</option>
                                ))}
                            </select>

                            <select
                                value={currentFilter.operator}
                                onChange={(e) => setCurrentFilter({...currentFilter, operator: e.target.value as any})}
                                className="form-control"
                            >
                                <option value="equals">يساوي</option>
                                <option value="contains">يحتوي على</option>
                                <option value="greater_than">أكبر من</option>
                                <option value="less_than">أصغر من</option>
                                <option value="between">بين</option>
                                <option value="in">في القائمة</option>
                            </select>

                            <input
                                type="text"
                                value={currentFilter.value}
                                onChange={(e) => setCurrentFilter({...currentFilter, value: e.target.value})}
                                placeholder="القيمة"
                                className="form-control"
                            />

                            <button className="btn btn-primary" onClick={addFilter}>
                                إضافة تصفية
                            </button>
                        </div>

                        <div className="applied-filters">
                            {filters.map((filter, index) => {
                                const field = availableFields.find(f => f.id === filter.fieldId);
                                return (
                                    <div key={index} className="filter-item">
                                        <span>{field?.label} {filter.operator} {filter.value}</span>
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => removeFilter(index)}
                                        >
                                            حذف
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'preview' && (
                <div className="preview-content">
                    <BaseReportTemplate 
                        title={reportTitle}
                        includeQRCode={false}
                        showPrintButton={true}
                        showExportButtons={true}
                    >
                        <div className="report-preview">
                            <h3>معاينة التقرير</h3>
                            <p>هذا تقرير تجريبي يظهر كيف سيبدو التقرير بعد إنشائه.</p>
                            
                            {selectedFields.length > 0 && (
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            {selectedFields.map(field => (
                                                <th key={field.id}>{field.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {selectedFields.map(field => (
                                                <td key={field.id}>
                                                    {field.type === 'date' ? '2023-01-01' : 
                                                     field.type === 'number' ? '0' : 
                                                     field.label}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            {selectedFields.map(field => (
                                                <td key={field.id}>
                                                    {field.type === 'date' ? '2023-01-02' : 
                                                     field.type === 'number' ? '100' : 
                                                     `مثال ${field.label}`}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                            
                            {filters.length > 0 && (
                                <div className="preview-filters">
                                    <h4>التصفيات المطبقة:</h4>
                                    <ul>
                                        {filters.map((filter, index) => {
                                            const field = availableFields.find(f => f.id === filter.fieldId);
                                            return (
                                                <li key={index}>
                                                    {field?.label} {filter.operator} "{filter.value}"
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </BaseReportTemplate>
                </div>
            )}
        </div>
    );
};