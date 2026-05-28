export type DeepOmitProtobufInternals<T> = T extends { $typeName: string }
  ? {
      [K in keyof Omit<T, '$typeName' | '$unknown'>]: DeepOmitProtobufInternals<T[K]>;
    }
  : T extends (infer Item)[]
    ? DeepOmitProtobufInternals<Item>[]
    : T extends object
      ? { [K in keyof T]: DeepOmitProtobufInternals<T[K]> }
      : T;
