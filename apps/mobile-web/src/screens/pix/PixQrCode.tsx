import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import createQrCode from 'qrcode-generator';
import { palette } from '@/theme';

export function PixQrCode({ payload }: { payload: string }) {
  const code = createQrCode(0, 'M');
  code.addData(payload);
  code.make();

  const moduleCount = code.getModuleCount();
  const quietZone = 4;
  const viewBoxSize = moduleCount + 2 * quietZone;
  const size = viewBoxSize * 4;
  const modules: string[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (code.isDark(row, col)) {
        modules.push(`M${col + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  return (
    <View accessibilityRole="image" accessibilityLabel="QR Code Pix para doação">
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <Rect width={viewBoxSize} height={viewBoxSize} fill={palette.white} />
        <Path d={modules.join('')} fill={palette.ink} />
      </Svg>
    </View>
  );
}
