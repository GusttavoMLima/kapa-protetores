export interface EmailTemplatePayload {
  id: string;
  variables?: Record<string, string | number>;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  template?: EmailTemplatePayload;
}

export interface EmailResponse {
  id?: string;
  success: boolean;
  message?: string;
  error?: string;
}

export type AdoptionNotificationStatus =
  | 'approved'
  | 'rejected'
  | 'interviewing';

export interface AdoptionStatusEmailData {
  adopterEmail: string;
  adopterName: string;
  animalName: string;
  animalImage?: string;
  status: AdoptionNotificationStatus;
  templateId?: string;
}

export type VolunteerNotificationStatus = 'approved' | 'rejected';

export interface VolunteerApplicationEmailData {
  volunteerEmail: string;
  volunteerName: string;
  status: VolunteerNotificationStatus;
  templateId?: string;
}
