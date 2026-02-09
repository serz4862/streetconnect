export const colors = {
  primary: '#A8D5E2',
  primaryDark: '#7AB8C9',
  primaryLight: '#D4EBEF',
  secondary: '#F9A826',
  secondaryDark: '#E09515',
  secondaryLight: '#FBD18D',
  
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  
  text: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  textOnPrimary: '#FFFFFF',
  
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Status colors
  statusHealthy: '#4CAF50',
  statusSick: '#FF9800',
  statusInjured: '#F44336',
  statusCritical: '#D32F2F',
  
  // Gender colors
  genderMale: '#2196F3',
  genderFemale: '#E91E63',
  genderUnknown: '#9E9E9E',
  
  // Tag colors
  tagGolden: '#FDD835',
  tagBrown: '#8D6E63',
  tagBlack: '#424242',
  tagWhite: '#F5F5F5',
  tagGray: '#9E9E9E',
  tagTan: '#D7CCC8',
  
  // Role colors
  roleFeeder: '#4CAF50',
  roleRescuer: '#2196F3',
  roleVet: '#9C27B0',
  roleVolunteer: '#FF9800',
};

export type ColorName = keyof typeof colors;
