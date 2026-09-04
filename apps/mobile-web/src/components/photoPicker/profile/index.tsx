import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { palette } from '@/theme/colors';

type Props = {
  uri?: string;
  onChange: (uri: string) => void;
  erro?: string;
};

export function FotoPicker({ uri, onChange, erro }: Props) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string>();

  async function escolher(from: 'camera' | 'gallery') {
    setAberto(false);
    setAviso(undefined);

    try {
      if (Platform.OS !== 'web') {
        const permission =
          from === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setAviso(
            'Libere o acesso à câmera ou à galeria para adicionar a foto.',
          );
          return;
        }
      }

      const opcoes: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: Platform.OS !== 'web',
        aspect: [1, 1],
      };

      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync(opcoes)
          : await ImagePicker.launchImageLibraryAsync(opcoes);

      if (!result.canceled && result.assets[0]?.uri) {
        onChange(result.assets[0].uri);
      }
    } catch {
      setAviso('Não deu para abrir a foto. Tente de novo pela galeria.');
    }
  }

  const mensagem = aviso ?? erro;

  return (
    <View style={styles.block}>
      <Pressable onPress={() => setAberto(true)} style={styles.wrap}>
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.photo, mensagem && styles.photoErro]}
          />
        ) : (
          <View
            style={[styles.placeholder, mensagem && styles.placeholderErro]}
          >
            <Text style={styles.plus}>+</Text>
            <Text style={styles.caption}>Adicionar foto</Text>
          </View>
        )}
      </Pressable>
      {mensagem ? <Text style={styles.erroTexto}>{mensagem}</Text> : null}

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAberto(false)}
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Foto do animal</Text>
            <Text style={styles.sheetSub}>Escolha de onde vem a imagem.</Text>
            <Pressable
              style={styles.sheetBtn}
              onPress={() => void escolher('gallery')}
            >
              <Text style={styles.sheetBtnText}>Galeria</Text>
            </Pressable>
            <Pressable
              style={styles.sheetBtn}
              onPress={() => void escolher('camera')}
            >
              <Text style={styles.sheetBtnText}>Câmera</Text>
            </Pressable>
            <Pressable
              style={styles.sheetCancel}
              onPress={() => setAberto(false)}
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    gap: 8,
  },
  wrap: {
    alignSelf: 'center',
  },
  photo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: palette.orange,
  },
  photoErro: {
    borderColor: palette.danger,
  },
  placeholder: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.orange,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderErro: {
    borderColor: palette.danger,
  },
  plus: {
    color: palette.orange,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
  },
  caption: {
    color: palette.orangeDark,
    fontSize: 12,
    fontWeight: '700',
  },
  erroTexto: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  sheetTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    color: palette.inkMuted,
    fontSize: 14,
    marginBottom: 6,
  },
  sheetBtn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetBtnText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  sheetCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: palette.inkMuted,
    fontSize: 15,
    fontWeight: '700',
  },
});
