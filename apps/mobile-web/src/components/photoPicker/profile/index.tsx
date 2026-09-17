import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  className?: string;
  uri?: string;
  onChange: (uri: string) => void;
  erro?: string;
};

export function FotoPicker({ className, uri, onChange, erro }: Props) {
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
    <View className={`items-center gap-2 ${className ?? ''}`}>
      <Pressable
        onPress={() => setAberto(true)}
        className="self-center active:opacity-85"
        accessibilityRole="button"
        accessibilityLabel="Adicionar ou alterar foto do animal"
      >
        {uri ? (
          <Image
            source={{ uri }}
            className={`w-[132px] h-[132px] rounded-full border-[3px] ${
              mensagem ? 'border-danger' : 'border-orange'
            }`}
          />
        ) : (
          <View
            className={`w-[132px] h-[132px] rounded-full border-2 border-dashed bg-white items-center justify-center gap-1 ${
              mensagem ? 'border-danger' : 'border-orange'
            }`}
          >
            <Text className="text-orange text-4xl leading-10 font-light">+</Text>
            <Text className="text-orange-dark text-xs font-bold">
              Adicionar foto
            </Text>
          </View>
        )}
      </Pressable>
      {mensagem ? (
        <Text
          className="text-danger text-[13px] font-semibold text-center"
          accessibilityRole="alert"
        >
          {mensagem}
        </Text>
      ) : null}

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <View className="flex-1 bg-black/45 justify-end p-4">
          <Pressable
            className="absolute inset-0"
            onPress={() => setAberto(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar opções de foto"
          />
          <View className="bg-white rounded-[20px] p-5 gap-2.5">
            <Text className="text-ink text-lg font-extrabold">
              Foto do animal
            </Text>
            <Text className="text-ink-muted text-sm mb-1.5">
              Escolha de onde vem a imagem.
            </Text>
            <Pressable
              className="bg-orange rounded-2xl py-3.5 items-center active:opacity-90"
              onPress={() => void escolher('gallery')}
              accessibilityRole="button"
            >
              <Text className="text-white text-base font-extrabold">Galeria</Text>
            </Pressable>
            <Pressable
              className="bg-orange rounded-2xl py-3.5 items-center active:opacity-90"
              onPress={() => void escolher('camera')}
              accessibilityRole="button"
            >
              <Text className="text-white text-base font-extrabold">Câmera</Text>
            </Pressable>
            <Pressable
              className="py-3 items-center active:opacity-70"
              onPress={() => setAberto(false)}
              accessibilityRole="button"
            >
              <Text className="text-ink-muted text-[15px] font-bold">
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
