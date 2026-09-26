import { Stack } from 'expo-router';
import { AnimalAccess } from '@/screens/animalManagement/components';

export default function AnimalManagementLayout() {
  return <AnimalAccess><Stack screenOptions={{ headerShown: false }} /></AnimalAccess>;
}
