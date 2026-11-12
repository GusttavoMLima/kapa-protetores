import { z } from 'zod';
import {
  ADOPTION_TEMPLATE_IDS,
  type AdoptionNotificationStatus,
  type AdoptionStatusEmailData,
  type EmailResponse,
  type SendEmailPayload,
  type VolunteerApplicationEmailData,
  type WelcomeEmailData,
} from '@kapa/shared';
import { loadServerEnv } from '../config/env';
import { logger } from '../config/logger';
import { Email } from '../domains/Email';
import { ServiceError, ValidationError } from '../errors';

const DEFAULT_FUNCTION_NAME = 'resend-email';
const DEFAULT_TIMEOUT_MS = 10_000;

const edgeFunctionResponseSchema = z
  .object({
    id: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();

const ADOPTION_STATUS_LABELS: Record<AdoptionNotificationStatus, string> = {
  approved: 'Aprovada!',
  rejected: 'Não aprovada',
  interviewing: 'Em fase de entrevista',
};

export interface EmailServiceOptions {
  supabaseUrl?: string;
  anonKey?: string;
  functionName?: string;
  timeoutMs?: number;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '');
}

function normalizeRecipients(to: string | string[]): string | string[] {
  if (typeof to === 'string') {
    return Email.create(to).getValue();
  }

  if (!Array.isArray(to) || to.length === 0) {
    throw new ValidationError(
      'Informe ao menos um endereço de e-mail de destino válido.',
    );
  }

  return to.map((recipient) => Email.create(recipient).getValue());
}

export class EmailService {
  private supabaseUrl: string;
  private anonKey: string;
  private readonly functionName: string;
  private functionUrl: string;
  private readonly timeoutMs: number;
  private readonly hasExplicitOptions: boolean;

  constructor(options?: EmailServiceOptions) {
    this.hasExplicitOptions = Boolean(
      options &&
      (options.supabaseUrl !== undefined || options.anonKey !== undefined),
    );
    this.functionName = (
      options?.functionName ?? DEFAULT_FUNCTION_NAME
    ).replace(/^\/+/, '');
    this.supabaseUrl = normalizeBaseUrl(
      options?.supabaseUrl ?? process.env.SUPABASE_URL ?? '',
    );
    this.anonKey = (
      options?.anonKey ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANONKEY ??
      ''
    ).trim();
    this.functionUrl = this.supabaseUrl
      ? `${this.supabaseUrl}/functions/v1/${this.functionName}`
      : '';
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!this.supabaseUrl || !this.anonKey) {
      logger.warn(
        '[EmailService] SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no ambiente.',
      );
    }
  }

  private refreshEnvIfNeeded(): void {
    if (this.hasExplicitOptions || (this.functionUrl && this.anonKey)) {
      return;
    }
    loadServerEnv();
    this.supabaseUrl = normalizeBaseUrl(process.env.SUPABASE_URL ?? '');
    this.anonKey = (
      process.env.SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANONKEY ??
      ''
    ).trim();
    this.functionUrl = this.supabaseUrl
      ? `${this.supabaseUrl}/functions/v1/${this.functionName}`
      : '';
  }

  public async sendEmail(
    payload: SendEmailPayload,
    authToken?: string,
  ): Promise<EmailResponse> {
    const normalizedTo = normalizeRecipients(payload.to);
    const subject = payload.subject?.trim() ?? '';
    const html = payload.html?.trim();
    const template = payload.template;

    if (!subject) {
      throw new ValidationError("O campo 'subject' é obrigatório.");
    }

    const hasHtml = Boolean(html);
    const hasTemplate = Boolean(
      template &&
      (template.id.trim().length > 0 ||
        (template.variables && Object.keys(template.variables).length > 0)),
    );

    if (!hasHtml && !hasTemplate) {
      throw new ValidationError(
        "Informe o conteúdo 'html' ou um 'template' válido para envio do e-mail.",
      );
    }

    if (hasHtml && hasTemplate) {
      throw new ValidationError(
        "Não é permitido enviar 'html' e 'template' na mesma requisição.",
      );
    }

    this.refreshEnvIfNeeded();

    if (!this.functionUrl || !this.anonKey) {
      throw new ServiceError(
        'Serviço de e-mail não configurado (verifique SUPABASE_URL e SUPABASE_ANON_KEY no .env).',
        503,
      );
    }

    const bearerToken = authToken?.trim() || this.anonKey;

    let response: Response;
    try {
      response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.anonKey,
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
          to: normalizedTo,
          subject,
          ...(html ? { html } : {}),
          ...(template ? { template } : {}),
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      logger.error(
        { err: error, functionUrl: this.functionUrl },
        '[EmailService] Falha de comunicação com a Edge Function de e-mail',
      );
      throw new ServiceError(
        'Não foi possível conectar ao serviço de envio de e-mail.',
        502,
        error,
      );
    }

    const rawBody: unknown = await response.json().catch(() => ({}));
    const parsedBody = edgeFunctionResponseSchema.safeParse(rawBody);
    const body = parsedBody.success ? parsedBody.data : {};

    if (!response.ok) {
      const errorMessage =
        body.error ??
        body.message ??
        `Falha no envio de e-mail (status ${response.status}).`;
      logger.warn(
        { statusCode: response.status, error: errorMessage },
        '[EmailService] Edge Function rejeitou o envio de e-mail',
      );
      throw new ServiceError(errorMessage, response.status);
    }

    return {
      success: true,
      id: body.id,
      message: body.message,
    };
  }

  public async sendAdoptionStatusNotification(
    data: AdoptionStatusEmailData,
    token?: string,
  ): Promise<EmailResponse> {
    const adopterName = data.adopterName.trim();
    const animalName = data.animalName.trim();

    if (!adopterName || !animalName) {
      throw new ValidationError(
        'Nome do adotante e nome do animal são obrigatórios.',
      );
    }

    const statusLabel = ADOPTION_STATUS_LABELS[data.status] ?? 'Atualizada';

    return this.sendEmail(
      {
        to: data.adopterEmail,
        subject: `Kapa Protetores: Atualização na adoção de ${animalName}`,
        template: {
          id: data.templateId ?? ADOPTION_TEMPLATE_IDS[data.status],
          variables: {
            username: adopterName,
            pet_name: animalName,
            status: statusLabel,
            ...(data.animalImage ? { pet_image_url: data.animalImage } : {}),
          },
        },
      },
      token,
    );
  }

  public async sendVolunteerStatusNotification(
    data: VolunteerApplicationEmailData,
    token?: string,
  ): Promise<EmailResponse> {
    const volunteerName = data.volunteerName.trim();
    if (!volunteerName) {
      throw new ValidationError('Nome do voluntário é obrigatório.');
    }

    const message =
      data.status === 'approved'
        ? 'Boas-vindas à nossa equipe! Você já pode consultar as atividades e escalas no painel do voluntário.'
        : 'Agradecemos profundamente sua iniciativa. Guardaremos suas informações para futuras convocações.';

    return this.sendEmail(
      {
        to: data.volunteerEmail,
        subject: 'Kapa Protetores: Inscrição de Voluntariado',
        template: {
          id: data.templateId ?? 'volunteer-status',
          variables: {
            username: volunteerName,
            status: data.status,
            message,
          },
        },
      },
      token,
    );
  }

  public async sendWelcomeEmail(
    data: WelcomeEmailData,
    token?: string,
  ): Promise<EmailResponse> {
    const userEmail = data.userEmail?.trim() ?? '';
    const rawUsername = data.username?.trim() ?? '';

    if (!userEmail || !rawUsername) {
      throw new ValidationError('Email e nome do usuário são obrigatórios.');
    }

    if (!userEmail.includes('@')) {
      throw new ValidationError('Envie um email válido');
    }

    const safeUsername = rawUsername.split(/\s+/)[0];

    return this.sendEmail(
      {
        to: userEmail,
        subject: 'Kapa protetores: Seja bem-vindo',
        template: {
          id: 'welcome',
          variables: {
            username: safeUsername,
          },
        },
      },
      token,
    );
  }
}
