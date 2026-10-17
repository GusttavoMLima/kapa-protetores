import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeftIcon,
  HeartIcon,
  PawPrintIcon,
  ShieldCheckIcon,
} from 'phosphor-react-native';
import type { Animal, TriageStatus } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { palette } from '@/theme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

function ageLabel(age: number): string {
  if (age === 0) return 'Filhote';
  if (age === 1) return '1 ano';
  return `${age} anos`;
}

function sizeLabel(size: number): string {
  if (size <= 2) return 'Porte pequeno';
  if (size === 3) return 'Porte médio';
  return 'Porte grande';
}

function triageLabel(value: TriageStatus): string {
  if (value === 'yes') return 'Sim';
  if (value === 'no') return 'Não';
  return 'Não informado';
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-3 border-b border-line last:border-b-0">
      <Text className="font-body text-sm text-ink-muted">{label}</Text>
      <Text className="font-body-medium text-sm text-ink">{value}</Text>
    </View>
  );
}

function PetPhotos({ animal }: { animal: Animal }) {
  const { width } = useWindowDimensions();
  const photos = animal.photos?.map((photo) => photo.photoUrl) ?? [];
  const imageUrls = photos.length > 0 ? photos : [DEFAULT_PET_PHOTO];
  const imageWidth = Math.min(Math.max(width - 40, 280), 1140);

  return (
    <View className="gap-3">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        accessibilityRole="adjustable"
        accessibilityLabel={`Fotos de ${animal.name}`}
        className="rounded-2xl bg-peach"
      >
        {imageUrls.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            accessibilityLabel={`Foto ${index + 1} de ${animal.name}`}
            resizeMode="cover"
            className="h-72 md:h-96"
            style={{ width: imageWidth }}
          />
        ))}
      </ScrollView>
      {imageUrls.length > 1 ? (
        <Text className="font-body text-xs text-ink-muted text-center">
          Deslize para ver mais fotos
        </Text>
      ) : null}
    </View>
  );
}

function MissingPet() {
  return (
    <View className="flex-1 items-center justify-center bg-cream p-6 gap-4">
      <PawPrintIcon size={48} color={palette.denim} weight="duotone" />
      <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink text-center">
        Este pet não está disponível
      </Text>
      <Text className="font-body text-sm text-ink-muted text-center max-w-sm">
        Ele pode ter encontrado uma família ou não estar mais na lista de adoção.
      </Text>
      <PrimaryButton
        title="Voltar para os pets"
        fullWidth={false}
        onPress={() => router.replace('/adopet')}
      />
    </View>
  );
}

export function AdoptPetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animals = [], isLoading, error } = useAdoptAnimals();
  const { data: profile } = useUserProfile();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const animal = useMemo(
    () => animals.find((item) => item.id === id && item.status === 'available'),
    [animals, id],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream gap-3">
        <ActivityIndicator size="large" color={palette.orange} />
        <Text className="font-body text-sm text-ink-muted">
          Carregando informações do pet...
        </Text>
      </View>
    );
  }

  if (error || !animal) return <MissingPet />;

  const isFavorited = profile?.favorites.some((favorite) => favorite.animalId === animal.id) ?? false;

  const characteristics = [
    animal.gender === 'female' ? 'Fêmea' : 'Macho',
    ageLabel(animal.age),
    sizeLabel(animal.size),
    animal.breed,
  ];

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 132 }}>
        <View className="w-full max-w-content self-center px-5 md:px-10 pt-3 gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de pets"
            className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/adopet')
            }
          >
            <ArrowLeftIcon size={18} color={palette.denim} />
            <Text className="font-body-medium text-sm text-denim">
              Ver todos os pets
            </Text>
          </Pressable>

          <PetPhotos animal={animal} />

          <View className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text accessibilityRole="header" className="font-heading-bold text-3xl text-ink">
                  {animal.name}
                </Text>
                <Text className="font-body text-base text-ink-muted">
                  {animal.breed || 'Raça não informada'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                onPress={() => toggleFavorite(animal.id)}
                className="size-11 rounded-full bg-peach items-center justify-center"
              >
                <HeartIcon size={22} color={palette.orange} weight={isFavorited ? 'fill' : 'regular'} />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {characteristics.map((characteristic, index) => (
                <Text
                  key={`${characteristic}-${index}`}
                  className="rounded-full bg-peach px-3 py-2 font-body-medium text-xs text-denim"
                >
                  {characteristic}
                </Text>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-3">
            <View className="flex-row items-center gap-2">
              <PawPrintIcon size={20} color={palette.denim} weight="fill" />
              <Text className="font-heading-bold text-lg text-ink">Sobre {animal.name}</Text>
            </View>
            <Text className="font-body text-base leading-6 text-ink-muted">
              {animal.observations?.trim() ||
                `${animal.name} está esperando uma família cheia de carinho.`}
            </Text>
            <Text className="font-body text-sm text-ink-muted">
              Temperamento: {animal.mood}
            </Text>
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-2">
            <View className="flex-row items-center gap-2 mb-1">
              <ShieldCheckIcon size={20} color={palette.denim} weight="fill" />
              <Text className="font-heading-bold text-lg text-ink">Cuidados</Text>
            </View>
            <HealthItem label="Condição de saúde" value={animal.healthCondition === 'healthy' ? 'Saudável' : animal.healthCondition === 'injured' ? 'Em tratamento' : 'Requer cuidados'} />
            <HealthItem label="Castrado" value={triageLabel(animal.castrated)} />
            <HealthItem label="Vacinado" value={animal.vaccinated ? 'Sim' : 'Não informado'} />
            <HealthItem label="Vermifugado" value={triageLabel(animal.dewormed)} />
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-line px-5 pt-3 pb-6 md:pb-4">
        <View className="w-full max-w-content self-center">
          <PrimaryButton
            title={`Preencher ficha para ${animal.name}`}
            icon={<HeartIcon size={20} color={palette.white} weight="fill" />}
            onPress={() => router.push(`/adopet/${animal.id}/application`)}
          />
        </View>
      </View>
    </View>
  );
}
