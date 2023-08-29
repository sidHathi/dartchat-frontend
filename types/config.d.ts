declare module 'react-native-config' {
    export interface NativeConfig {
        REACT_APP_API_URL?: string;
    }
    
    export const Config: NativeConfig
    export default Config
  }