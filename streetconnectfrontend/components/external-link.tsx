import { Linking } from 'react-native';
import { TouchableOpacity } from 'react-native';

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(href)} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}
