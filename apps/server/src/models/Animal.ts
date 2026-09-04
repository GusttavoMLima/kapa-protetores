import type {
  Animal as IAnimal,
  Especie,
  Sexo,
  Porte,
  CondicaoChegada,
  TriState,
  StatusAnimal,
} from '@kapa/shared';

export class Animal implements IAnimal {
  public readonly id: string;
  public nome: string;
  public especie: Especie;
  public sexo: Sexo;
  public porte: Porte;
  public idadeAproximada: string;
  public corPelagem: string;
  public dataResgate: string;
  public localResgate: string;
  public condicaoChegada: CondicaoChegada;
  public castrado: TriState;
  public vacinado: TriState;
  public vermifugado: TriState;
  public temperamento: string;
  public observacoes: string;
  public fotoUri?: string;
  public status: StatusAnimal;
  public readonly createdAt: string;

  constructor(data: Omit<IAnimal, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    this.id = data.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.nome = data.nome;
    this.especie = data.especie;
    this.sexo = data.sexo;
    this.porte = data.porte;
    this.idadeAproximada = data.idadeAproximada;
    this.corPelagem = data.corPelagem;
    this.dataResgate = data.dataResgate;
    this.localResgate = data.localResgate;
    this.condicaoChegada = data.condicaoChegada;
    this.castrado = data.castrado;
    this.vacinado = data.vacinado;
    this.vermifugado = data.vermifugado;
    this.temperamento = data.temperamento;
    this.observacoes = data.observacoes;
    this.fotoUri = data.fotoUri;
    this.status = data.status || 'resgatado';
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}
