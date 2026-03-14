declare module 'react-native-mecab' {
  export class MeCab {
    init(path: string): Promise<void>
    tokenize(text: string): Promise<string>
    dispose(): Promise<void>
  }
}
