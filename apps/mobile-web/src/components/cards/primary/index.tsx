import { cn } from '@/utils/cn';
import { Platform, View, type ViewProps } from 'react-native';

interface PrimaryCardProps extends ViewProps {
  children: React.ReactNode;
}

export const PrimaryCard = ({ children, className }: PrimaryCardProps) => {
  return (
    <View
      className={cn('rounded-md ', className)}
      style={{
        ...Platform.select({
          web: {
            boxShadow: '0px -1px 11px rgba(18, 18, 18, 0.15)',
          } as const,
          default: {
            shadowColor: '#121212',
            shadowOffset: {
              width: 0,
              height: -1,
            },
            shadowOpacity: 0.15,
            shadowRadius: 10.9,
            elevation: 4,
          },
        }),
      }}
    >
      {children}
    </View>
  );
};
