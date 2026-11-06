import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeftIcon,
  BuildingsIcon,
  CheckIcon,
  HeartIcon,
  HouseLineIcon,
  NewspaperClippingIcon,
  PawPrintIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import {
  canManageAnimals,
  type Animal,
  type AnimalPost,
  type TriageStatus,
} from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PhotoCarousel } from '@/components/carousels/photo';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useAdopterProfileMe } from '@/hooks/useAdopterProfile';
import { useAnimalPosts, useCreateAnimalPost } from '@/hooks/useAnimalPosts';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';
import {
  calculatePetCompatibility,
  getCompatibilityTone,
} from '@/utils/petCompatibility';

const DEFAULT_PET_PHOTO =
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

const SCALE_SEGMENTS = [1, 2, 3, 4, 5] as const;

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

function energyLabel(level: number): string {
  if (level <= 1) return 'Muito calmo';
  if (level === 2) return 'Calmo';
  if (level === 3) return 'Moderado';
  if (level === 4) return 'Ativo';
  return 'Muito enérgico';
}

function kidFriendlyLabel(level: number): string {
  if (level <= 1) return 'Baixa tolerância';
  if (level === 2) return 'Reservado';
  if (level === 3) return 'Moderada';
  if (level === 4) return 'Boa convivência';
  return 'Excelente com crianças';
}

function noiseLabel(level: number): string {
  if (level <= 1) return 'Muito silencioso';
  if (level === 2) return 'Silencioso';
  if (level === 3) return 'Moderado';
  if (level === 4) return 'Vocal';
  return 'Muito vocal';
}

function formatDatePtBr(isoString?: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-3 border-b border-line last:border-b-0">
      <Text className="font-body text-sm text-ink-muted">{label}</Text>
      <Text className="font-body-medium text-sm text-ink">{value}</Text>
    </View>
  );
}

function BehaviorLevelRow({
  label,
  level,
  description,
}: {
  label: string;
  level: number;
  description: string;
}) {
  const clamped = Math.max(0, Math.min(5, Math.round(level)));
  return (
    <View className="gap-1.5 py-2.5 border-b border-line last:border-b-0">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-body text-sm text-ink-muted">{label}</Text>
        <Text className="font-body-medium text-xs text-denim">
          {description} ({clamped}/5)
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        {SCALE_SEGMENTS.map((segment) => (
          <View
            key={segment}
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundColor:
                segment <= clamped ? palette.orange : palette.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function PetPhotos({ animal }: { animal: Animal }) {
  const { width } = useWindowDimensions();
  const carouselHeight = width >= 768 ? 440 : 340;
  const photos =
    animal.photos && animal.photos.length > 0
      ? animal.photos.map((photo) => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
        }))
      : [{ id: 'default', photoUrl: DEFAULT_PET_PHOTO }];

  return (
    <View className="overflow-hidden rounded-2xl border border-line bg-peach">
      <PhotoCarousel photos={photos} height={carouselHeight} dots />
    </View>
  );
}

function MissingPet() {
  return (
    <View className="flex-1 items-center justify-center bg-cream p-6 gap-4">
      <PawPrintIcon size={48} color={palette.denim} weight="duotone" />
      <Text
        accessibilityRole="header"
        className="font-heading-bold text-xl text-ink text-center"
      >
        Este pet não está disponível
      </Text>
      <Text className="font-body text-sm text-ink-muted text-center max-w-sm">
        Ele pode ter encontrado uma família ou não estar mais na lista de
        adoção.
      </Text>
      <PrimaryButton
        title="Voltar para os pets"
        fullWidth={false}
        onPress={() => router.replace('/adopet')}
      />
    </View>
  );
}

function PetTimelineCard({
  animal,
  posts,
  isLoadingPosts,
  canPublish,
}: {
  animal: Animal;
  posts: AnimalPost[];
  isLoadingPosts: boolean;
  canPublish: boolean;
}) {
  const [newPostText, setNewPostText] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const createPostMutation = useCreateAnimalPost(animal.id);

  const handlePublish = async () => {
    const trimmed = newPostText.trim();
    if (trimmed.length < 3) {
      setPostError('Escreva pelo menos 3 caracteres para publicar.');
      return;
    }
    setPostError(null);
    try {
      await createPostMutation.mutateAsync(trimmed);
      setNewPostText('');
    } catch {
      setPostError('Não foi possível publicar a atualização. Tente novamente.');
    }
  };

  return (
    <View className="bg-white rounded-2xl border border-line p-5 gap-4">
      <View className="flex-row items-center gap-2">
        <NewspaperClippingIcon size={20} color={palette.denim} weight="fill" />
        <Text className="font-heading-bold text-lg text-ink">
          Diário de {animal.name}
        </Text>
      </View>

      {canPublish ? (
        <View className="gap-2.5 bg-cream p-3.5 rounded-xl border border-line">
          <Text className="font-body-medium text-xs text-denim">
            Publicar novidade no mural do pet
          </Text>
          <TextInput
            value={newPostText}
            onChangeText={(text) => {
              setNewPostText(text);
              if (postError) setPostError(null);
            }}
            placeholder={`Compartilhe uma novidade sobre ${animal.name}...`}
            placeholderTextColor={palette.inkMuted}
            multiline
            maxLength={500}
            accessibilityLabel={`Nova atualização sobre ${animal.name}`}
            className="bg-white rounded-lg border border-line p-3 font-body text-sm text-ink min-h-[72px]"
          />
          {postError ? (
            <Text className="font-body text-xs text-danger">{postError}</Text>
          ) : null}
          <PrimaryButton
            title="Publicar atualização"
            size="sm"
            loading={createPostMutation.isPending}
            disabled={createPostMutation.isPending}
            onPress={() => void handlePublish()}
            accessibilityLabel="Publicar atualização no diário do pet"
          />
        </View>
      ) : null}

      {isLoadingPosts ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={palette.orange} />
        </View>
      ) : posts.length === 0 ? (
        <Text className="font-body text-sm text-ink-muted">
          Ainda não há atualizações publicadas no diário de {animal.name}.
        </Text>
      ) : (
        <View className="gap-3">
          {posts.map((post) => (
            <View
              key={post.id}
              className="rounded-xl bg-cream p-3.5 border border-line gap-1.5"
            >
              <Text className="font-body text-sm text-ink leading-5">
                {post.description}
              </Text>
              <Text className="font-body text-xs text-ink-muted">
                {formatDatePtBr(post.createdAt) ?? ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function AdoptPetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: animals = [], isLoading, error } = useAdoptAnimals();
  const { data: profile } = useUserProfile();
  const { data: adopterProfile } = useAdopterProfileMe();
  const { user } = useAuth();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const [sharedFeedback, setSharedFeedback] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const animal = useMemo(
    () =>
      animals.find((item) => item.id === id && item.status === 'available'),
    [animals, id],
  );

  const { data: posts = [], isLoading: isLoadingPosts } = useAnimalPosts(
    animal?.id,
  );

  const compatibilityScore = useMemo(
    () => (animal ? calculatePetCompatibility(animal, adopterProfile) : null),
    [animal, adopterProfile],
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

  const isFavorited =
    profile?.favorites.some((favorite) => favorite.animalId === animal.id) ??
    false;

  const characteristics = [
    animal.gender === 'female' ? 'Fêmea' : 'Macho',
    ageLabel(animal.age),
    sizeLabel(animal.size),
    ...(typeof animal.weightKg === 'number' && animal.weightKg > 0
      ? [`${animal.weightKg} kg`]
      : []),
    animal.breed,
  ].filter(Boolean);

  const handleSharePet = async () => {
    const shareMessage = `Conheça ${animal.name} (${animal.breed || 'SRD'}, ${ageLabel(animal.age)}) disponível para adoção responsável na Kapa Protetores!`;
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareMessage);
        setSharedFeedback(true);
        if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
        shareTimerRef.current = setTimeout(
          () => setSharedFeedback(false),
          2500,
        );
        return;
      }
      await Share.share({
        title: `Adote ${animal.name} — Kapa Protetores`,
        message: shareMessage,
      });
    } catch {
      await Clipboard.setStringAsync(shareMessage);
      setSharedFeedback(true);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setSharedFeedback(false), 2500);
    }
  };

  const compatibilityTone =
    compatibilityScore !== null
      ? getCompatibilityTone(compatibilityScore)
      : null;

  const rescuedDateFormatted = formatDatePtBr(animal.rescuedAt);
  const canPublishPost = canManageAnimals(user?.role);

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 132 }}>
        <View className="w-full max-w-content self-center px-5 md:px-10 pt-3 gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a lista de pets"
            className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/adopet')
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
                <Text
                  accessibilityRole="header"
                  className="font-heading-bold text-3xl text-ink"
                >
                  {animal.name}
                </Text>
                <Text className="font-body text-base text-ink-muted">
                  {animal.breed || 'Raça não informada'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    sharedFeedback
                      ? 'Informações do pet copiadas'
                      : `Compartilhar ${animal.name}`
                  }
                  onPress={() => void handleSharePet()}
                  className="size-11 rounded-full bg-peach items-center justify-center"
                >
                  {sharedFeedback ? (
                    <CheckIcon
                      size={20}
                      color={palette.success}
                      weight="bold"
                    />
                  ) : (
                    <ShareNetworkIcon
                      size={20}
                      color={palette.denim}
                      weight="regular"
                    />
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorited
                      ? 'Remover dos favoritos'
                      : 'Adicionar aos favoritos'
                  }
                  onPress={() => toggleFavorite(animal.id)}
                  className="size-11 rounded-full bg-peach items-center justify-center"
                >
                  <HeartIcon
                    size={22}
                    color={palette.orange}
                    weight={isFavorited ? 'fill' : 'regular'}
                  />
                </Pressable>
              </View>
            </View>

            {compatibilityScore !== null ? (
              <View
                className="self-start flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{
                  backgroundColor:
                    compatibilityTone === 'high'
                      ? '#E8F3EE'
                      : compatibilityTone === 'medium'
                        ? palette.peach
                        : '#F3EFEA',
                }}
              >
                <SparkleIcon
                  size={16}
                  weight="fill"
                  color={
                    compatibilityTone === 'high'
                      ? palette.success
                      : compatibilityTone === 'medium'
                        ? palette.orangeDark
                        : palette.inkMuted
                  }
                />
                <Text
                  className="font-body-medium text-xs"
                  style={{
                    color:
                      compatibilityTone === 'high'
                        ? palette.success
                        : compatibilityTone === 'medium'
                          ? palette.orangeDark
                          : palette.inkMuted,
                  }}
                >
                  {compatibilityScore}% compatível com seu perfil
                </Text>
              </View>
            ) : null}

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
              <Text className="font-heading-bold text-lg text-ink">
                Sobre {animal.name}
              </Text>
            </View>
            <Text className="font-body text-base leading-6 text-ink-muted">
              {animal.observations?.trim() ||
                `${animal.name} está esperando uma família cheia de carinho.`}
            </Text>
            <Text className="font-body text-sm text-ink-muted">
              Temperamento: {animal.mood}
            </Text>
            {animal.place ? (
              <Text className="font-body text-xs text-ink-muted">
                Local: {animal.place}
              </Text>
            ) : null}
            {rescuedDateFormatted ? (
              <Text className="font-body text-xs text-ink-muted">
                Acolhido em: {rescuedDateFormatted}
              </Text>
            ) : null}
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <HouseLineIcon size={20} color={palette.denim} weight="fill" />
              <Text className="font-heading-bold text-lg text-ink">
                Convivência e Perfil
              </Text>
            </View>

            <BehaviorLevelRow
              label="Nível de energia"
              level={animal.energyLevel}
              description={energyLabel(animal.energyLevel)}
            />
            <BehaviorLevelRow
              label="Convivência com crianças"
              level={animal.kidFriendly}
              description={kidFriendlyLabel(animal.kidFriendly)}
            />
            <BehaviorLevelRow
              label="Nível de ruído"
              level={animal.noiseLevel}
              description={noiseLabel(animal.noiseLevel)}
            />

            <View className="flex-row flex-wrap gap-2.5 pt-2">
              <View className="flex-row items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 border border-line">
                <BuildingsIcon size={18} color={palette.denim} />
                <Text className="font-body-medium text-xs text-ink">
                  {animal.apartmentFriendly
                    ? 'Adapta-se a apartamento'
                    : 'Prefere casa com espaço'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 border border-line">
                <PawPrintIcon size={18} color={palette.denim} />
                <Text className="font-body-medium text-xs text-ink">
                  {animal.otherPetFriendly
                    ? 'Sociável com outros pets'
                    : 'Prefere ser filho único'}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-line p-5 gap-2">
            <View className="flex-row items-center gap-2 mb-1">
              <ShieldCheckIcon size={20} color={palette.denim} weight="fill" />
              <Text className="font-heading-bold text-lg text-ink">
                Cuidados
              </Text>
            </View>
            {animal.healthCondition ? (
              <HealthItem
                label="Condição de saúde"
                value={
                  animal.healthCondition === 'healthy'
                    ? 'Saudável'
                    : animal.healthCondition === 'injured'
                      ? 'Em tratamento'
                      : 'Requer cuidados'
                }
              />
            ) : null}
            <HealthItem label="Castrado" value={triageLabel(animal.castrated)} />
            <HealthItem
              label="Vacinado"
              value={animal.vaccinated ? 'Sim' : 'Não informado'}
            />
            <HealthItem
              label="Vermifugado"
              value={triageLabel(animal.dewormed)}
            />
          </View>

          <PetTimelineCard
            animal={animal}
            posts={posts}
            isLoadingPosts={isLoadingPosts}
            canPublish={canPublishPost}
          />
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
