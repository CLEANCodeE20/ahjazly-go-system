/**
 * سياق التقارير - لتوفير إعدادات التقارير بشكل مركزي
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ReportConfig, DEFAULT_REPORT_CONFIG } from '../types/report';

interface ReportContextType {
    config: ReportConfig;
    updateConfig: (newConfig: Partial<ReportConfig>) => void;
    resetConfig: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

interface ReportProviderProps {
    children: ReactNode;
    initialConfig?: Partial<ReportConfig>;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({
    children,
    initialConfig = {},
}) => {
    const [config, setConfig] = useState<ReportConfig>({
        ...DEFAULT_REPORT_CONFIG,
        ...initialConfig,
        companyInfo: {
            ...DEFAULT_REPORT_CONFIG.companyInfo,
            ...initialConfig.companyInfo,
        },
        reportInfo: {
            ...DEFAULT_REPORT_CONFIG.reportInfo,
            ...initialConfig.reportInfo,
        },
        design: {
            ...DEFAULT_REPORT_CONFIG.design,
            ...initialConfig.design,
        },
        printOptions: {
            ...DEFAULT_REPORT_CONFIG.printOptions,
            ...initialConfig.printOptions,
        },
        exportOptions: {
            ...DEFAULT_REPORT_CONFIG.exportOptions,
            ...initialConfig.exportOptions,
        },
        permissions: {
            ...DEFAULT_REPORT_CONFIG.permissions,
            ...initialConfig.permissions,
        },
    });

    const updateConfig = (newConfig: Partial<ReportConfig>) => {
        setConfig(prev => ({
            ...prev,
            ...newConfig,
            companyInfo: {
                ...prev.companyInfo,
                ...newConfig.companyInfo,
            },
            reportInfo: {
                ...prev.reportInfo,
                ...newConfig.reportInfo,
            },
            design: {
                ...prev.design,
                ...newConfig.design,
            },
            printOptions: {
                ...prev.printOptions,
                ...newConfig.printOptions,
            },
            exportOptions: {
                ...prev.exportOptions,
                ...newConfig.exportOptions,
            },
            permissions: {
                ...prev.permissions,
                ...newConfig.permissions,
            },
        }));
    };

    const resetConfig = () => {
        setConfig(DEFAULT_REPORT_CONFIG);
    };

    return (
        <ReportContext.Provider value={{ config, updateConfig, resetConfig }}>
            {children}
        </ReportContext.Provider>
    );
};

export const useReportConfig = (): ReportContextType => {
    const context = useContext(ReportContext);
    if (context === undefined) {
        throw new Error('useReportConfig must be used within a ReportProvider');
    }
    return context;
};