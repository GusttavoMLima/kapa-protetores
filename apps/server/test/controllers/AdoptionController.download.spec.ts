import type { Request, Response } from 'express';
import { AdoptionController } from '../../src/controllers/AdoptionController';
import type { AdoptionService } from '../../src/services/AdoptionService';

describe('AdoptionController.downloadSignedContract', () => {
  it('envia o PDF como anexo, com tipo fixo e sem sniffing de conteúdo', async () => {
    const data = Buffer.from('%PDF-1.4 conteúdo');
    const service = {
      getSignedContract: jest.fn().mockResolvedValue({ fileName: 'contrato final.pdf', data }),
    } as unknown as AdoptionService;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      send: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    await new AdoptionController(service).downloadSignedContract(
      { params: { id: 'adocao-1' } } as unknown as Request,
      res,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(service.getSignedContract).toHaveBeenCalledWith('adocao-1');
    expect(headers['Content-Type']).toBe('application/pdf');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Content-Disposition']).toBe(
      "attachment; filename*=UTF-8''contrato%20final.pdf",
    );
    expect(res.send).toHaveBeenCalledWith(data);
  });

  it('encaminha o erro do serviço', async () => {
    const failure = new Error('falha');
    const service = {
      getSignedContract: jest.fn().mockRejectedValue(failure),
    } as unknown as AdoptionService;
    const next = jest.fn();

    await new AdoptionController(service).downloadSignedContract(
      { params: { id: 'adocao-1' } } as unknown as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(failure);
  });
});
