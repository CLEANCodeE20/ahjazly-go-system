export interface NotificationPayload {
    user_id: number;
    type: 'booking' | 'payment' | 'trip' | 'system' | 'promotion';
    message: string;
    email?: string;
    phone?: string;
    full_name?: string;
    booking_id?: number;
}

export interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: any;
    old_record: any | null;
    schema: string;
}
