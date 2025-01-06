declare module "ceramic-cacao" {
  export declare type Cacao = {
    h: Header;
    p: Payload;
    s?: Signature;
  };

  export declare namespace Cacao {
    function fromBlockBytes(bytes: Uint8Array): Promise<Cacao>;
  }
}

declare module "multiformats/cid" {
  export class CID {
    static decode(bytes: Uint8Array): CID;
    toString(): string;
  }
}

declare module "multiformats/block" {
  export class CID {
    static decode(bytes: Uint8Array): CID;
    toString(): string;
  }

  export class Block {
    cid: CID;
  }

  export function encode<T, Code extends number, Algorithm_1 extends number>({
    value,
    codec,
    hasher,
  }: {
    value: T;
    codec: import("./codecs/interface").BlockEncoder<Code, T>;
    hasher: import("./hashes/interface").MultihashHasher<number>;
  }): Promise<Block<T>>;
}

declare module "multiformats/hashes/sha2";
declare module "@ipld/dag-cbor";
