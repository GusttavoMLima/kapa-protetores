import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraIcon, ImagesIcon, TrashIcon, PlusIcon } from 'phosphor-react-native';
import { palette } from '@/theme';

export const DEFAULT_MAX_ANIMAL_PHOTOS = 5;

export type MultiFotoPickerProps = {
  className?: string;
  uris: string[];
  onChange: (uris: string[]) => void;
  maxPhotos?: number;
  erro?: string;
  disabled?: boolean;
  label?: string;
  modalTitle?: string;
};

export function MultiFotoPicker({
  className,
  uris,
  onChange,
  maxPhotos = DEFAULT_MAX_ANIMAL_PHOTOS,
  erro,
  disabled = false,
  label = 'Adicionar fotos',
  modalTitle = 'Fotos do animal',
}: MultiFotoPickerProps) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const remainingSlots = Math.max(0, maxPhotos - uris.length);
  const canAddMore = remainingSlots > 0 && !disabled;

  async function escolher(from: 'camera' | 'gallery') {
    setAberto(false);
    setAviso(undefined);

    if (remainingSlots <= 0) {
      setAviso(`Você pode adicionar no máximo ${maxPhotos} fotos.`);
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const permission =
          from === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setAviso(
            'Libere o acesso à câmera ou à galeria para adicionar fotos.',
          );
          return;
        }
      }

      if (from === 'camera') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: Platform.OS !== 'web',
          aspect: [1, 1],
        });

        if (!result.canceled && result.assets[0]?.uri) {
          const nextUri = result.assets[0].uri;
          if (!uris.includes(nextUri)) {
            onChange([...uris, nextUri].slice(0, maxPhotos));
          }
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedUris = result.assets
          .map((asset) => asset.uri)
          .filter((candidate): candidate is string => Boolean(candidate));

        const merged = [...uris];
        for (const candidate of selectedUris) {
          if (!merged.includes(candidate) && merged.length < maxPhotos) {
            merged.push(candidate);
          }
        }
        onChange(merged);
      }
    } catch {
      setAviso('Não deu para abrir as fotos. Tente de novo pela galeria.');
    }
  }

  function removerFoto(indexToRemove: number) {
    if (disabled) return;
    setAviso(undefined);
    onChange(uris.filter((_, index) => index !== indexToRemove));
  }

  const mensagem = aviso ?? erro;

  return (
    <View className={`gap-3 rounded-2xl border border-line bg-card p-4 shadow-card ${className ?? ''}`}>
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="font-heading-medium text-xl leading-7 text-orange-dark">
            Fotos do animal
          </Text>
          <Text className="font-body text-xs text-ink-muted">
            Adicione até {maxPhotos} fotos ({uris.length}/{maxPhotos} selecionadas)
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
      >
        {uris.map((uri, index) => (
          <View
            key={`${uri}-${index}`}
            className="relative w-28 h-28 rounded-2xl overflow-hidden border border-line bg-cream"
          >
            <Image
              source={{ uri }}
              accessibilityLabel={`Foto ${index + 1} selecionada`}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {index === 0 ? (
              <View className="absolute bottom-1.5 left-1.5 bg-denim/90 px-2 py-0.5 rounded-full">
                <Text className="font-body-medium text-[10px] text-white">
                  Capa
                </Text>
              </View>
            ) : null}
            {!disabled ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover foto ${index + 1}`}
                hitSlop={8}
                onPress={() => removerFoto(index)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/65 items-center justify-center active:opacity-80"
              >
                <TrashIcon size={14} color={palette.white} weight="bold" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {canAddMore ? (
          <Pressable
            onPress={() => setAberto(true)}
            accessibilityRole="button"
            accessibilityLabel={label}
            className={`w-28 h-28 rounded-2xl border-2 border-dashed bg-white items-center justify-center gap-1.5 px-2 active:opacity-85 ${
              mensagem ? 'border-danger' : 'border-orange'
            }`}
          >
            <PlusIcon size={24} color={palette.orange} weight="bold" />
            <Text className="text-center text-orange-dark text-xs leading-4 font-body-medium">
              {label}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {mensagem ? (
        <Text
          className="text-danger text-[13px] font-semibold"
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
              {modalTitle}
            </Text>
            <Text className="text-ink-muted text-sm mb-1.5">
              Escolha de onde vêm as imagens (restam {remainingSlots}{' '}
              {remainingSlots === 1 ? 'vaga' : 'vagas'}).
            </Text>
            <Pressable
              className="bg-orange rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-90"
              onPress={() => void escolher('gallery')}
              accessibilityRole="button"
              accessibilityLabel="Escolher fotos da galeria"
            >
              <ImagesIcon size={20} color={palette.white} weight="bold" />
              <Text className="text-white text-base font-extrabold">Galeria</Text>
            </Pressable>
            <Pressable
              className="bg-orange rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-90"
              onPress={() => void escolher('camera')}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto com a câmera"
            >
              <CameraIcon size={20} color={palette.white} weight="bold" />
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
