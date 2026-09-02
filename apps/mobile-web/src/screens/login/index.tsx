import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginScreenStyles as styles } from './styles';
import Logo from '@/../assets/Logo 2.svg';
import { LoginForm } from '@/components/forms/login';

export function LoginScreen() {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo width={184} height={75} />
            <Text style={styles.headerTitle}>Bem-vindo de volta</Text>
            <Text style={styles.headerText}>
              Entre para acompanhar suas adoções e favoritos.
            </Text>
          </View>

          <View>
            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
