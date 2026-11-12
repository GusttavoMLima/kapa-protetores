import { EmailService, escapeHtml } from '../../src/services/EmailService';
import { ServiceError, ValidationError } from '../../src/errors';

describe('EmailService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('escapes HTML special characters to prevent injection in email bodies', () => {
    expect(escapeHtml('<script>alert("xss") & \'test\'</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;) &amp; &#39;test&#39;&lt;/script&gt;',
    );
  });

  it('normalizes trailing slashes in supabaseUrl and sends email payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email-123', message: 'Queued' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new EmailService({
      supabaseUrl: 'https://example.supabase.co///',
      anonKey: 'anon-test-key',
    });

    const result = await service.sendEmail({
      to: ['  USER@Example.com ', 'second@example.com'],
      subject: 'Bem-vindo à Kapa',
      html: '<p>Olá!</p>',
    });

    expect(result).toEqual({
      success: true,
      id: 'email-123',
      message: 'Queued',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/functions/v1/resend-email');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      apikey: 'anon-test-key',
      Authorization: 'Bearer anon-test-key',
    });
    expect(JSON.parse(options.body)).toEqual({
      to: ['user@example.com', 'second@example.com'],
      subject: 'Bem-vindo à Kapa',
      html: '<p>Olá!</p>',
    });
  });

  it('rejects invalid recipient emails, missing subject, or missing content', async () => {
    const service = new EmailService({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'anon-test-key',
    });

    await expect(
      service.sendEmail({
        to: 'not-an-email',
        subject: 'Assunto',
        html: '<p>Oi</p>',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      service.sendEmail({
        to: [],
        subject: 'Assunto',
        html: '<p>Oi</p>',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      service.sendEmail({
        to: 'valid@example.com',
        subject: '   ',
        html: '<p>Oi</p>',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      service.sendEmail({
        to: 'valid@example.com',
        subject: 'Assunto válido',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ServiceError when Supabase credentials are missing or Edge Function fails', async () => {
    const unconfigured = new EmailService({ supabaseUrl: '', anonKey: '' });
    await expect(
      unconfigured.sendEmail({
        to: 'user@example.com',
        subject: 'Teste',
        html: '<p>Teste</p>',
      }),
    ).rejects.toBeInstanceOf(ServiceError);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Resend quota exceeded' }),
    }) as unknown as typeof fetch;

    const configured = new EmailService({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });

    await expect(
      configured.sendEmail({
        to: 'user@example.com',
        subject: 'Teste',
        html: '<p>Teste</p>',
      }),
    ).rejects.toThrow('Resend quota exceeded');
  });

  it('sends adoption and volunteer status notifications with template variables', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'notif-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const service = new EmailService({
      supabaseUrl: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });

    await service.sendAdoptionStatusNotification(
      {
        adopterEmail: 'maria@example.com',
        adopterName: 'Maria <Silva>',
        animalName: 'Thor',
        animalImage: 'https://example.com/thor.jpg',
        status: 'approved',
      },
      'custom-jwt',
    );

    const [, adoptionReq] = fetchMock.mock.calls[0];
    expect(adoptionReq.headers.Authorization).toBe('Bearer custom-jwt');
    const adoptionBody = JSON.parse(adoptionReq.body);
    expect(adoptionBody.to).toBe('maria@example.com');
    expect(adoptionBody.template).toEqual({
      id: 'adoption-approved',
      variables: {
        username: 'Maria <Silva>',
        pet_name: 'Thor',
        pet_image_url: 'https://example.com/thor.jpg',
        status: 'Aprovada!',
      },
    });

    await service.sendVolunteerStatusNotification({
      volunteerEmail: 'joao@example.com',
      volunteerName: 'João',
      status: 'approved',
    });

    const [, volunteerReq] = fetchMock.mock.calls[1];
    const volunteerBody = JSON.parse(volunteerReq.body);
    expect(volunteerBody.to).toBe('joao@example.com');
    expect(volunteerBody.template.id).toBe('volunteer-status');
    expect(volunteerBody.template.variables.status).toBe('approved');
  });
});
