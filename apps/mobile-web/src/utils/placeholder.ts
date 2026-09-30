type Fonts =
  | 'Lato'
  | 'Lora'
  | 'Montserrat'
  | 'Noto Sans'
  | 'Open Sans'
  | 'Oswald'
  | 'Playfair Display'
  | 'Poppins'
  | 'PT Sans'
  | 'Raleway'
  | 'Roboto'
  | 'Source Sans Pro';

export const generatePlaceholder = (
  backgroundColor: string,
  textColor: string,
  width: number,
  height: number,
  text: string,
  fontFamily: Fonts = 'Lato',
) => {
  const cleanBg = backgroundColor.replace('#', '');
  const cleanText = textColor.replace('#', '');
  const cleanEncodedText = encodeURIComponent(text || 'KP');

  return `https://placehold.co/${width}x${height}/${cleanBg}/${cleanText}/png?font=${fontFamily}&text=${cleanEncodedText}`;
};
