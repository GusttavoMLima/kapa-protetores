type PixRecipient = {
  keyValue: string;
  recipientName: string;
  city: string;
};

function field(id: string, value: string) {
  return id + String(value.length).padStart(2, '0') + value;
}

function merchantText(value: string, maxLength: number) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 -]/g, '')
    .slice(0, maxLength)
    .trim();
}

function crc16(payload: string) {
  // CRC-16/CCITT-FALSE, incluindo o ID e o tamanho do campo de CRC.
  let crc = 0xffff;
  for (const char of payload) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createPixBrCode(recipient: PixRecipient, amount: number | null) {
  const payload = [
    field('00', '01'),
    field('26', field('00', 'br.gov.bcb.pix') + field('01', recipient.keyValue)),
    field('52', '0000'),
    field('53', '986'),
    amount === null ? '' : field('54', amount.toFixed(2)),
    field('58', 'BR'),
    field('59', merchantText(recipient.recipientName, 25)),
    field('60', merchantText(recipient.city, 15)),
    field('62', field('05', '***')),
    '6304',
  ].join('');

  return payload + crc16(payload);
}
