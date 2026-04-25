
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Score
 * 
 */
export type Score = $Result.DefaultSelection<Prisma.$ScorePayload>
/**
 * Model Performance
 * 
 */
export type Performance = $Result.DefaultSelection<Prisma.$PerformancePayload>
/**
 * Model PracticeItem
 * 
 */
export type PracticeItem = $Result.DefaultSelection<Prisma.$PracticeItemPayload>
/**
 * Model TechniqueTag
 * 
 */
export type TechniqueTag = $Result.DefaultSelection<Prisma.$TechniqueTagPayload>
/**
 * Model PracticeItemTechnique
 * 
 */
export type PracticeItemTechnique = $Result.DefaultSelection<Prisma.$PracticeItemTechniquePayload>
/**
 * Model PracticePerformance
 * 
 */
export type PracticePerformance = $Result.DefaultSelection<Prisma.$PracticePerformancePayload>
/**
 * Model UserWeakness
 * 
 */
export type UserWeakness = $Result.DefaultSelection<Prisma.$UserWeaknessPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const JobStatus: {
  processing: 'processing',
  done: 'done',
  error: 'error',
  queued: 'queued',
  retrying: 'retrying'
};

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]


export const Role: {
  student: 'student',
  teacher: 'teacher',
  admin: 'admin'
};

export type Role = (typeof Role)[keyof typeof Role]


export const PerformanceType: {
  user: 'user',
  pro: 'pro'
};

export type PerformanceType = (typeof PerformanceType)[keyof typeof PerformanceType]


export const PerformanceStatus: {
  uploaded: 'uploaded',
  invalid: 'invalid',
  deleted: 'deleted'
};

export type PerformanceStatus = (typeof PerformanceStatus)[keyof typeof PerformanceStatus]


export const PracticeCategory: {
  scale: 'scale',
  arpeggio: 'arpeggio',
  etude: 'etude'
};

export type PracticeCategory = (typeof PracticeCategory)[keyof typeof PracticeCategory]

}

export type JobStatus = $Enums.JobStatus

export const JobStatus: typeof $Enums.JobStatus

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type PerformanceType = $Enums.PerformanceType

export const PerformanceType: typeof $Enums.PerformanceType

export type PerformanceStatus = $Enums.PerformanceStatus

export const PerformanceStatus: typeof $Enums.PerformanceStatus

export type PracticeCategory = $Enums.PracticeCategory

export const PracticeCategory: typeof $Enums.PracticeCategory

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.score`: Exposes CRUD operations for the **Score** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Scores
    * const scores = await prisma.score.findMany()
    * ```
    */
  get score(): Prisma.ScoreDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.performance`: Exposes CRUD operations for the **Performance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Performances
    * const performances = await prisma.performance.findMany()
    * ```
    */
  get performance(): Prisma.PerformanceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.practiceItem`: Exposes CRUD operations for the **PracticeItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PracticeItems
    * const practiceItems = await prisma.practiceItem.findMany()
    * ```
    */
  get practiceItem(): Prisma.PracticeItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.techniqueTag`: Exposes CRUD operations for the **TechniqueTag** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TechniqueTags
    * const techniqueTags = await prisma.techniqueTag.findMany()
    * ```
    */
  get techniqueTag(): Prisma.TechniqueTagDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.practiceItemTechnique`: Exposes CRUD operations for the **PracticeItemTechnique** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PracticeItemTechniques
    * const practiceItemTechniques = await prisma.practiceItemTechnique.findMany()
    * ```
    */
  get practiceItemTechnique(): Prisma.PracticeItemTechniqueDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.practicePerformance`: Exposes CRUD operations for the **PracticePerformance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PracticePerformances
    * const practicePerformances = await prisma.practicePerformance.findMany()
    * ```
    */
  get practicePerformance(): Prisma.PracticePerformanceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userWeakness`: Exposes CRUD operations for the **UserWeakness** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserWeaknesses
    * const userWeaknesses = await prisma.userWeakness.findMany()
    * ```
    */
  get userWeakness(): Prisma.UserWeaknessDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.1
   * Query Engine version: 55ae170b1ced7fc6ed07a15f110549408c501bb3
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Score: 'Score',
    Performance: 'Performance',
    PracticeItem: 'PracticeItem',
    TechniqueTag: 'TechniqueTag',
    PracticeItemTechnique: 'PracticeItemTechnique',
    PracticePerformance: 'PracticePerformance',
    UserWeakness: 'UserWeakness'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "score" | "performance" | "practiceItem" | "techniqueTag" | "practiceItemTechnique" | "practicePerformance" | "userWeakness"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Score: {
        payload: Prisma.$ScorePayload<ExtArgs>
        fields: Prisma.ScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          findFirst: {
            args: Prisma.ScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          findMany: {
            args: Prisma.ScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>[]
          }
          create: {
            args: Prisma.ScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          createMany: {
            args: Prisma.ScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>[]
          }
          delete: {
            args: Prisma.ScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          update: {
            args: Prisma.ScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          deleteMany: {
            args: Prisma.ScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ScoreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>[]
          }
          upsert: {
            args: Prisma.ScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ScorePayload>
          }
          aggregate: {
            args: Prisma.ScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateScore>
          }
          groupBy: {
            args: Prisma.ScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<ScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.ScoreCountArgs<ExtArgs>
            result: $Utils.Optional<ScoreCountAggregateOutputType> | number
          }
        }
      }
      Performance: {
        payload: Prisma.$PerformancePayload<ExtArgs>
        fields: Prisma.PerformanceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PerformanceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PerformanceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          findFirst: {
            args: Prisma.PerformanceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PerformanceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          findMany: {
            args: Prisma.PerformanceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>[]
          }
          create: {
            args: Prisma.PerformanceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          createMany: {
            args: Prisma.PerformanceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PerformanceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>[]
          }
          delete: {
            args: Prisma.PerformanceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          update: {
            args: Prisma.PerformanceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          deleteMany: {
            args: Prisma.PerformanceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PerformanceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PerformanceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>[]
          }
          upsert: {
            args: Prisma.PerformanceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformancePayload>
          }
          aggregate: {
            args: Prisma.PerformanceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerformance>
          }
          groupBy: {
            args: Prisma.PerformanceGroupByArgs<ExtArgs>
            result: $Utils.Optional<PerformanceGroupByOutputType>[]
          }
          count: {
            args: Prisma.PerformanceCountArgs<ExtArgs>
            result: $Utils.Optional<PerformanceCountAggregateOutputType> | number
          }
        }
      }
      PracticeItem: {
        payload: Prisma.$PracticeItemPayload<ExtArgs>
        fields: Prisma.PracticeItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PracticeItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PracticeItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          findFirst: {
            args: Prisma.PracticeItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PracticeItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          findMany: {
            args: Prisma.PracticeItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>[]
          }
          create: {
            args: Prisma.PracticeItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          createMany: {
            args: Prisma.PracticeItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PracticeItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>[]
          }
          delete: {
            args: Prisma.PracticeItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          update: {
            args: Prisma.PracticeItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          deleteMany: {
            args: Prisma.PracticeItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PracticeItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PracticeItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>[]
          }
          upsert: {
            args: Prisma.PracticeItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemPayload>
          }
          aggregate: {
            args: Prisma.PracticeItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePracticeItem>
          }
          groupBy: {
            args: Prisma.PracticeItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<PracticeItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.PracticeItemCountArgs<ExtArgs>
            result: $Utils.Optional<PracticeItemCountAggregateOutputType> | number
          }
        }
      }
      TechniqueTag: {
        payload: Prisma.$TechniqueTagPayload<ExtArgs>
        fields: Prisma.TechniqueTagFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TechniqueTagFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TechniqueTagFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          findFirst: {
            args: Prisma.TechniqueTagFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TechniqueTagFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          findMany: {
            args: Prisma.TechniqueTagFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>[]
          }
          create: {
            args: Prisma.TechniqueTagCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          createMany: {
            args: Prisma.TechniqueTagCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TechniqueTagCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>[]
          }
          delete: {
            args: Prisma.TechniqueTagDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          update: {
            args: Prisma.TechniqueTagUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          deleteMany: {
            args: Prisma.TechniqueTagDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TechniqueTagUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TechniqueTagUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>[]
          }
          upsert: {
            args: Prisma.TechniqueTagUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TechniqueTagPayload>
          }
          aggregate: {
            args: Prisma.TechniqueTagAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTechniqueTag>
          }
          groupBy: {
            args: Prisma.TechniqueTagGroupByArgs<ExtArgs>
            result: $Utils.Optional<TechniqueTagGroupByOutputType>[]
          }
          count: {
            args: Prisma.TechniqueTagCountArgs<ExtArgs>
            result: $Utils.Optional<TechniqueTagCountAggregateOutputType> | number
          }
        }
      }
      PracticeItemTechnique: {
        payload: Prisma.$PracticeItemTechniquePayload<ExtArgs>
        fields: Prisma.PracticeItemTechniqueFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PracticeItemTechniqueFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PracticeItemTechniqueFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          findFirst: {
            args: Prisma.PracticeItemTechniqueFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PracticeItemTechniqueFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          findMany: {
            args: Prisma.PracticeItemTechniqueFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>[]
          }
          create: {
            args: Prisma.PracticeItemTechniqueCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          createMany: {
            args: Prisma.PracticeItemTechniqueCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PracticeItemTechniqueCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>[]
          }
          delete: {
            args: Prisma.PracticeItemTechniqueDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          update: {
            args: Prisma.PracticeItemTechniqueUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          deleteMany: {
            args: Prisma.PracticeItemTechniqueDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PracticeItemTechniqueUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PracticeItemTechniqueUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>[]
          }
          upsert: {
            args: Prisma.PracticeItemTechniqueUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticeItemTechniquePayload>
          }
          aggregate: {
            args: Prisma.PracticeItemTechniqueAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePracticeItemTechnique>
          }
          groupBy: {
            args: Prisma.PracticeItemTechniqueGroupByArgs<ExtArgs>
            result: $Utils.Optional<PracticeItemTechniqueGroupByOutputType>[]
          }
          count: {
            args: Prisma.PracticeItemTechniqueCountArgs<ExtArgs>
            result: $Utils.Optional<PracticeItemTechniqueCountAggregateOutputType> | number
          }
        }
      }
      PracticePerformance: {
        payload: Prisma.$PracticePerformancePayload<ExtArgs>
        fields: Prisma.PracticePerformanceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PracticePerformanceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PracticePerformanceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          findFirst: {
            args: Prisma.PracticePerformanceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PracticePerformanceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          findMany: {
            args: Prisma.PracticePerformanceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>[]
          }
          create: {
            args: Prisma.PracticePerformanceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          createMany: {
            args: Prisma.PracticePerformanceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PracticePerformanceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>[]
          }
          delete: {
            args: Prisma.PracticePerformanceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          update: {
            args: Prisma.PracticePerformanceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          deleteMany: {
            args: Prisma.PracticePerformanceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PracticePerformanceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PracticePerformanceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>[]
          }
          upsert: {
            args: Prisma.PracticePerformanceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PracticePerformancePayload>
          }
          aggregate: {
            args: Prisma.PracticePerformanceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePracticePerformance>
          }
          groupBy: {
            args: Prisma.PracticePerformanceGroupByArgs<ExtArgs>
            result: $Utils.Optional<PracticePerformanceGroupByOutputType>[]
          }
          count: {
            args: Prisma.PracticePerformanceCountArgs<ExtArgs>
            result: $Utils.Optional<PracticePerformanceCountAggregateOutputType> | number
          }
        }
      }
      UserWeakness: {
        payload: Prisma.$UserWeaknessPayload<ExtArgs>
        fields: Prisma.UserWeaknessFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserWeaknessFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserWeaknessFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          findFirst: {
            args: Prisma.UserWeaknessFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserWeaknessFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          findMany: {
            args: Prisma.UserWeaknessFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>[]
          }
          create: {
            args: Prisma.UserWeaknessCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          createMany: {
            args: Prisma.UserWeaknessCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserWeaknessCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>[]
          }
          delete: {
            args: Prisma.UserWeaknessDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          update: {
            args: Prisma.UserWeaknessUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          deleteMany: {
            args: Prisma.UserWeaknessDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserWeaknessUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserWeaknessUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>[]
          }
          upsert: {
            args: Prisma.UserWeaknessUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserWeaknessPayload>
          }
          aggregate: {
            args: Prisma.UserWeaknessAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserWeakness>
          }
          groupBy: {
            args: Prisma.UserWeaknessGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserWeaknessGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserWeaknessCountArgs<ExtArgs>
            result: $Utils.Optional<UserWeaknessCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    score?: ScoreOmit
    performance?: PerformanceOmit
    practiceItem?: PracticeItemOmit
    techniqueTag?: TechniqueTagOmit
    practiceItemTechnique?: PracticeItemTechniqueOmit
    practicePerformance?: PracticePerformanceOmit
    userWeakness?: UserWeaknessOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    performances: number
    scores: number
    practiceItems: number
    practicePerformances: number
    weaknesses: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    performances?: boolean | UserCountOutputTypeCountPerformancesArgs
    scores?: boolean | UserCountOutputTypeCountScoresArgs
    practiceItems?: boolean | UserCountOutputTypeCountPracticeItemsArgs
    practicePerformances?: boolean | UserCountOutputTypeCountPracticePerformancesArgs
    weaknesses?: boolean | UserCountOutputTypeCountWeaknessesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PerformanceWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountScoresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScoreWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPracticeItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticeItemWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPracticePerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticePerformanceWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountWeaknessesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeaknessWhereInput
  }


  /**
   * Count Type ScoreCountOutputType
   */

  export type ScoreCountOutputType = {
    performances: number
  }

  export type ScoreCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    performances?: boolean | ScoreCountOutputTypeCountPerformancesArgs
  }

  // Custom InputTypes
  /**
   * ScoreCountOutputType without action
   */
  export type ScoreCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ScoreCountOutputType
     */
    select?: ScoreCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ScoreCountOutputType without action
   */
  export type ScoreCountOutputTypeCountPerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PerformanceWhereInput
  }


  /**
   * Count Type PracticeItemCountOutputType
   */

  export type PracticeItemCountOutputType = {
    techniques: number
    practicePerformances: number
  }

  export type PracticeItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    techniques?: boolean | PracticeItemCountOutputTypeCountTechniquesArgs
    practicePerformances?: boolean | PracticeItemCountOutputTypeCountPracticePerformancesArgs
  }

  // Custom InputTypes
  /**
   * PracticeItemCountOutputType without action
   */
  export type PracticeItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemCountOutputType
     */
    select?: PracticeItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PracticeItemCountOutputType without action
   */
  export type PracticeItemCountOutputTypeCountTechniquesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticeItemTechniqueWhereInput
  }

  /**
   * PracticeItemCountOutputType without action
   */
  export type PracticeItemCountOutputTypeCountPracticePerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticePerformanceWhereInput
  }


  /**
   * Count Type TechniqueTagCountOutputType
   */

  export type TechniqueTagCountOutputType = {
    practiceItems: number
    weaknesses: number
  }

  export type TechniqueTagCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    practiceItems?: boolean | TechniqueTagCountOutputTypeCountPracticeItemsArgs
    weaknesses?: boolean | TechniqueTagCountOutputTypeCountWeaknessesArgs
  }

  // Custom InputTypes
  /**
   * TechniqueTagCountOutputType without action
   */
  export type TechniqueTagCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTagCountOutputType
     */
    select?: TechniqueTagCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TechniqueTagCountOutputType without action
   */
  export type TechniqueTagCountOutputTypeCountPracticeItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticeItemTechniqueWhereInput
  }

  /**
   * TechniqueTagCountOutputType without action
   */
  export type TechniqueTagCountOutputTypeCountWeaknessesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeaknessWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    supabaseUserId: string | null
    name: string | null
    role: $Enums.Role | null
    plan: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    supabaseUserId: string | null
    name: string | null
    role: $Enums.Role | null
    plan: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    supabaseUserId: number
    name: number
    role: number
    plan: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    supabaseUserId?: true
    name?: true
    role?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    supabaseUserId?: true
    name?: true
    role?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    supabaseUserId?: true
    name?: true
    role?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    supabaseUserId: string
    name: string
    role: $Enums.Role
    plan: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supabaseUserId?: boolean
    name?: boolean
    role?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    performances?: boolean | User$performancesArgs<ExtArgs>
    scores?: boolean | User$scoresArgs<ExtArgs>
    practiceItems?: boolean | User$practiceItemsArgs<ExtArgs>
    practicePerformances?: boolean | User$practicePerformancesArgs<ExtArgs>
    weaknesses?: boolean | User$weaknessesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supabaseUserId?: boolean
    name?: boolean
    role?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supabaseUserId?: boolean
    name?: boolean
    role?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    supabaseUserId?: boolean
    name?: boolean
    role?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "supabaseUserId" | "name" | "role" | "plan" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    performances?: boolean | User$performancesArgs<ExtArgs>
    scores?: boolean | User$scoresArgs<ExtArgs>
    practiceItems?: boolean | User$practiceItemsArgs<ExtArgs>
    practicePerformances?: boolean | User$practicePerformancesArgs<ExtArgs>
    weaknesses?: boolean | User$weaknessesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      performances: Prisma.$PerformancePayload<ExtArgs>[]
      scores: Prisma.$ScorePayload<ExtArgs>[]
      practiceItems: Prisma.$PracticeItemPayload<ExtArgs>[]
      practicePerformances: Prisma.$PracticePerformancePayload<ExtArgs>[]
      weaknesses: Prisma.$UserWeaknessPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      supabaseUserId: string
      name: string
      role: $Enums.Role
      plan: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    performances<T extends User$performancesArgs<ExtArgs> = {}>(args?: Subset<T, User$performancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    scores<T extends User$scoresArgs<ExtArgs> = {}>(args?: Subset<T, User$scoresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    practiceItems<T extends User$practiceItemsArgs<ExtArgs> = {}>(args?: Subset<T, User$practiceItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    practicePerformances<T extends User$practicePerformancesArgs<ExtArgs> = {}>(args?: Subset<T, User$practicePerformancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    weaknesses<T extends User$weaknessesArgs<ExtArgs> = {}>(args?: Subset<T, User$weaknessesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly supabaseUserId: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly plan: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.performances
   */
  export type User$performancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    where?: PerformanceWhereInput
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    cursor?: PerformanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PerformanceScalarFieldEnum | PerformanceScalarFieldEnum[]
  }

  /**
   * User.scores
   */
  export type User$scoresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    where?: ScoreWhereInput
    orderBy?: ScoreOrderByWithRelationInput | ScoreOrderByWithRelationInput[]
    cursor?: ScoreWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ScoreScalarFieldEnum | ScoreScalarFieldEnum[]
  }

  /**
   * User.practiceItems
   */
  export type User$practiceItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    where?: PracticeItemWhereInput
    orderBy?: PracticeItemOrderByWithRelationInput | PracticeItemOrderByWithRelationInput[]
    cursor?: PracticeItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PracticeItemScalarFieldEnum | PracticeItemScalarFieldEnum[]
  }

  /**
   * User.practicePerformances
   */
  export type User$practicePerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    where?: PracticePerformanceWhereInput
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    cursor?: PracticePerformanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PracticePerformanceScalarFieldEnum | PracticePerformanceScalarFieldEnum[]
  }

  /**
   * User.weaknesses
   */
  export type User$weaknessesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    where?: UserWeaknessWhereInput
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    cursor?: UserWeaknessWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserWeaknessScalarFieldEnum | UserWeaknessScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Score
   */

  export type AggregateScore = {
    _count: ScoreCountAggregateOutputType | null
    _avg: ScoreAvgAggregateOutputType | null
    _sum: ScoreSumAggregateOutputType | null
    _min: ScoreMinAggregateOutputType | null
    _max: ScoreMaxAggregateOutputType | null
  }

  export type ScoreAvgAggregateOutputType = {
    retryCount: number | null
    timeNumerator: number | null
    timeDenominator: number | null
    defaultTempo: number | null
  }

  export type ScoreSumAggregateOutputType = {
    retryCount: number | null
    timeNumerator: number | null
    timeDenominator: number | null
    defaultTempo: number | null
  }

  export type ScoreMinAggregateOutputType = {
    id: string | null
    createdById: string | null
    title: string | null
    composer: string | null
    arranger: string | null
    originalXmlPath: string | null
    generatedXmlPath: string | null
    analysisStatus: $Enums.JobStatus | null
    buildStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    keyTonic: string | null
    keyMode: string | null
    timeNumerator: number | null
    timeDenominator: number | null
    defaultTempo: number | null
    isShared: boolean | null
    createdAt: Date | null
  }

  export type ScoreMaxAggregateOutputType = {
    id: string | null
    createdById: string | null
    title: string | null
    composer: string | null
    arranger: string | null
    originalXmlPath: string | null
    generatedXmlPath: string | null
    analysisStatus: $Enums.JobStatus | null
    buildStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    keyTonic: string | null
    keyMode: string | null
    timeNumerator: number | null
    timeDenominator: number | null
    defaultTempo: number | null
    isShared: boolean | null
    createdAt: Date | null
  }

  export type ScoreCountAggregateOutputType = {
    id: number
    createdById: number
    title: number
    composer: number
    arranger: number
    originalXmlPath: number
    generatedXmlPath: number
    analysisStatus: number
    buildStatus: number
    retryCount: number
    errorMessage: number
    lastAttemptedAt: number
    executionId: number
    idempotencyKey: number
    keyTonic: number
    keyMode: number
    timeNumerator: number
    timeDenominator: number
    defaultTempo: number
    isShared: number
    createdAt: number
    _all: number
  }


  export type ScoreAvgAggregateInputType = {
    retryCount?: true
    timeNumerator?: true
    timeDenominator?: true
    defaultTempo?: true
  }

  export type ScoreSumAggregateInputType = {
    retryCount?: true
    timeNumerator?: true
    timeDenominator?: true
    defaultTempo?: true
  }

  export type ScoreMinAggregateInputType = {
    id?: true
    createdById?: true
    title?: true
    composer?: true
    arranger?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    keyTonic?: true
    keyMode?: true
    timeNumerator?: true
    timeDenominator?: true
    defaultTempo?: true
    isShared?: true
    createdAt?: true
  }

  export type ScoreMaxAggregateInputType = {
    id?: true
    createdById?: true
    title?: true
    composer?: true
    arranger?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    keyTonic?: true
    keyMode?: true
    timeNumerator?: true
    timeDenominator?: true
    defaultTempo?: true
    isShared?: true
    createdAt?: true
  }

  export type ScoreCountAggregateInputType = {
    id?: true
    createdById?: true
    title?: true
    composer?: true
    arranger?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    keyTonic?: true
    keyMode?: true
    timeNumerator?: true
    timeDenominator?: true
    defaultTempo?: true
    isShared?: true
    createdAt?: true
    _all?: true
  }

  export type ScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Score to aggregate.
     */
    where?: ScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scores to fetch.
     */
    orderBy?: ScoreOrderByWithRelationInput | ScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Scores
    **/
    _count?: true | ScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ScoreMaxAggregateInputType
  }

  export type GetScoreAggregateType<T extends ScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateScore[P]>
      : GetScalarType<T[P], AggregateScore[P]>
  }




  export type ScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ScoreWhereInput
    orderBy?: ScoreOrderByWithAggregationInput | ScoreOrderByWithAggregationInput[]
    by: ScoreScalarFieldEnum[] | ScoreScalarFieldEnum
    having?: ScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ScoreCountAggregateInputType | true
    _avg?: ScoreAvgAggregateInputType
    _sum?: ScoreSumAggregateInputType
    _min?: ScoreMinAggregateInputType
    _max?: ScoreMaxAggregateInputType
  }

  export type ScoreGroupByOutputType = {
    id: string
    createdById: string
    title: string
    composer: string | null
    arranger: string | null
    originalXmlPath: string
    generatedXmlPath: string | null
    analysisStatus: $Enums.JobStatus
    buildStatus: $Enums.JobStatus
    retryCount: number
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    keyTonic: string | null
    keyMode: string | null
    timeNumerator: number | null
    timeDenominator: number | null
    defaultTempo: number | null
    isShared: boolean
    createdAt: Date
    _count: ScoreCountAggregateOutputType | null
    _avg: ScoreAvgAggregateOutputType | null
    _sum: ScoreSumAggregateOutputType | null
    _min: ScoreMinAggregateOutputType | null
    _max: ScoreMaxAggregateOutputType | null
  }

  type GetScoreGroupByPayload<T extends ScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ScoreGroupByOutputType[P]>
            : GetScalarType<T[P], ScoreGroupByOutputType[P]>
        }
      >
    >


  export type ScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdById?: boolean
    title?: boolean
    composer?: boolean
    arranger?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    timeNumerator?: boolean
    timeDenominator?: boolean
    defaultTempo?: boolean
    isShared?: boolean
    createdAt?: boolean
    performances?: boolean | Score$performancesArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | ScoreCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["score"]>

  export type ScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdById?: boolean
    title?: boolean
    composer?: boolean
    arranger?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    timeNumerator?: boolean
    timeDenominator?: boolean
    defaultTempo?: boolean
    isShared?: boolean
    createdAt?: boolean
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["score"]>

  export type ScoreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdById?: boolean
    title?: boolean
    composer?: boolean
    arranger?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    timeNumerator?: boolean
    timeDenominator?: boolean
    defaultTempo?: boolean
    isShared?: boolean
    createdAt?: boolean
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["score"]>

  export type ScoreSelectScalar = {
    id?: boolean
    createdById?: boolean
    title?: boolean
    composer?: boolean
    arranger?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    timeNumerator?: boolean
    timeDenominator?: boolean
    defaultTempo?: boolean
    isShared?: boolean
    createdAt?: boolean
  }

  export type ScoreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdById" | "title" | "composer" | "arranger" | "originalXmlPath" | "generatedXmlPath" | "analysisStatus" | "buildStatus" | "retryCount" | "errorMessage" | "lastAttemptedAt" | "executionId" | "idempotencyKey" | "keyTonic" | "keyMode" | "timeNumerator" | "timeDenominator" | "defaultTempo" | "isShared" | "createdAt", ExtArgs["result"]["score"]>
  export type ScoreInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    performances?: boolean | Score$performancesArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | ScoreCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ScoreIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ScoreIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Score"
    objects: {
      performances: Prisma.$PerformancePayload<ExtArgs>[]
      createdBy: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdById: string
      title: string
      composer: string | null
      arranger: string | null
      originalXmlPath: string
      generatedXmlPath: string | null
      analysisStatus: $Enums.JobStatus
      buildStatus: $Enums.JobStatus
      retryCount: number
      errorMessage: string | null
      lastAttemptedAt: Date | null
      executionId: string | null
      idempotencyKey: string | null
      keyTonic: string | null
      keyMode: string | null
      timeNumerator: number | null
      timeDenominator: number | null
      defaultTempo: number | null
      isShared: boolean
      createdAt: Date
    }, ExtArgs["result"]["score"]>
    composites: {}
  }

  type ScoreGetPayload<S extends boolean | null | undefined | ScoreDefaultArgs> = $Result.GetResult<Prisma.$ScorePayload, S>

  type ScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ScoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ScoreCountAggregateInputType | true
    }

  export interface ScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Score'], meta: { name: 'Score' } }
    /**
     * Find zero or one Score that matches the filter.
     * @param {ScoreFindUniqueArgs} args - Arguments to find a Score
     * @example
     * // Get one Score
     * const score = await prisma.score.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ScoreFindUniqueArgs>(args: SelectSubset<T, ScoreFindUniqueArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Score that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ScoreFindUniqueOrThrowArgs} args - Arguments to find a Score
     * @example
     * // Get one Score
     * const score = await prisma.score.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, ScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Score that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreFindFirstArgs} args - Arguments to find a Score
     * @example
     * // Get one Score
     * const score = await prisma.score.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ScoreFindFirstArgs>(args?: SelectSubset<T, ScoreFindFirstArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Score that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreFindFirstOrThrowArgs} args - Arguments to find a Score
     * @example
     * // Get one Score
     * const score = await prisma.score.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, ScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Scores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Scores
     * const scores = await prisma.score.findMany()
     * 
     * // Get first 10 Scores
     * const scores = await prisma.score.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const scoreWithIdOnly = await prisma.score.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ScoreFindManyArgs>(args?: SelectSubset<T, ScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Score.
     * @param {ScoreCreateArgs} args - Arguments to create a Score.
     * @example
     * // Create one Score
     * const Score = await prisma.score.create({
     *   data: {
     *     // ... data to create a Score
     *   }
     * })
     * 
     */
    create<T extends ScoreCreateArgs>(args: SelectSubset<T, ScoreCreateArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Scores.
     * @param {ScoreCreateManyArgs} args - Arguments to create many Scores.
     * @example
     * // Create many Scores
     * const score = await prisma.score.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ScoreCreateManyArgs>(args?: SelectSubset<T, ScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Scores and returns the data saved in the database.
     * @param {ScoreCreateManyAndReturnArgs} args - Arguments to create many Scores.
     * @example
     * // Create many Scores
     * const score = await prisma.score.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Scores and only return the `id`
     * const scoreWithIdOnly = await prisma.score.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, ScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Score.
     * @param {ScoreDeleteArgs} args - Arguments to delete one Score.
     * @example
     * // Delete one Score
     * const Score = await prisma.score.delete({
     *   where: {
     *     // ... filter to delete one Score
     *   }
     * })
     * 
     */
    delete<T extends ScoreDeleteArgs>(args: SelectSubset<T, ScoreDeleteArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Score.
     * @param {ScoreUpdateArgs} args - Arguments to update one Score.
     * @example
     * // Update one Score
     * const score = await prisma.score.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ScoreUpdateArgs>(args: SelectSubset<T, ScoreUpdateArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Scores.
     * @param {ScoreDeleteManyArgs} args - Arguments to filter Scores to delete.
     * @example
     * // Delete a few Scores
     * const { count } = await prisma.score.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ScoreDeleteManyArgs>(args?: SelectSubset<T, ScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Scores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Scores
     * const score = await prisma.score.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ScoreUpdateManyArgs>(args: SelectSubset<T, ScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Scores and returns the data updated in the database.
     * @param {ScoreUpdateManyAndReturnArgs} args - Arguments to update many Scores.
     * @example
     * // Update many Scores
     * const score = await prisma.score.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Scores and only return the `id`
     * const scoreWithIdOnly = await prisma.score.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ScoreUpdateManyAndReturnArgs>(args: SelectSubset<T, ScoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Score.
     * @param {ScoreUpsertArgs} args - Arguments to update or create a Score.
     * @example
     * // Update or create a Score
     * const score = await prisma.score.upsert({
     *   create: {
     *     // ... data to create a Score
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Score we want to update
     *   }
     * })
     */
    upsert<T extends ScoreUpsertArgs>(args: SelectSubset<T, ScoreUpsertArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Scores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreCountArgs} args - Arguments to filter Scores to count.
     * @example
     * // Count the number of Scores
     * const count = await prisma.score.count({
     *   where: {
     *     // ... the filter for the Scores we want to count
     *   }
     * })
    **/
    count<T extends ScoreCountArgs>(
      args?: Subset<T, ScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Score.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ScoreAggregateArgs>(args: Subset<T, ScoreAggregateArgs>): Prisma.PrismaPromise<GetScoreAggregateType<T>>

    /**
     * Group by Score.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ScoreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ScoreGroupByArgs['orderBy'] }
        : { orderBy?: ScoreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Score model
   */
  readonly fields: ScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Score.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    performances<T extends Score$performancesArgs<ExtArgs> = {}>(args?: Subset<T, Score$performancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    createdBy<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Score model
   */
  interface ScoreFieldRefs {
    readonly id: FieldRef<"Score", 'String'>
    readonly createdById: FieldRef<"Score", 'String'>
    readonly title: FieldRef<"Score", 'String'>
    readonly composer: FieldRef<"Score", 'String'>
    readonly arranger: FieldRef<"Score", 'String'>
    readonly originalXmlPath: FieldRef<"Score", 'String'>
    readonly generatedXmlPath: FieldRef<"Score", 'String'>
    readonly analysisStatus: FieldRef<"Score", 'JobStatus'>
    readonly buildStatus: FieldRef<"Score", 'JobStatus'>
    readonly retryCount: FieldRef<"Score", 'Int'>
    readonly errorMessage: FieldRef<"Score", 'String'>
    readonly lastAttemptedAt: FieldRef<"Score", 'DateTime'>
    readonly executionId: FieldRef<"Score", 'String'>
    readonly idempotencyKey: FieldRef<"Score", 'String'>
    readonly keyTonic: FieldRef<"Score", 'String'>
    readonly keyMode: FieldRef<"Score", 'String'>
    readonly timeNumerator: FieldRef<"Score", 'Int'>
    readonly timeDenominator: FieldRef<"Score", 'Int'>
    readonly defaultTempo: FieldRef<"Score", 'Int'>
    readonly isShared: FieldRef<"Score", 'Boolean'>
    readonly createdAt: FieldRef<"Score", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Score findUnique
   */
  export type ScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter, which Score to fetch.
     */
    where: ScoreWhereUniqueInput
  }

  /**
   * Score findUniqueOrThrow
   */
  export type ScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter, which Score to fetch.
     */
    where: ScoreWhereUniqueInput
  }

  /**
   * Score findFirst
   */
  export type ScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter, which Score to fetch.
     */
    where?: ScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scores to fetch.
     */
    orderBy?: ScoreOrderByWithRelationInput | ScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Scores.
     */
    cursor?: ScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Scores.
     */
    distinct?: ScoreScalarFieldEnum | ScoreScalarFieldEnum[]
  }

  /**
   * Score findFirstOrThrow
   */
  export type ScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter, which Score to fetch.
     */
    where?: ScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scores to fetch.
     */
    orderBy?: ScoreOrderByWithRelationInput | ScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Scores.
     */
    cursor?: ScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Scores.
     */
    distinct?: ScoreScalarFieldEnum | ScoreScalarFieldEnum[]
  }

  /**
   * Score findMany
   */
  export type ScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter, which Scores to fetch.
     */
    where?: ScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Scores to fetch.
     */
    orderBy?: ScoreOrderByWithRelationInput | ScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Scores.
     */
    cursor?: ScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Scores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Scores.
     */
    skip?: number
    distinct?: ScoreScalarFieldEnum | ScoreScalarFieldEnum[]
  }

  /**
   * Score create
   */
  export type ScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * The data needed to create a Score.
     */
    data: XOR<ScoreCreateInput, ScoreUncheckedCreateInput>
  }

  /**
   * Score createMany
   */
  export type ScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Scores.
     */
    data: ScoreCreateManyInput | ScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Score createManyAndReturn
   */
  export type ScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * The data used to create many Scores.
     */
    data: ScoreCreateManyInput | ScoreCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Score update
   */
  export type ScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * The data needed to update a Score.
     */
    data: XOR<ScoreUpdateInput, ScoreUncheckedUpdateInput>
    /**
     * Choose, which Score to update.
     */
    where: ScoreWhereUniqueInput
  }

  /**
   * Score updateMany
   */
  export type ScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Scores.
     */
    data: XOR<ScoreUpdateManyMutationInput, ScoreUncheckedUpdateManyInput>
    /**
     * Filter which Scores to update
     */
    where?: ScoreWhereInput
    /**
     * Limit how many Scores to update.
     */
    limit?: number
  }

  /**
   * Score updateManyAndReturn
   */
  export type ScoreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * The data used to update Scores.
     */
    data: XOR<ScoreUpdateManyMutationInput, ScoreUncheckedUpdateManyInput>
    /**
     * Filter which Scores to update
     */
    where?: ScoreWhereInput
    /**
     * Limit how many Scores to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Score upsert
   */
  export type ScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * The filter to search for the Score to update in case it exists.
     */
    where: ScoreWhereUniqueInput
    /**
     * In case the Score found by the `where` argument doesn't exist, create a new Score with this data.
     */
    create: XOR<ScoreCreateInput, ScoreUncheckedCreateInput>
    /**
     * In case the Score was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ScoreUpdateInput, ScoreUncheckedUpdateInput>
  }

  /**
   * Score delete
   */
  export type ScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
    /**
     * Filter which Score to delete.
     */
    where: ScoreWhereUniqueInput
  }

  /**
   * Score deleteMany
   */
  export type ScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Scores to delete
     */
    where?: ScoreWhereInput
    /**
     * Limit how many Scores to delete.
     */
    limit?: number
  }

  /**
   * Score.performances
   */
  export type Score$performancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    where?: PerformanceWhereInput
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    cursor?: PerformanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PerformanceScalarFieldEnum | PerformanceScalarFieldEnum[]
  }

  /**
   * Score without action
   */
  export type ScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Score
     */
    select?: ScoreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Score
     */
    omit?: ScoreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ScoreInclude<ExtArgs> | null
  }


  /**
   * Model Performance
   */

  export type AggregatePerformance = {
    _count: PerformanceCountAggregateOutputType | null
    _avg: PerformanceAvgAggregateOutputType | null
    _sum: PerformanceSumAggregateOutputType | null
    _min: PerformanceMinAggregateOutputType | null
    _max: PerformanceMaxAggregateOutputType | null
  }

  export type PerformanceAvgAggregateOutputType = {
    performanceDuration: number | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    retryCount: number | null
  }

  export type PerformanceSumAggregateOutputType = {
    performanceDuration: number | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    retryCount: number | null
  }

  export type PerformanceMinAggregateOutputType = {
    id: string | null
    performanceType: $Enums.PerformanceType | null
    performanceStatus: $Enums.PerformanceStatus | null
    userId: string | null
    scoreId: string | null
    audioPath: string | null
    audioFeaturesPath: string | null
    comparisonResultPath: string | null
    pseudoXmlPath: string | null
    performanceDuration: number | null
    performanceDate: Date | null
    uploadedAt: Date | null
    createdAt: Date | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
  }

  export type PerformanceMaxAggregateOutputType = {
    id: string | null
    performanceType: $Enums.PerformanceType | null
    performanceStatus: $Enums.PerformanceStatus | null
    userId: string | null
    scoreId: string | null
    audioPath: string | null
    audioFeaturesPath: string | null
    comparisonResultPath: string | null
    pseudoXmlPath: string | null
    performanceDuration: number | null
    performanceDate: Date | null
    uploadedAt: Date | null
    createdAt: Date | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
  }

  export type PerformanceCountAggregateOutputType = {
    id: number
    performanceType: number
    performanceStatus: number
    userId: number
    scoreId: number
    audioPath: number
    audioFeaturesPath: number
    comparisonResultPath: number
    pseudoXmlPath: number
    performanceDuration: number
    performanceDate: number
    uploadedAt: number
    createdAt: number
    pitchAccuracy: number
    timingAccuracy: number
    overallScore: number
    evaluatedNotes: number
    analysisSummary: number
    analysisStatus: number
    retryCount: number
    errorMessage: number
    lastAttemptedAt: number
    executionId: number
    idempotencyKey: number
    _all: number
  }


  export type PerformanceAvgAggregateInputType = {
    performanceDuration?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    retryCount?: true
  }

  export type PerformanceSumAggregateInputType = {
    performanceDuration?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    retryCount?: true
  }

  export type PerformanceMinAggregateInputType = {
    id?: true
    performanceType?: true
    performanceStatus?: true
    userId?: true
    scoreId?: true
    audioPath?: true
    audioFeaturesPath?: true
    comparisonResultPath?: true
    pseudoXmlPath?: true
    performanceDuration?: true
    performanceDate?: true
    uploadedAt?: true
    createdAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
  }

  export type PerformanceMaxAggregateInputType = {
    id?: true
    performanceType?: true
    performanceStatus?: true
    userId?: true
    scoreId?: true
    audioPath?: true
    audioFeaturesPath?: true
    comparisonResultPath?: true
    pseudoXmlPath?: true
    performanceDuration?: true
    performanceDate?: true
    uploadedAt?: true
    createdAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
  }

  export type PerformanceCountAggregateInputType = {
    id?: true
    performanceType?: true
    performanceStatus?: true
    userId?: true
    scoreId?: true
    audioPath?: true
    audioFeaturesPath?: true
    comparisonResultPath?: true
    pseudoXmlPath?: true
    performanceDuration?: true
    performanceDate?: true
    uploadedAt?: true
    createdAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisSummary?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    _all?: true
  }

  export type PerformanceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Performance to aggregate.
     */
    where?: PerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Performances to fetch.
     */
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Performances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Performances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Performances
    **/
    _count?: true | PerformanceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PerformanceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PerformanceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PerformanceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PerformanceMaxAggregateInputType
  }

  export type GetPerformanceAggregateType<T extends PerformanceAggregateArgs> = {
        [P in keyof T & keyof AggregatePerformance]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerformance[P]>
      : GetScalarType<T[P], AggregatePerformance[P]>
  }




  export type PerformanceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PerformanceWhereInput
    orderBy?: PerformanceOrderByWithAggregationInput | PerformanceOrderByWithAggregationInput[]
    by: PerformanceScalarFieldEnum[] | PerformanceScalarFieldEnum
    having?: PerformanceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PerformanceCountAggregateInputType | true
    _avg?: PerformanceAvgAggregateInputType
    _sum?: PerformanceSumAggregateInputType
    _min?: PerformanceMinAggregateInputType
    _max?: PerformanceMaxAggregateInputType
  }

  export type PerformanceGroupByOutputType = {
    id: string
    performanceType: $Enums.PerformanceType
    performanceStatus: $Enums.PerformanceStatus
    userId: string
    scoreId: string
    audioPath: string
    audioFeaturesPath: string | null
    comparisonResultPath: string | null
    pseudoXmlPath: string | null
    performanceDuration: number | null
    performanceDate: Date | null
    uploadedAt: Date
    createdAt: Date
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisSummary: JsonValue | null
    analysisStatus: $Enums.JobStatus
    retryCount: number
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    _count: PerformanceCountAggregateOutputType | null
    _avg: PerformanceAvgAggregateOutputType | null
    _sum: PerformanceSumAggregateOutputType | null
    _min: PerformanceMinAggregateOutputType | null
    _max: PerformanceMaxAggregateOutputType | null
  }

  type GetPerformanceGroupByPayload<T extends PerformanceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PerformanceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PerformanceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PerformanceGroupByOutputType[P]>
            : GetScalarType<T[P], PerformanceGroupByOutputType[P]>
        }
      >
    >


  export type PerformanceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    performanceType?: boolean
    performanceStatus?: boolean
    userId?: boolean
    scoreId?: boolean
    audioPath?: boolean
    audioFeaturesPath?: boolean
    comparisonResultPath?: boolean
    pseudoXmlPath?: boolean
    performanceDuration?: boolean
    performanceDate?: boolean
    uploadedAt?: boolean
    createdAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["performance"]>

  export type PerformanceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    performanceType?: boolean
    performanceStatus?: boolean
    userId?: boolean
    scoreId?: boolean
    audioPath?: boolean
    audioFeaturesPath?: boolean
    comparisonResultPath?: boolean
    pseudoXmlPath?: boolean
    performanceDuration?: boolean
    performanceDate?: boolean
    uploadedAt?: boolean
    createdAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["performance"]>

  export type PerformanceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    performanceType?: boolean
    performanceStatus?: boolean
    userId?: boolean
    scoreId?: boolean
    audioPath?: boolean
    audioFeaturesPath?: boolean
    comparisonResultPath?: boolean
    pseudoXmlPath?: boolean
    performanceDuration?: boolean
    performanceDate?: boolean
    uploadedAt?: boolean
    createdAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["performance"]>

  export type PerformanceSelectScalar = {
    id?: boolean
    performanceType?: boolean
    performanceStatus?: boolean
    userId?: boolean
    scoreId?: boolean
    audioPath?: boolean
    audioFeaturesPath?: boolean
    comparisonResultPath?: boolean
    pseudoXmlPath?: boolean
    performanceDuration?: boolean
    performanceDate?: boolean
    uploadedAt?: boolean
    createdAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
  }

  export type PerformanceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "performanceType" | "performanceStatus" | "userId" | "scoreId" | "audioPath" | "audioFeaturesPath" | "comparisonResultPath" | "pseudoXmlPath" | "performanceDuration" | "performanceDate" | "uploadedAt" | "createdAt" | "pitchAccuracy" | "timingAccuracy" | "overallScore" | "evaluatedNotes" | "analysisSummary" | "analysisStatus" | "retryCount" | "errorMessage" | "lastAttemptedAt" | "executionId" | "idempotencyKey", ExtArgs["result"]["performance"]>
  export type PerformanceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PerformanceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PerformanceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    score?: boolean | ScoreDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PerformancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Performance"
    objects: {
      score: Prisma.$ScorePayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      performanceType: $Enums.PerformanceType
      performanceStatus: $Enums.PerformanceStatus
      userId: string
      scoreId: string
      audioPath: string
      audioFeaturesPath: string | null
      comparisonResultPath: string | null
      pseudoXmlPath: string | null
      performanceDuration: number | null
      performanceDate: Date | null
      uploadedAt: Date
      createdAt: Date
      pitchAccuracy: number | null
      timingAccuracy: number | null
      overallScore: number | null
      evaluatedNotes: number | null
      analysisSummary: Prisma.JsonValue | null
      analysisStatus: $Enums.JobStatus
      retryCount: number
      errorMessage: string | null
      lastAttemptedAt: Date | null
      executionId: string | null
      idempotencyKey: string | null
    }, ExtArgs["result"]["performance"]>
    composites: {}
  }

  type PerformanceGetPayload<S extends boolean | null | undefined | PerformanceDefaultArgs> = $Result.GetResult<Prisma.$PerformancePayload, S>

  type PerformanceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PerformanceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PerformanceCountAggregateInputType | true
    }

  export interface PerformanceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Performance'], meta: { name: 'Performance' } }
    /**
     * Find zero or one Performance that matches the filter.
     * @param {PerformanceFindUniqueArgs} args - Arguments to find a Performance
     * @example
     * // Get one Performance
     * const performance = await prisma.performance.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PerformanceFindUniqueArgs>(args: SelectSubset<T, PerformanceFindUniqueArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Performance that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PerformanceFindUniqueOrThrowArgs} args - Arguments to find a Performance
     * @example
     * // Get one Performance
     * const performance = await prisma.performance.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PerformanceFindUniqueOrThrowArgs>(args: SelectSubset<T, PerformanceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Performance that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceFindFirstArgs} args - Arguments to find a Performance
     * @example
     * // Get one Performance
     * const performance = await prisma.performance.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PerformanceFindFirstArgs>(args?: SelectSubset<T, PerformanceFindFirstArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Performance that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceFindFirstOrThrowArgs} args - Arguments to find a Performance
     * @example
     * // Get one Performance
     * const performance = await prisma.performance.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PerformanceFindFirstOrThrowArgs>(args?: SelectSubset<T, PerformanceFindFirstOrThrowArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Performances that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Performances
     * const performances = await prisma.performance.findMany()
     * 
     * // Get first 10 Performances
     * const performances = await prisma.performance.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const performanceWithIdOnly = await prisma.performance.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PerformanceFindManyArgs>(args?: SelectSubset<T, PerformanceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Performance.
     * @param {PerformanceCreateArgs} args - Arguments to create a Performance.
     * @example
     * // Create one Performance
     * const Performance = await prisma.performance.create({
     *   data: {
     *     // ... data to create a Performance
     *   }
     * })
     * 
     */
    create<T extends PerformanceCreateArgs>(args: SelectSubset<T, PerformanceCreateArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Performances.
     * @param {PerformanceCreateManyArgs} args - Arguments to create many Performances.
     * @example
     * // Create many Performances
     * const performance = await prisma.performance.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PerformanceCreateManyArgs>(args?: SelectSubset<T, PerformanceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Performances and returns the data saved in the database.
     * @param {PerformanceCreateManyAndReturnArgs} args - Arguments to create many Performances.
     * @example
     * // Create many Performances
     * const performance = await prisma.performance.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Performances and only return the `id`
     * const performanceWithIdOnly = await prisma.performance.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PerformanceCreateManyAndReturnArgs>(args?: SelectSubset<T, PerformanceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Performance.
     * @param {PerformanceDeleteArgs} args - Arguments to delete one Performance.
     * @example
     * // Delete one Performance
     * const Performance = await prisma.performance.delete({
     *   where: {
     *     // ... filter to delete one Performance
     *   }
     * })
     * 
     */
    delete<T extends PerformanceDeleteArgs>(args: SelectSubset<T, PerformanceDeleteArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Performance.
     * @param {PerformanceUpdateArgs} args - Arguments to update one Performance.
     * @example
     * // Update one Performance
     * const performance = await prisma.performance.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PerformanceUpdateArgs>(args: SelectSubset<T, PerformanceUpdateArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Performances.
     * @param {PerformanceDeleteManyArgs} args - Arguments to filter Performances to delete.
     * @example
     * // Delete a few Performances
     * const { count } = await prisma.performance.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PerformanceDeleteManyArgs>(args?: SelectSubset<T, PerformanceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Performances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Performances
     * const performance = await prisma.performance.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PerformanceUpdateManyArgs>(args: SelectSubset<T, PerformanceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Performances and returns the data updated in the database.
     * @param {PerformanceUpdateManyAndReturnArgs} args - Arguments to update many Performances.
     * @example
     * // Update many Performances
     * const performance = await prisma.performance.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Performances and only return the `id`
     * const performanceWithIdOnly = await prisma.performance.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PerformanceUpdateManyAndReturnArgs>(args: SelectSubset<T, PerformanceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Performance.
     * @param {PerformanceUpsertArgs} args - Arguments to update or create a Performance.
     * @example
     * // Update or create a Performance
     * const performance = await prisma.performance.upsert({
     *   create: {
     *     // ... data to create a Performance
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Performance we want to update
     *   }
     * })
     */
    upsert<T extends PerformanceUpsertArgs>(args: SelectSubset<T, PerformanceUpsertArgs<ExtArgs>>): Prisma__PerformanceClient<$Result.GetResult<Prisma.$PerformancePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Performances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceCountArgs} args - Arguments to filter Performances to count.
     * @example
     * // Count the number of Performances
     * const count = await prisma.performance.count({
     *   where: {
     *     // ... the filter for the Performances we want to count
     *   }
     * })
    **/
    count<T extends PerformanceCountArgs>(
      args?: Subset<T, PerformanceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PerformanceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Performance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PerformanceAggregateArgs>(args: Subset<T, PerformanceAggregateArgs>): Prisma.PrismaPromise<GetPerformanceAggregateType<T>>

    /**
     * Group by Performance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PerformanceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PerformanceGroupByArgs['orderBy'] }
        : { orderBy?: PerformanceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PerformanceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerformanceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Performance model
   */
  readonly fields: PerformanceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Performance.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PerformanceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    score<T extends ScoreDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ScoreDefaultArgs<ExtArgs>>): Prisma__ScoreClient<$Result.GetResult<Prisma.$ScorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Performance model
   */
  interface PerformanceFieldRefs {
    readonly id: FieldRef<"Performance", 'String'>
    readonly performanceType: FieldRef<"Performance", 'PerformanceType'>
    readonly performanceStatus: FieldRef<"Performance", 'PerformanceStatus'>
    readonly userId: FieldRef<"Performance", 'String'>
    readonly scoreId: FieldRef<"Performance", 'String'>
    readonly audioPath: FieldRef<"Performance", 'String'>
    readonly audioFeaturesPath: FieldRef<"Performance", 'String'>
    readonly comparisonResultPath: FieldRef<"Performance", 'String'>
    readonly pseudoXmlPath: FieldRef<"Performance", 'String'>
    readonly performanceDuration: FieldRef<"Performance", 'Float'>
    readonly performanceDate: FieldRef<"Performance", 'DateTime'>
    readonly uploadedAt: FieldRef<"Performance", 'DateTime'>
    readonly createdAt: FieldRef<"Performance", 'DateTime'>
    readonly pitchAccuracy: FieldRef<"Performance", 'Float'>
    readonly timingAccuracy: FieldRef<"Performance", 'Float'>
    readonly overallScore: FieldRef<"Performance", 'Float'>
    readonly evaluatedNotes: FieldRef<"Performance", 'Int'>
    readonly analysisSummary: FieldRef<"Performance", 'Json'>
    readonly analysisStatus: FieldRef<"Performance", 'JobStatus'>
    readonly retryCount: FieldRef<"Performance", 'Int'>
    readonly errorMessage: FieldRef<"Performance", 'String'>
    readonly lastAttemptedAt: FieldRef<"Performance", 'DateTime'>
    readonly executionId: FieldRef<"Performance", 'String'>
    readonly idempotencyKey: FieldRef<"Performance", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Performance findUnique
   */
  export type PerformanceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter, which Performance to fetch.
     */
    where: PerformanceWhereUniqueInput
  }

  /**
   * Performance findUniqueOrThrow
   */
  export type PerformanceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter, which Performance to fetch.
     */
    where: PerformanceWhereUniqueInput
  }

  /**
   * Performance findFirst
   */
  export type PerformanceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter, which Performance to fetch.
     */
    where?: PerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Performances to fetch.
     */
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Performances.
     */
    cursor?: PerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Performances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Performances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Performances.
     */
    distinct?: PerformanceScalarFieldEnum | PerformanceScalarFieldEnum[]
  }

  /**
   * Performance findFirstOrThrow
   */
  export type PerformanceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter, which Performance to fetch.
     */
    where?: PerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Performances to fetch.
     */
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Performances.
     */
    cursor?: PerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Performances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Performances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Performances.
     */
    distinct?: PerformanceScalarFieldEnum | PerformanceScalarFieldEnum[]
  }

  /**
   * Performance findMany
   */
  export type PerformanceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter, which Performances to fetch.
     */
    where?: PerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Performances to fetch.
     */
    orderBy?: PerformanceOrderByWithRelationInput | PerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Performances.
     */
    cursor?: PerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Performances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Performances.
     */
    skip?: number
    distinct?: PerformanceScalarFieldEnum | PerformanceScalarFieldEnum[]
  }

  /**
   * Performance create
   */
  export type PerformanceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * The data needed to create a Performance.
     */
    data: XOR<PerformanceCreateInput, PerformanceUncheckedCreateInput>
  }

  /**
   * Performance createMany
   */
  export type PerformanceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Performances.
     */
    data: PerformanceCreateManyInput | PerformanceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Performance createManyAndReturn
   */
  export type PerformanceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * The data used to create many Performances.
     */
    data: PerformanceCreateManyInput | PerformanceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Performance update
   */
  export type PerformanceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * The data needed to update a Performance.
     */
    data: XOR<PerformanceUpdateInput, PerformanceUncheckedUpdateInput>
    /**
     * Choose, which Performance to update.
     */
    where: PerformanceWhereUniqueInput
  }

  /**
   * Performance updateMany
   */
  export type PerformanceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Performances.
     */
    data: XOR<PerformanceUpdateManyMutationInput, PerformanceUncheckedUpdateManyInput>
    /**
     * Filter which Performances to update
     */
    where?: PerformanceWhereInput
    /**
     * Limit how many Performances to update.
     */
    limit?: number
  }

  /**
   * Performance updateManyAndReturn
   */
  export type PerformanceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * The data used to update Performances.
     */
    data: XOR<PerformanceUpdateManyMutationInput, PerformanceUncheckedUpdateManyInput>
    /**
     * Filter which Performances to update
     */
    where?: PerformanceWhereInput
    /**
     * Limit how many Performances to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Performance upsert
   */
  export type PerformanceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * The filter to search for the Performance to update in case it exists.
     */
    where: PerformanceWhereUniqueInput
    /**
     * In case the Performance found by the `where` argument doesn't exist, create a new Performance with this data.
     */
    create: XOR<PerformanceCreateInput, PerformanceUncheckedCreateInput>
    /**
     * In case the Performance was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PerformanceUpdateInput, PerformanceUncheckedUpdateInput>
  }

  /**
   * Performance delete
   */
  export type PerformanceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
    /**
     * Filter which Performance to delete.
     */
    where: PerformanceWhereUniqueInput
  }

  /**
   * Performance deleteMany
   */
  export type PerformanceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Performances to delete
     */
    where?: PerformanceWhereInput
    /**
     * Limit how many Performances to delete.
     */
    limit?: number
  }

  /**
   * Performance without action
   */
  export type PerformanceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Performance
     */
    select?: PerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Performance
     */
    omit?: PerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceInclude<ExtArgs> | null
  }


  /**
   * Model PracticeItem
   */

  export type AggregatePracticeItem = {
    _count: PracticeItemCountAggregateOutputType | null
    _avg: PracticeItemAvgAggregateOutputType | null
    _sum: PracticeItemSumAggregateOutputType | null
    _min: PracticeItemMinAggregateOutputType | null
    _max: PracticeItemMaxAggregateOutputType | null
  }

  export type PracticeItemAvgAggregateOutputType = {
    tempoMin: number | null
    tempoMax: number | null
    retryCount: number | null
    sortOrder: number | null
  }

  export type PracticeItemSumAggregateOutputType = {
    tempoMin: number | null
    tempoMax: number | null
    retryCount: number | null
    sortOrder: number | null
  }

  export type PracticeItemMinAggregateOutputType = {
    id: string | null
    category: $Enums.PracticeCategory | null
    title: string | null
    composer: string | null
    description: string | null
    descriptionShort: string | null
    keyTonic: string | null
    keyMode: string | null
    tempoMin: number | null
    tempoMax: number | null
    instrument: string | null
    originalXmlPath: string | null
    generatedXmlPath: string | null
    analysisPath: string | null
    analysisStatus: $Enums.JobStatus | null
    buildStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    ownerUserId: string | null
    source: string | null
    sortOrder: number | null
    isPublished: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PracticeItemMaxAggregateOutputType = {
    id: string | null
    category: $Enums.PracticeCategory | null
    title: string | null
    composer: string | null
    description: string | null
    descriptionShort: string | null
    keyTonic: string | null
    keyMode: string | null
    tempoMin: number | null
    tempoMax: number | null
    instrument: string | null
    originalXmlPath: string | null
    generatedXmlPath: string | null
    analysisPath: string | null
    analysisStatus: $Enums.JobStatus | null
    buildStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    ownerUserId: string | null
    source: string | null
    sortOrder: number | null
    isPublished: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PracticeItemCountAggregateOutputType = {
    id: number
    category: number
    title: number
    composer: number
    description: number
    descriptionShort: number
    keyTonic: number
    keyMode: number
    tempoMin: number
    tempoMax: number
    positions: number
    instrument: number
    originalXmlPath: number
    generatedXmlPath: number
    analysisPath: number
    analysisStatus: number
    buildStatus: number
    retryCount: number
    errorMessage: number
    lastAttemptedAt: number
    executionId: number
    idempotencyKey: number
    ownerUserId: number
    source: number
    sortOrder: number
    isPublished: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PracticeItemAvgAggregateInputType = {
    tempoMin?: true
    tempoMax?: true
    retryCount?: true
    sortOrder?: true
  }

  export type PracticeItemSumAggregateInputType = {
    tempoMin?: true
    tempoMax?: true
    retryCount?: true
    sortOrder?: true
  }

  export type PracticeItemMinAggregateInputType = {
    id?: true
    category?: true
    title?: true
    composer?: true
    description?: true
    descriptionShort?: true
    keyTonic?: true
    keyMode?: true
    tempoMin?: true
    tempoMax?: true
    instrument?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    ownerUserId?: true
    source?: true
    sortOrder?: true
    isPublished?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PracticeItemMaxAggregateInputType = {
    id?: true
    category?: true
    title?: true
    composer?: true
    description?: true
    descriptionShort?: true
    keyTonic?: true
    keyMode?: true
    tempoMin?: true
    tempoMax?: true
    instrument?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    ownerUserId?: true
    source?: true
    sortOrder?: true
    isPublished?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PracticeItemCountAggregateInputType = {
    id?: true
    category?: true
    title?: true
    composer?: true
    description?: true
    descriptionShort?: true
    keyTonic?: true
    keyMode?: true
    tempoMin?: true
    tempoMax?: true
    positions?: true
    instrument?: true
    originalXmlPath?: true
    generatedXmlPath?: true
    analysisPath?: true
    analysisStatus?: true
    buildStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    ownerUserId?: true
    source?: true
    sortOrder?: true
    isPublished?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PracticeItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticeItem to aggregate.
     */
    where?: PracticeItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItems to fetch.
     */
    orderBy?: PracticeItemOrderByWithRelationInput | PracticeItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PracticeItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PracticeItems
    **/
    _count?: true | PracticeItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PracticeItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PracticeItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PracticeItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PracticeItemMaxAggregateInputType
  }

  export type GetPracticeItemAggregateType<T extends PracticeItemAggregateArgs> = {
        [P in keyof T & keyof AggregatePracticeItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePracticeItem[P]>
      : GetScalarType<T[P], AggregatePracticeItem[P]>
  }




  export type PracticeItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticeItemWhereInput
    orderBy?: PracticeItemOrderByWithAggregationInput | PracticeItemOrderByWithAggregationInput[]
    by: PracticeItemScalarFieldEnum[] | PracticeItemScalarFieldEnum
    having?: PracticeItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PracticeItemCountAggregateInputType | true
    _avg?: PracticeItemAvgAggregateInputType
    _sum?: PracticeItemSumAggregateInputType
    _min?: PracticeItemMinAggregateInputType
    _max?: PracticeItemMaxAggregateInputType
  }

  export type PracticeItemGroupByOutputType = {
    id: string
    category: $Enums.PracticeCategory
    title: string
    composer: string | null
    description: string | null
    descriptionShort: string | null
    keyTonic: string
    keyMode: string
    tempoMin: number | null
    tempoMax: number | null
    positions: string[]
    instrument: string
    originalXmlPath: string
    generatedXmlPath: string | null
    analysisPath: string | null
    analysisStatus: $Enums.JobStatus
    buildStatus: $Enums.JobStatus
    retryCount: number
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    ownerUserId: string | null
    source: string | null
    sortOrder: number
    isPublished: boolean
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: PracticeItemCountAggregateOutputType | null
    _avg: PracticeItemAvgAggregateOutputType | null
    _sum: PracticeItemSumAggregateOutputType | null
    _min: PracticeItemMinAggregateOutputType | null
    _max: PracticeItemMaxAggregateOutputType | null
  }

  type GetPracticeItemGroupByPayload<T extends PracticeItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PracticeItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PracticeItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PracticeItemGroupByOutputType[P]>
            : GetScalarType<T[P], PracticeItemGroupByOutputType[P]>
        }
      >
    >


  export type PracticeItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    title?: boolean
    composer?: boolean
    description?: boolean
    descriptionShort?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    tempoMin?: boolean
    tempoMax?: boolean
    positions?: boolean
    instrument?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    ownerUserId?: boolean
    source?: boolean
    sortOrder?: boolean
    isPublished?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
    techniques?: boolean | PracticeItem$techniquesArgs<ExtArgs>
    practicePerformances?: boolean | PracticeItem$practicePerformancesArgs<ExtArgs>
    _count?: boolean | PracticeItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItem"]>

  export type PracticeItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    title?: boolean
    composer?: boolean
    description?: boolean
    descriptionShort?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    tempoMin?: boolean
    tempoMax?: boolean
    positions?: boolean
    instrument?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    ownerUserId?: boolean
    source?: boolean
    sortOrder?: boolean
    isPublished?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItem"]>

  export type PracticeItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    title?: boolean
    composer?: boolean
    description?: boolean
    descriptionShort?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    tempoMin?: boolean
    tempoMax?: boolean
    positions?: boolean
    instrument?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    ownerUserId?: boolean
    source?: boolean
    sortOrder?: boolean
    isPublished?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItem"]>

  export type PracticeItemSelectScalar = {
    id?: boolean
    category?: boolean
    title?: boolean
    composer?: boolean
    description?: boolean
    descriptionShort?: boolean
    keyTonic?: boolean
    keyMode?: boolean
    tempoMin?: boolean
    tempoMax?: boolean
    positions?: boolean
    instrument?: boolean
    originalXmlPath?: boolean
    generatedXmlPath?: boolean
    analysisPath?: boolean
    analysisStatus?: boolean
    buildStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    ownerUserId?: boolean
    source?: boolean
    sortOrder?: boolean
    isPublished?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PracticeItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "category" | "title" | "composer" | "description" | "descriptionShort" | "keyTonic" | "keyMode" | "tempoMin" | "tempoMax" | "positions" | "instrument" | "originalXmlPath" | "generatedXmlPath" | "analysisPath" | "analysisStatus" | "buildStatus" | "retryCount" | "errorMessage" | "lastAttemptedAt" | "executionId" | "idempotencyKey" | "ownerUserId" | "source" | "sortOrder" | "isPublished" | "metadata" | "createdAt" | "updatedAt", ExtArgs["result"]["practiceItem"]>
  export type PracticeItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
    techniques?: boolean | PracticeItem$techniquesArgs<ExtArgs>
    practicePerformances?: boolean | PracticeItem$practicePerformancesArgs<ExtArgs>
    _count?: boolean | PracticeItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PracticeItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
  }
  export type PracticeItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | PracticeItem$ownerArgs<ExtArgs>
  }

  export type $PracticeItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PracticeItem"
    objects: {
      owner: Prisma.$UserPayload<ExtArgs> | null
      techniques: Prisma.$PracticeItemTechniquePayload<ExtArgs>[]
      practicePerformances: Prisma.$PracticePerformancePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      category: $Enums.PracticeCategory
      title: string
      composer: string | null
      description: string | null
      descriptionShort: string | null
      keyTonic: string
      keyMode: string
      tempoMin: number | null
      tempoMax: number | null
      positions: string[]
      instrument: string
      originalXmlPath: string
      generatedXmlPath: string | null
      analysisPath: string | null
      analysisStatus: $Enums.JobStatus
      buildStatus: $Enums.JobStatus
      retryCount: number
      errorMessage: string | null
      lastAttemptedAt: Date | null
      executionId: string | null
      idempotencyKey: string | null
      ownerUserId: string | null
      source: string | null
      sortOrder: number
      isPublished: boolean
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["practiceItem"]>
    composites: {}
  }

  type PracticeItemGetPayload<S extends boolean | null | undefined | PracticeItemDefaultArgs> = $Result.GetResult<Prisma.$PracticeItemPayload, S>

  type PracticeItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PracticeItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PracticeItemCountAggregateInputType | true
    }

  export interface PracticeItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PracticeItem'], meta: { name: 'PracticeItem' } }
    /**
     * Find zero or one PracticeItem that matches the filter.
     * @param {PracticeItemFindUniqueArgs} args - Arguments to find a PracticeItem
     * @example
     * // Get one PracticeItem
     * const practiceItem = await prisma.practiceItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PracticeItemFindUniqueArgs>(args: SelectSubset<T, PracticeItemFindUniqueArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PracticeItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PracticeItemFindUniqueOrThrowArgs} args - Arguments to find a PracticeItem
     * @example
     * // Get one PracticeItem
     * const practiceItem = await prisma.practiceItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PracticeItemFindUniqueOrThrowArgs>(args: SelectSubset<T, PracticeItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticeItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemFindFirstArgs} args - Arguments to find a PracticeItem
     * @example
     * // Get one PracticeItem
     * const practiceItem = await prisma.practiceItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PracticeItemFindFirstArgs>(args?: SelectSubset<T, PracticeItemFindFirstArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticeItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemFindFirstOrThrowArgs} args - Arguments to find a PracticeItem
     * @example
     * // Get one PracticeItem
     * const practiceItem = await prisma.practiceItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PracticeItemFindFirstOrThrowArgs>(args?: SelectSubset<T, PracticeItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PracticeItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PracticeItems
     * const practiceItems = await prisma.practiceItem.findMany()
     * 
     * // Get first 10 PracticeItems
     * const practiceItems = await prisma.practiceItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const practiceItemWithIdOnly = await prisma.practiceItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PracticeItemFindManyArgs>(args?: SelectSubset<T, PracticeItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PracticeItem.
     * @param {PracticeItemCreateArgs} args - Arguments to create a PracticeItem.
     * @example
     * // Create one PracticeItem
     * const PracticeItem = await prisma.practiceItem.create({
     *   data: {
     *     // ... data to create a PracticeItem
     *   }
     * })
     * 
     */
    create<T extends PracticeItemCreateArgs>(args: SelectSubset<T, PracticeItemCreateArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PracticeItems.
     * @param {PracticeItemCreateManyArgs} args - Arguments to create many PracticeItems.
     * @example
     * // Create many PracticeItems
     * const practiceItem = await prisma.practiceItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PracticeItemCreateManyArgs>(args?: SelectSubset<T, PracticeItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PracticeItems and returns the data saved in the database.
     * @param {PracticeItemCreateManyAndReturnArgs} args - Arguments to create many PracticeItems.
     * @example
     * // Create many PracticeItems
     * const practiceItem = await prisma.practiceItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PracticeItems and only return the `id`
     * const practiceItemWithIdOnly = await prisma.practiceItem.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PracticeItemCreateManyAndReturnArgs>(args?: SelectSubset<T, PracticeItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PracticeItem.
     * @param {PracticeItemDeleteArgs} args - Arguments to delete one PracticeItem.
     * @example
     * // Delete one PracticeItem
     * const PracticeItem = await prisma.practiceItem.delete({
     *   where: {
     *     // ... filter to delete one PracticeItem
     *   }
     * })
     * 
     */
    delete<T extends PracticeItemDeleteArgs>(args: SelectSubset<T, PracticeItemDeleteArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PracticeItem.
     * @param {PracticeItemUpdateArgs} args - Arguments to update one PracticeItem.
     * @example
     * // Update one PracticeItem
     * const practiceItem = await prisma.practiceItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PracticeItemUpdateArgs>(args: SelectSubset<T, PracticeItemUpdateArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PracticeItems.
     * @param {PracticeItemDeleteManyArgs} args - Arguments to filter PracticeItems to delete.
     * @example
     * // Delete a few PracticeItems
     * const { count } = await prisma.practiceItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PracticeItemDeleteManyArgs>(args?: SelectSubset<T, PracticeItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticeItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PracticeItems
     * const practiceItem = await prisma.practiceItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PracticeItemUpdateManyArgs>(args: SelectSubset<T, PracticeItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticeItems and returns the data updated in the database.
     * @param {PracticeItemUpdateManyAndReturnArgs} args - Arguments to update many PracticeItems.
     * @example
     * // Update many PracticeItems
     * const practiceItem = await prisma.practiceItem.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PracticeItems and only return the `id`
     * const practiceItemWithIdOnly = await prisma.practiceItem.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PracticeItemUpdateManyAndReturnArgs>(args: SelectSubset<T, PracticeItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PracticeItem.
     * @param {PracticeItemUpsertArgs} args - Arguments to update or create a PracticeItem.
     * @example
     * // Update or create a PracticeItem
     * const practiceItem = await prisma.practiceItem.upsert({
     *   create: {
     *     // ... data to create a PracticeItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PracticeItem we want to update
     *   }
     * })
     */
    upsert<T extends PracticeItemUpsertArgs>(args: SelectSubset<T, PracticeItemUpsertArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PracticeItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemCountArgs} args - Arguments to filter PracticeItems to count.
     * @example
     * // Count the number of PracticeItems
     * const count = await prisma.practiceItem.count({
     *   where: {
     *     // ... the filter for the PracticeItems we want to count
     *   }
     * })
    **/
    count<T extends PracticeItemCountArgs>(
      args?: Subset<T, PracticeItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PracticeItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PracticeItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PracticeItemAggregateArgs>(args: Subset<T, PracticeItemAggregateArgs>): Prisma.PrismaPromise<GetPracticeItemAggregateType<T>>

    /**
     * Group by PracticeItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PracticeItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PracticeItemGroupByArgs['orderBy'] }
        : { orderBy?: PracticeItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PracticeItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPracticeItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PracticeItem model
   */
  readonly fields: PracticeItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PracticeItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PracticeItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owner<T extends PracticeItem$ownerArgs<ExtArgs> = {}>(args?: Subset<T, PracticeItem$ownerArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    techniques<T extends PracticeItem$techniquesArgs<ExtArgs> = {}>(args?: Subset<T, PracticeItem$techniquesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    practicePerformances<T extends PracticeItem$practicePerformancesArgs<ExtArgs> = {}>(args?: Subset<T, PracticeItem$practicePerformancesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PracticeItem model
   */
  interface PracticeItemFieldRefs {
    readonly id: FieldRef<"PracticeItem", 'String'>
    readonly category: FieldRef<"PracticeItem", 'PracticeCategory'>
    readonly title: FieldRef<"PracticeItem", 'String'>
    readonly composer: FieldRef<"PracticeItem", 'String'>
    readonly description: FieldRef<"PracticeItem", 'String'>
    readonly descriptionShort: FieldRef<"PracticeItem", 'String'>
    readonly keyTonic: FieldRef<"PracticeItem", 'String'>
    readonly keyMode: FieldRef<"PracticeItem", 'String'>
    readonly tempoMin: FieldRef<"PracticeItem", 'Int'>
    readonly tempoMax: FieldRef<"PracticeItem", 'Int'>
    readonly positions: FieldRef<"PracticeItem", 'String[]'>
    readonly instrument: FieldRef<"PracticeItem", 'String'>
    readonly originalXmlPath: FieldRef<"PracticeItem", 'String'>
    readonly generatedXmlPath: FieldRef<"PracticeItem", 'String'>
    readonly analysisPath: FieldRef<"PracticeItem", 'String'>
    readonly analysisStatus: FieldRef<"PracticeItem", 'JobStatus'>
    readonly buildStatus: FieldRef<"PracticeItem", 'JobStatus'>
    readonly retryCount: FieldRef<"PracticeItem", 'Int'>
    readonly errorMessage: FieldRef<"PracticeItem", 'String'>
    readonly lastAttemptedAt: FieldRef<"PracticeItem", 'DateTime'>
    readonly executionId: FieldRef<"PracticeItem", 'String'>
    readonly idempotencyKey: FieldRef<"PracticeItem", 'String'>
    readonly ownerUserId: FieldRef<"PracticeItem", 'String'>
    readonly source: FieldRef<"PracticeItem", 'String'>
    readonly sortOrder: FieldRef<"PracticeItem", 'Int'>
    readonly isPublished: FieldRef<"PracticeItem", 'Boolean'>
    readonly metadata: FieldRef<"PracticeItem", 'Json'>
    readonly createdAt: FieldRef<"PracticeItem", 'DateTime'>
    readonly updatedAt: FieldRef<"PracticeItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PracticeItem findUnique
   */
  export type PracticeItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItem to fetch.
     */
    where: PracticeItemWhereUniqueInput
  }

  /**
   * PracticeItem findUniqueOrThrow
   */
  export type PracticeItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItem to fetch.
     */
    where: PracticeItemWhereUniqueInput
  }

  /**
   * PracticeItem findFirst
   */
  export type PracticeItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItem to fetch.
     */
    where?: PracticeItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItems to fetch.
     */
    orderBy?: PracticeItemOrderByWithRelationInput | PracticeItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticeItems.
     */
    cursor?: PracticeItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticeItems.
     */
    distinct?: PracticeItemScalarFieldEnum | PracticeItemScalarFieldEnum[]
  }

  /**
   * PracticeItem findFirstOrThrow
   */
  export type PracticeItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItem to fetch.
     */
    where?: PracticeItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItems to fetch.
     */
    orderBy?: PracticeItemOrderByWithRelationInput | PracticeItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticeItems.
     */
    cursor?: PracticeItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticeItems.
     */
    distinct?: PracticeItemScalarFieldEnum | PracticeItemScalarFieldEnum[]
  }

  /**
   * PracticeItem findMany
   */
  export type PracticeItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItems to fetch.
     */
    where?: PracticeItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItems to fetch.
     */
    orderBy?: PracticeItemOrderByWithRelationInput | PracticeItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PracticeItems.
     */
    cursor?: PracticeItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItems.
     */
    skip?: number
    distinct?: PracticeItemScalarFieldEnum | PracticeItemScalarFieldEnum[]
  }

  /**
   * PracticeItem create
   */
  export type PracticeItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * The data needed to create a PracticeItem.
     */
    data: XOR<PracticeItemCreateInput, PracticeItemUncheckedCreateInput>
  }

  /**
   * PracticeItem createMany
   */
  export type PracticeItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PracticeItems.
     */
    data: PracticeItemCreateManyInput | PracticeItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PracticeItem createManyAndReturn
   */
  export type PracticeItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * The data used to create many PracticeItems.
     */
    data: PracticeItemCreateManyInput | PracticeItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticeItem update
   */
  export type PracticeItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * The data needed to update a PracticeItem.
     */
    data: XOR<PracticeItemUpdateInput, PracticeItemUncheckedUpdateInput>
    /**
     * Choose, which PracticeItem to update.
     */
    where: PracticeItemWhereUniqueInput
  }

  /**
   * PracticeItem updateMany
   */
  export type PracticeItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PracticeItems.
     */
    data: XOR<PracticeItemUpdateManyMutationInput, PracticeItemUncheckedUpdateManyInput>
    /**
     * Filter which PracticeItems to update
     */
    where?: PracticeItemWhereInput
    /**
     * Limit how many PracticeItems to update.
     */
    limit?: number
  }

  /**
   * PracticeItem updateManyAndReturn
   */
  export type PracticeItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * The data used to update PracticeItems.
     */
    data: XOR<PracticeItemUpdateManyMutationInput, PracticeItemUncheckedUpdateManyInput>
    /**
     * Filter which PracticeItems to update
     */
    where?: PracticeItemWhereInput
    /**
     * Limit how many PracticeItems to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticeItem upsert
   */
  export type PracticeItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * The filter to search for the PracticeItem to update in case it exists.
     */
    where: PracticeItemWhereUniqueInput
    /**
     * In case the PracticeItem found by the `where` argument doesn't exist, create a new PracticeItem with this data.
     */
    create: XOR<PracticeItemCreateInput, PracticeItemUncheckedCreateInput>
    /**
     * In case the PracticeItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PracticeItemUpdateInput, PracticeItemUncheckedUpdateInput>
  }

  /**
   * PracticeItem delete
   */
  export type PracticeItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
    /**
     * Filter which PracticeItem to delete.
     */
    where: PracticeItemWhereUniqueInput
  }

  /**
   * PracticeItem deleteMany
   */
  export type PracticeItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticeItems to delete
     */
    where?: PracticeItemWhereInput
    /**
     * Limit how many PracticeItems to delete.
     */
    limit?: number
  }

  /**
   * PracticeItem.owner
   */
  export type PracticeItem$ownerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * PracticeItem.techniques
   */
  export type PracticeItem$techniquesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    where?: PracticeItemTechniqueWhereInput
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    cursor?: PracticeItemTechniqueWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PracticeItemTechniqueScalarFieldEnum | PracticeItemTechniqueScalarFieldEnum[]
  }

  /**
   * PracticeItem.practicePerformances
   */
  export type PracticeItem$practicePerformancesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    where?: PracticePerformanceWhereInput
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    cursor?: PracticePerformanceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PracticePerformanceScalarFieldEnum | PracticePerformanceScalarFieldEnum[]
  }

  /**
   * PracticeItem without action
   */
  export type PracticeItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItem
     */
    select?: PracticeItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItem
     */
    omit?: PracticeItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemInclude<ExtArgs> | null
  }


  /**
   * Model TechniqueTag
   */

  export type AggregateTechniqueTag = {
    _count: TechniqueTagCountAggregateOutputType | null
    _min: TechniqueTagMinAggregateOutputType | null
    _max: TechniqueTagMaxAggregateOutputType | null
  }

  export type TechniqueTagMinAggregateOutputType = {
    id: string | null
    category: string | null
    name: string | null
    nameEn: string | null
    description: string | null
    isAnalyzable: string | null
    implementStatus: string | null
  }

  export type TechniqueTagMaxAggregateOutputType = {
    id: string | null
    category: string | null
    name: string | null
    nameEn: string | null
    description: string | null
    isAnalyzable: string | null
    implementStatus: string | null
  }

  export type TechniqueTagCountAggregateOutputType = {
    id: number
    category: number
    name: number
    nameEn: number
    description: number
    xmlTags: number
    isAnalyzable: number
    implementStatus: number
    _all: number
  }


  export type TechniqueTagMinAggregateInputType = {
    id?: true
    category?: true
    name?: true
    nameEn?: true
    description?: true
    isAnalyzable?: true
    implementStatus?: true
  }

  export type TechniqueTagMaxAggregateInputType = {
    id?: true
    category?: true
    name?: true
    nameEn?: true
    description?: true
    isAnalyzable?: true
    implementStatus?: true
  }

  export type TechniqueTagCountAggregateInputType = {
    id?: true
    category?: true
    name?: true
    nameEn?: true
    description?: true
    xmlTags?: true
    isAnalyzable?: true
    implementStatus?: true
    _all?: true
  }

  export type TechniqueTagAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TechniqueTag to aggregate.
     */
    where?: TechniqueTagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TechniqueTags to fetch.
     */
    orderBy?: TechniqueTagOrderByWithRelationInput | TechniqueTagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TechniqueTagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TechniqueTags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TechniqueTags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TechniqueTags
    **/
    _count?: true | TechniqueTagCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TechniqueTagMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TechniqueTagMaxAggregateInputType
  }

  export type GetTechniqueTagAggregateType<T extends TechniqueTagAggregateArgs> = {
        [P in keyof T & keyof AggregateTechniqueTag]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTechniqueTag[P]>
      : GetScalarType<T[P], AggregateTechniqueTag[P]>
  }




  export type TechniqueTagGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TechniqueTagWhereInput
    orderBy?: TechniqueTagOrderByWithAggregationInput | TechniqueTagOrderByWithAggregationInput[]
    by: TechniqueTagScalarFieldEnum[] | TechniqueTagScalarFieldEnum
    having?: TechniqueTagScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TechniqueTagCountAggregateInputType | true
    _min?: TechniqueTagMinAggregateInputType
    _max?: TechniqueTagMaxAggregateInputType
  }

  export type TechniqueTagGroupByOutputType = {
    id: string
    category: string
    name: string
    nameEn: string | null
    description: string | null
    xmlTags: string[]
    isAnalyzable: string
    implementStatus: string
    _count: TechniqueTagCountAggregateOutputType | null
    _min: TechniqueTagMinAggregateOutputType | null
    _max: TechniqueTagMaxAggregateOutputType | null
  }

  type GetTechniqueTagGroupByPayload<T extends TechniqueTagGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TechniqueTagGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TechniqueTagGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TechniqueTagGroupByOutputType[P]>
            : GetScalarType<T[P], TechniqueTagGroupByOutputType[P]>
        }
      >
    >


  export type TechniqueTagSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    name?: boolean
    nameEn?: boolean
    description?: boolean
    xmlTags?: boolean
    isAnalyzable?: boolean
    implementStatus?: boolean
    practiceItems?: boolean | TechniqueTag$practiceItemsArgs<ExtArgs>
    weaknesses?: boolean | TechniqueTag$weaknessesArgs<ExtArgs>
    _count?: boolean | TechniqueTagCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["techniqueTag"]>

  export type TechniqueTagSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    name?: boolean
    nameEn?: boolean
    description?: boolean
    xmlTags?: boolean
    isAnalyzable?: boolean
    implementStatus?: boolean
  }, ExtArgs["result"]["techniqueTag"]>

  export type TechniqueTagSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    category?: boolean
    name?: boolean
    nameEn?: boolean
    description?: boolean
    xmlTags?: boolean
    isAnalyzable?: boolean
    implementStatus?: boolean
  }, ExtArgs["result"]["techniqueTag"]>

  export type TechniqueTagSelectScalar = {
    id?: boolean
    category?: boolean
    name?: boolean
    nameEn?: boolean
    description?: boolean
    xmlTags?: boolean
    isAnalyzable?: boolean
    implementStatus?: boolean
  }

  export type TechniqueTagOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "category" | "name" | "nameEn" | "description" | "xmlTags" | "isAnalyzable" | "implementStatus", ExtArgs["result"]["techniqueTag"]>
  export type TechniqueTagInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    practiceItems?: boolean | TechniqueTag$practiceItemsArgs<ExtArgs>
    weaknesses?: boolean | TechniqueTag$weaknessesArgs<ExtArgs>
    _count?: boolean | TechniqueTagCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TechniqueTagIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type TechniqueTagIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $TechniqueTagPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TechniqueTag"
    objects: {
      practiceItems: Prisma.$PracticeItemTechniquePayload<ExtArgs>[]
      weaknesses: Prisma.$UserWeaknessPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      category: string
      name: string
      nameEn: string | null
      description: string | null
      xmlTags: string[]
      isAnalyzable: string
      implementStatus: string
    }, ExtArgs["result"]["techniqueTag"]>
    composites: {}
  }

  type TechniqueTagGetPayload<S extends boolean | null | undefined | TechniqueTagDefaultArgs> = $Result.GetResult<Prisma.$TechniqueTagPayload, S>

  type TechniqueTagCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TechniqueTagFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TechniqueTagCountAggregateInputType | true
    }

  export interface TechniqueTagDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TechniqueTag'], meta: { name: 'TechniqueTag' } }
    /**
     * Find zero or one TechniqueTag that matches the filter.
     * @param {TechniqueTagFindUniqueArgs} args - Arguments to find a TechniqueTag
     * @example
     * // Get one TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TechniqueTagFindUniqueArgs>(args: SelectSubset<T, TechniqueTagFindUniqueArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TechniqueTag that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TechniqueTagFindUniqueOrThrowArgs} args - Arguments to find a TechniqueTag
     * @example
     * // Get one TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TechniqueTagFindUniqueOrThrowArgs>(args: SelectSubset<T, TechniqueTagFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TechniqueTag that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagFindFirstArgs} args - Arguments to find a TechniqueTag
     * @example
     * // Get one TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TechniqueTagFindFirstArgs>(args?: SelectSubset<T, TechniqueTagFindFirstArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TechniqueTag that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagFindFirstOrThrowArgs} args - Arguments to find a TechniqueTag
     * @example
     * // Get one TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TechniqueTagFindFirstOrThrowArgs>(args?: SelectSubset<T, TechniqueTagFindFirstOrThrowArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TechniqueTags that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TechniqueTags
     * const techniqueTags = await prisma.techniqueTag.findMany()
     * 
     * // Get first 10 TechniqueTags
     * const techniqueTags = await prisma.techniqueTag.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const techniqueTagWithIdOnly = await prisma.techniqueTag.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TechniqueTagFindManyArgs>(args?: SelectSubset<T, TechniqueTagFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TechniqueTag.
     * @param {TechniqueTagCreateArgs} args - Arguments to create a TechniqueTag.
     * @example
     * // Create one TechniqueTag
     * const TechniqueTag = await prisma.techniqueTag.create({
     *   data: {
     *     // ... data to create a TechniqueTag
     *   }
     * })
     * 
     */
    create<T extends TechniqueTagCreateArgs>(args: SelectSubset<T, TechniqueTagCreateArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TechniqueTags.
     * @param {TechniqueTagCreateManyArgs} args - Arguments to create many TechniqueTags.
     * @example
     * // Create many TechniqueTags
     * const techniqueTag = await prisma.techniqueTag.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TechniqueTagCreateManyArgs>(args?: SelectSubset<T, TechniqueTagCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TechniqueTags and returns the data saved in the database.
     * @param {TechniqueTagCreateManyAndReturnArgs} args - Arguments to create many TechniqueTags.
     * @example
     * // Create many TechniqueTags
     * const techniqueTag = await prisma.techniqueTag.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TechniqueTags and only return the `id`
     * const techniqueTagWithIdOnly = await prisma.techniqueTag.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TechniqueTagCreateManyAndReturnArgs>(args?: SelectSubset<T, TechniqueTagCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TechniqueTag.
     * @param {TechniqueTagDeleteArgs} args - Arguments to delete one TechniqueTag.
     * @example
     * // Delete one TechniqueTag
     * const TechniqueTag = await prisma.techniqueTag.delete({
     *   where: {
     *     // ... filter to delete one TechniqueTag
     *   }
     * })
     * 
     */
    delete<T extends TechniqueTagDeleteArgs>(args: SelectSubset<T, TechniqueTagDeleteArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TechniqueTag.
     * @param {TechniqueTagUpdateArgs} args - Arguments to update one TechniqueTag.
     * @example
     * // Update one TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TechniqueTagUpdateArgs>(args: SelectSubset<T, TechniqueTagUpdateArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TechniqueTags.
     * @param {TechniqueTagDeleteManyArgs} args - Arguments to filter TechniqueTags to delete.
     * @example
     * // Delete a few TechniqueTags
     * const { count } = await prisma.techniqueTag.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TechniqueTagDeleteManyArgs>(args?: SelectSubset<T, TechniqueTagDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TechniqueTags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TechniqueTags
     * const techniqueTag = await prisma.techniqueTag.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TechniqueTagUpdateManyArgs>(args: SelectSubset<T, TechniqueTagUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TechniqueTags and returns the data updated in the database.
     * @param {TechniqueTagUpdateManyAndReturnArgs} args - Arguments to update many TechniqueTags.
     * @example
     * // Update many TechniqueTags
     * const techniqueTag = await prisma.techniqueTag.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TechniqueTags and only return the `id`
     * const techniqueTagWithIdOnly = await prisma.techniqueTag.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TechniqueTagUpdateManyAndReturnArgs>(args: SelectSubset<T, TechniqueTagUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TechniqueTag.
     * @param {TechniqueTagUpsertArgs} args - Arguments to update or create a TechniqueTag.
     * @example
     * // Update or create a TechniqueTag
     * const techniqueTag = await prisma.techniqueTag.upsert({
     *   create: {
     *     // ... data to create a TechniqueTag
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TechniqueTag we want to update
     *   }
     * })
     */
    upsert<T extends TechniqueTagUpsertArgs>(args: SelectSubset<T, TechniqueTagUpsertArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TechniqueTags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagCountArgs} args - Arguments to filter TechniqueTags to count.
     * @example
     * // Count the number of TechniqueTags
     * const count = await prisma.techniqueTag.count({
     *   where: {
     *     // ... the filter for the TechniqueTags we want to count
     *   }
     * })
    **/
    count<T extends TechniqueTagCountArgs>(
      args?: Subset<T, TechniqueTagCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TechniqueTagCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TechniqueTag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TechniqueTagAggregateArgs>(args: Subset<T, TechniqueTagAggregateArgs>): Prisma.PrismaPromise<GetTechniqueTagAggregateType<T>>

    /**
     * Group by TechniqueTag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TechniqueTagGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TechniqueTagGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TechniqueTagGroupByArgs['orderBy'] }
        : { orderBy?: TechniqueTagGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TechniqueTagGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTechniqueTagGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TechniqueTag model
   */
  readonly fields: TechniqueTagFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TechniqueTag.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TechniqueTagClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    practiceItems<T extends TechniqueTag$practiceItemsArgs<ExtArgs> = {}>(args?: Subset<T, TechniqueTag$practiceItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    weaknesses<T extends TechniqueTag$weaknessesArgs<ExtArgs> = {}>(args?: Subset<T, TechniqueTag$weaknessesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TechniqueTag model
   */
  interface TechniqueTagFieldRefs {
    readonly id: FieldRef<"TechniqueTag", 'String'>
    readonly category: FieldRef<"TechniqueTag", 'String'>
    readonly name: FieldRef<"TechniqueTag", 'String'>
    readonly nameEn: FieldRef<"TechniqueTag", 'String'>
    readonly description: FieldRef<"TechniqueTag", 'String'>
    readonly xmlTags: FieldRef<"TechniqueTag", 'String[]'>
    readonly isAnalyzable: FieldRef<"TechniqueTag", 'String'>
    readonly implementStatus: FieldRef<"TechniqueTag", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TechniqueTag findUnique
   */
  export type TechniqueTagFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter, which TechniqueTag to fetch.
     */
    where: TechniqueTagWhereUniqueInput
  }

  /**
   * TechniqueTag findUniqueOrThrow
   */
  export type TechniqueTagFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter, which TechniqueTag to fetch.
     */
    where: TechniqueTagWhereUniqueInput
  }

  /**
   * TechniqueTag findFirst
   */
  export type TechniqueTagFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter, which TechniqueTag to fetch.
     */
    where?: TechniqueTagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TechniqueTags to fetch.
     */
    orderBy?: TechniqueTagOrderByWithRelationInput | TechniqueTagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TechniqueTags.
     */
    cursor?: TechniqueTagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TechniqueTags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TechniqueTags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TechniqueTags.
     */
    distinct?: TechniqueTagScalarFieldEnum | TechniqueTagScalarFieldEnum[]
  }

  /**
   * TechniqueTag findFirstOrThrow
   */
  export type TechniqueTagFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter, which TechniqueTag to fetch.
     */
    where?: TechniqueTagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TechniqueTags to fetch.
     */
    orderBy?: TechniqueTagOrderByWithRelationInput | TechniqueTagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TechniqueTags.
     */
    cursor?: TechniqueTagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TechniqueTags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TechniqueTags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TechniqueTags.
     */
    distinct?: TechniqueTagScalarFieldEnum | TechniqueTagScalarFieldEnum[]
  }

  /**
   * TechniqueTag findMany
   */
  export type TechniqueTagFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter, which TechniqueTags to fetch.
     */
    where?: TechniqueTagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TechniqueTags to fetch.
     */
    orderBy?: TechniqueTagOrderByWithRelationInput | TechniqueTagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TechniqueTags.
     */
    cursor?: TechniqueTagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TechniqueTags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TechniqueTags.
     */
    skip?: number
    distinct?: TechniqueTagScalarFieldEnum | TechniqueTagScalarFieldEnum[]
  }

  /**
   * TechniqueTag create
   */
  export type TechniqueTagCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * The data needed to create a TechniqueTag.
     */
    data: XOR<TechniqueTagCreateInput, TechniqueTagUncheckedCreateInput>
  }

  /**
   * TechniqueTag createMany
   */
  export type TechniqueTagCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TechniqueTags.
     */
    data: TechniqueTagCreateManyInput | TechniqueTagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TechniqueTag createManyAndReturn
   */
  export type TechniqueTagCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * The data used to create many TechniqueTags.
     */
    data: TechniqueTagCreateManyInput | TechniqueTagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TechniqueTag update
   */
  export type TechniqueTagUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * The data needed to update a TechniqueTag.
     */
    data: XOR<TechniqueTagUpdateInput, TechniqueTagUncheckedUpdateInput>
    /**
     * Choose, which TechniqueTag to update.
     */
    where: TechniqueTagWhereUniqueInput
  }

  /**
   * TechniqueTag updateMany
   */
  export type TechniqueTagUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TechniqueTags.
     */
    data: XOR<TechniqueTagUpdateManyMutationInput, TechniqueTagUncheckedUpdateManyInput>
    /**
     * Filter which TechniqueTags to update
     */
    where?: TechniqueTagWhereInput
    /**
     * Limit how many TechniqueTags to update.
     */
    limit?: number
  }

  /**
   * TechniqueTag updateManyAndReturn
   */
  export type TechniqueTagUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * The data used to update TechniqueTags.
     */
    data: XOR<TechniqueTagUpdateManyMutationInput, TechniqueTagUncheckedUpdateManyInput>
    /**
     * Filter which TechniqueTags to update
     */
    where?: TechniqueTagWhereInput
    /**
     * Limit how many TechniqueTags to update.
     */
    limit?: number
  }

  /**
   * TechniqueTag upsert
   */
  export type TechniqueTagUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * The filter to search for the TechniqueTag to update in case it exists.
     */
    where: TechniqueTagWhereUniqueInput
    /**
     * In case the TechniqueTag found by the `where` argument doesn't exist, create a new TechniqueTag with this data.
     */
    create: XOR<TechniqueTagCreateInput, TechniqueTagUncheckedCreateInput>
    /**
     * In case the TechniqueTag was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TechniqueTagUpdateInput, TechniqueTagUncheckedUpdateInput>
  }

  /**
   * TechniqueTag delete
   */
  export type TechniqueTagDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    /**
     * Filter which TechniqueTag to delete.
     */
    where: TechniqueTagWhereUniqueInput
  }

  /**
   * TechniqueTag deleteMany
   */
  export type TechniqueTagDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TechniqueTags to delete
     */
    where?: TechniqueTagWhereInput
    /**
     * Limit how many TechniqueTags to delete.
     */
    limit?: number
  }

  /**
   * TechniqueTag.practiceItems
   */
  export type TechniqueTag$practiceItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    where?: PracticeItemTechniqueWhereInput
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    cursor?: PracticeItemTechniqueWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PracticeItemTechniqueScalarFieldEnum | PracticeItemTechniqueScalarFieldEnum[]
  }

  /**
   * TechniqueTag.weaknesses
   */
  export type TechniqueTag$weaknessesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    where?: UserWeaknessWhereInput
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    cursor?: UserWeaknessWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserWeaknessScalarFieldEnum | UserWeaknessScalarFieldEnum[]
  }

  /**
   * TechniqueTag without action
   */
  export type TechniqueTagDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
  }


  /**
   * Model PracticeItemTechnique
   */

  export type AggregatePracticeItemTechnique = {
    _count: PracticeItemTechniqueCountAggregateOutputType | null
    _min: PracticeItemTechniqueMinAggregateOutputType | null
    _max: PracticeItemTechniqueMaxAggregateOutputType | null
  }

  export type PracticeItemTechniqueMinAggregateOutputType = {
    practiceItemId: string | null
    techniqueTagId: string | null
    isPrimary: boolean | null
  }

  export type PracticeItemTechniqueMaxAggregateOutputType = {
    practiceItemId: string | null
    techniqueTagId: string | null
    isPrimary: boolean | null
  }

  export type PracticeItemTechniqueCountAggregateOutputType = {
    practiceItemId: number
    techniqueTagId: number
    isPrimary: number
    _all: number
  }


  export type PracticeItemTechniqueMinAggregateInputType = {
    practiceItemId?: true
    techniqueTagId?: true
    isPrimary?: true
  }

  export type PracticeItemTechniqueMaxAggregateInputType = {
    practiceItemId?: true
    techniqueTagId?: true
    isPrimary?: true
  }

  export type PracticeItemTechniqueCountAggregateInputType = {
    practiceItemId?: true
    techniqueTagId?: true
    isPrimary?: true
    _all?: true
  }

  export type PracticeItemTechniqueAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticeItemTechnique to aggregate.
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItemTechniques to fetch.
     */
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PracticeItemTechniqueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItemTechniques from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItemTechniques.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PracticeItemTechniques
    **/
    _count?: true | PracticeItemTechniqueCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PracticeItemTechniqueMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PracticeItemTechniqueMaxAggregateInputType
  }

  export type GetPracticeItemTechniqueAggregateType<T extends PracticeItemTechniqueAggregateArgs> = {
        [P in keyof T & keyof AggregatePracticeItemTechnique]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePracticeItemTechnique[P]>
      : GetScalarType<T[P], AggregatePracticeItemTechnique[P]>
  }




  export type PracticeItemTechniqueGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticeItemTechniqueWhereInput
    orderBy?: PracticeItemTechniqueOrderByWithAggregationInput | PracticeItemTechniqueOrderByWithAggregationInput[]
    by: PracticeItemTechniqueScalarFieldEnum[] | PracticeItemTechniqueScalarFieldEnum
    having?: PracticeItemTechniqueScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PracticeItemTechniqueCountAggregateInputType | true
    _min?: PracticeItemTechniqueMinAggregateInputType
    _max?: PracticeItemTechniqueMaxAggregateInputType
  }

  export type PracticeItemTechniqueGroupByOutputType = {
    practiceItemId: string
    techniqueTagId: string
    isPrimary: boolean
    _count: PracticeItemTechniqueCountAggregateOutputType | null
    _min: PracticeItemTechniqueMinAggregateOutputType | null
    _max: PracticeItemTechniqueMaxAggregateOutputType | null
  }

  type GetPracticeItemTechniqueGroupByPayload<T extends PracticeItemTechniqueGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PracticeItemTechniqueGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PracticeItemTechniqueGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PracticeItemTechniqueGroupByOutputType[P]>
            : GetScalarType<T[P], PracticeItemTechniqueGroupByOutputType[P]>
        }
      >
    >


  export type PracticeItemTechniqueSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    practiceItemId?: boolean
    techniqueTagId?: boolean
    isPrimary?: boolean
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItemTechnique"]>

  export type PracticeItemTechniqueSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    practiceItemId?: boolean
    techniqueTagId?: boolean
    isPrimary?: boolean
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItemTechnique"]>

  export type PracticeItemTechniqueSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    practiceItemId?: boolean
    techniqueTagId?: boolean
    isPrimary?: boolean
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practiceItemTechnique"]>

  export type PracticeItemTechniqueSelectScalar = {
    practiceItemId?: boolean
    techniqueTagId?: boolean
    isPrimary?: boolean
  }

  export type PracticeItemTechniqueOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"practiceItemId" | "techniqueTagId" | "isPrimary", ExtArgs["result"]["practiceItemTechnique"]>
  export type PracticeItemTechniqueInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }
  export type PracticeItemTechniqueIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }
  export type PracticeItemTechniqueIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
    techniqueTag?: boolean | TechniqueTagDefaultArgs<ExtArgs>
  }

  export type $PracticeItemTechniquePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PracticeItemTechnique"
    objects: {
      practiceItem: Prisma.$PracticeItemPayload<ExtArgs>
      techniqueTag: Prisma.$TechniqueTagPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      practiceItemId: string
      techniqueTagId: string
      isPrimary: boolean
    }, ExtArgs["result"]["practiceItemTechnique"]>
    composites: {}
  }

  type PracticeItemTechniqueGetPayload<S extends boolean | null | undefined | PracticeItemTechniqueDefaultArgs> = $Result.GetResult<Prisma.$PracticeItemTechniquePayload, S>

  type PracticeItemTechniqueCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PracticeItemTechniqueFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PracticeItemTechniqueCountAggregateInputType | true
    }

  export interface PracticeItemTechniqueDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PracticeItemTechnique'], meta: { name: 'PracticeItemTechnique' } }
    /**
     * Find zero or one PracticeItemTechnique that matches the filter.
     * @param {PracticeItemTechniqueFindUniqueArgs} args - Arguments to find a PracticeItemTechnique
     * @example
     * // Get one PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PracticeItemTechniqueFindUniqueArgs>(args: SelectSubset<T, PracticeItemTechniqueFindUniqueArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PracticeItemTechnique that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PracticeItemTechniqueFindUniqueOrThrowArgs} args - Arguments to find a PracticeItemTechnique
     * @example
     * // Get one PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PracticeItemTechniqueFindUniqueOrThrowArgs>(args: SelectSubset<T, PracticeItemTechniqueFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticeItemTechnique that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueFindFirstArgs} args - Arguments to find a PracticeItemTechnique
     * @example
     * // Get one PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PracticeItemTechniqueFindFirstArgs>(args?: SelectSubset<T, PracticeItemTechniqueFindFirstArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticeItemTechnique that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueFindFirstOrThrowArgs} args - Arguments to find a PracticeItemTechnique
     * @example
     * // Get one PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PracticeItemTechniqueFindFirstOrThrowArgs>(args?: SelectSubset<T, PracticeItemTechniqueFindFirstOrThrowArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PracticeItemTechniques that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PracticeItemTechniques
     * const practiceItemTechniques = await prisma.practiceItemTechnique.findMany()
     * 
     * // Get first 10 PracticeItemTechniques
     * const practiceItemTechniques = await prisma.practiceItemTechnique.findMany({ take: 10 })
     * 
     * // Only select the `practiceItemId`
     * const practiceItemTechniqueWithPracticeItemIdOnly = await prisma.practiceItemTechnique.findMany({ select: { practiceItemId: true } })
     * 
     */
    findMany<T extends PracticeItemTechniqueFindManyArgs>(args?: SelectSubset<T, PracticeItemTechniqueFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PracticeItemTechnique.
     * @param {PracticeItemTechniqueCreateArgs} args - Arguments to create a PracticeItemTechnique.
     * @example
     * // Create one PracticeItemTechnique
     * const PracticeItemTechnique = await prisma.practiceItemTechnique.create({
     *   data: {
     *     // ... data to create a PracticeItemTechnique
     *   }
     * })
     * 
     */
    create<T extends PracticeItemTechniqueCreateArgs>(args: SelectSubset<T, PracticeItemTechniqueCreateArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PracticeItemTechniques.
     * @param {PracticeItemTechniqueCreateManyArgs} args - Arguments to create many PracticeItemTechniques.
     * @example
     * // Create many PracticeItemTechniques
     * const practiceItemTechnique = await prisma.practiceItemTechnique.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PracticeItemTechniqueCreateManyArgs>(args?: SelectSubset<T, PracticeItemTechniqueCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PracticeItemTechniques and returns the data saved in the database.
     * @param {PracticeItemTechniqueCreateManyAndReturnArgs} args - Arguments to create many PracticeItemTechniques.
     * @example
     * // Create many PracticeItemTechniques
     * const practiceItemTechnique = await prisma.practiceItemTechnique.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PracticeItemTechniques and only return the `practiceItemId`
     * const practiceItemTechniqueWithPracticeItemIdOnly = await prisma.practiceItemTechnique.createManyAndReturn({
     *   select: { practiceItemId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PracticeItemTechniqueCreateManyAndReturnArgs>(args?: SelectSubset<T, PracticeItemTechniqueCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PracticeItemTechnique.
     * @param {PracticeItemTechniqueDeleteArgs} args - Arguments to delete one PracticeItemTechnique.
     * @example
     * // Delete one PracticeItemTechnique
     * const PracticeItemTechnique = await prisma.practiceItemTechnique.delete({
     *   where: {
     *     // ... filter to delete one PracticeItemTechnique
     *   }
     * })
     * 
     */
    delete<T extends PracticeItemTechniqueDeleteArgs>(args: SelectSubset<T, PracticeItemTechniqueDeleteArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PracticeItemTechnique.
     * @param {PracticeItemTechniqueUpdateArgs} args - Arguments to update one PracticeItemTechnique.
     * @example
     * // Update one PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PracticeItemTechniqueUpdateArgs>(args: SelectSubset<T, PracticeItemTechniqueUpdateArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PracticeItemTechniques.
     * @param {PracticeItemTechniqueDeleteManyArgs} args - Arguments to filter PracticeItemTechniques to delete.
     * @example
     * // Delete a few PracticeItemTechniques
     * const { count } = await prisma.practiceItemTechnique.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PracticeItemTechniqueDeleteManyArgs>(args?: SelectSubset<T, PracticeItemTechniqueDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticeItemTechniques.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PracticeItemTechniques
     * const practiceItemTechnique = await prisma.practiceItemTechnique.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PracticeItemTechniqueUpdateManyArgs>(args: SelectSubset<T, PracticeItemTechniqueUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticeItemTechniques and returns the data updated in the database.
     * @param {PracticeItemTechniqueUpdateManyAndReturnArgs} args - Arguments to update many PracticeItemTechniques.
     * @example
     * // Update many PracticeItemTechniques
     * const practiceItemTechnique = await prisma.practiceItemTechnique.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PracticeItemTechniques and only return the `practiceItemId`
     * const practiceItemTechniqueWithPracticeItemIdOnly = await prisma.practiceItemTechnique.updateManyAndReturn({
     *   select: { practiceItemId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PracticeItemTechniqueUpdateManyAndReturnArgs>(args: SelectSubset<T, PracticeItemTechniqueUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PracticeItemTechnique.
     * @param {PracticeItemTechniqueUpsertArgs} args - Arguments to update or create a PracticeItemTechnique.
     * @example
     * // Update or create a PracticeItemTechnique
     * const practiceItemTechnique = await prisma.practiceItemTechnique.upsert({
     *   create: {
     *     // ... data to create a PracticeItemTechnique
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PracticeItemTechnique we want to update
     *   }
     * })
     */
    upsert<T extends PracticeItemTechniqueUpsertArgs>(args: SelectSubset<T, PracticeItemTechniqueUpsertArgs<ExtArgs>>): Prisma__PracticeItemTechniqueClient<$Result.GetResult<Prisma.$PracticeItemTechniquePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PracticeItemTechniques.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueCountArgs} args - Arguments to filter PracticeItemTechniques to count.
     * @example
     * // Count the number of PracticeItemTechniques
     * const count = await prisma.practiceItemTechnique.count({
     *   where: {
     *     // ... the filter for the PracticeItemTechniques we want to count
     *   }
     * })
    **/
    count<T extends PracticeItemTechniqueCountArgs>(
      args?: Subset<T, PracticeItemTechniqueCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PracticeItemTechniqueCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PracticeItemTechnique.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PracticeItemTechniqueAggregateArgs>(args: Subset<T, PracticeItemTechniqueAggregateArgs>): Prisma.PrismaPromise<GetPracticeItemTechniqueAggregateType<T>>

    /**
     * Group by PracticeItemTechnique.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticeItemTechniqueGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PracticeItemTechniqueGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PracticeItemTechniqueGroupByArgs['orderBy'] }
        : { orderBy?: PracticeItemTechniqueGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PracticeItemTechniqueGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPracticeItemTechniqueGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PracticeItemTechnique model
   */
  readonly fields: PracticeItemTechniqueFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PracticeItemTechnique.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PracticeItemTechniqueClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    practiceItem<T extends PracticeItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PracticeItemDefaultArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    techniqueTag<T extends TechniqueTagDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TechniqueTagDefaultArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PracticeItemTechnique model
   */
  interface PracticeItemTechniqueFieldRefs {
    readonly practiceItemId: FieldRef<"PracticeItemTechnique", 'String'>
    readonly techniqueTagId: FieldRef<"PracticeItemTechnique", 'String'>
    readonly isPrimary: FieldRef<"PracticeItemTechnique", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * PracticeItemTechnique findUnique
   */
  export type PracticeItemTechniqueFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItemTechnique to fetch.
     */
    where: PracticeItemTechniqueWhereUniqueInput
  }

  /**
   * PracticeItemTechnique findUniqueOrThrow
   */
  export type PracticeItemTechniqueFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItemTechnique to fetch.
     */
    where: PracticeItemTechniqueWhereUniqueInput
  }

  /**
   * PracticeItemTechnique findFirst
   */
  export type PracticeItemTechniqueFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItemTechnique to fetch.
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItemTechniques to fetch.
     */
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticeItemTechniques.
     */
    cursor?: PracticeItemTechniqueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItemTechniques from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItemTechniques.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticeItemTechniques.
     */
    distinct?: PracticeItemTechniqueScalarFieldEnum | PracticeItemTechniqueScalarFieldEnum[]
  }

  /**
   * PracticeItemTechnique findFirstOrThrow
   */
  export type PracticeItemTechniqueFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItemTechnique to fetch.
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItemTechniques to fetch.
     */
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticeItemTechniques.
     */
    cursor?: PracticeItemTechniqueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItemTechniques from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItemTechniques.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticeItemTechniques.
     */
    distinct?: PracticeItemTechniqueScalarFieldEnum | PracticeItemTechniqueScalarFieldEnum[]
  }

  /**
   * PracticeItemTechnique findMany
   */
  export type PracticeItemTechniqueFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter, which PracticeItemTechniques to fetch.
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticeItemTechniques to fetch.
     */
    orderBy?: PracticeItemTechniqueOrderByWithRelationInput | PracticeItemTechniqueOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PracticeItemTechniques.
     */
    cursor?: PracticeItemTechniqueWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticeItemTechniques from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticeItemTechniques.
     */
    skip?: number
    distinct?: PracticeItemTechniqueScalarFieldEnum | PracticeItemTechniqueScalarFieldEnum[]
  }

  /**
   * PracticeItemTechnique create
   */
  export type PracticeItemTechniqueCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * The data needed to create a PracticeItemTechnique.
     */
    data: XOR<PracticeItemTechniqueCreateInput, PracticeItemTechniqueUncheckedCreateInput>
  }

  /**
   * PracticeItemTechnique createMany
   */
  export type PracticeItemTechniqueCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PracticeItemTechniques.
     */
    data: PracticeItemTechniqueCreateManyInput | PracticeItemTechniqueCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PracticeItemTechnique createManyAndReturn
   */
  export type PracticeItemTechniqueCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * The data used to create many PracticeItemTechniques.
     */
    data: PracticeItemTechniqueCreateManyInput | PracticeItemTechniqueCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticeItemTechnique update
   */
  export type PracticeItemTechniqueUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * The data needed to update a PracticeItemTechnique.
     */
    data: XOR<PracticeItemTechniqueUpdateInput, PracticeItemTechniqueUncheckedUpdateInput>
    /**
     * Choose, which PracticeItemTechnique to update.
     */
    where: PracticeItemTechniqueWhereUniqueInput
  }

  /**
   * PracticeItemTechnique updateMany
   */
  export type PracticeItemTechniqueUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PracticeItemTechniques.
     */
    data: XOR<PracticeItemTechniqueUpdateManyMutationInput, PracticeItemTechniqueUncheckedUpdateManyInput>
    /**
     * Filter which PracticeItemTechniques to update
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * Limit how many PracticeItemTechniques to update.
     */
    limit?: number
  }

  /**
   * PracticeItemTechnique updateManyAndReturn
   */
  export type PracticeItemTechniqueUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * The data used to update PracticeItemTechniques.
     */
    data: XOR<PracticeItemTechniqueUpdateManyMutationInput, PracticeItemTechniqueUncheckedUpdateManyInput>
    /**
     * Filter which PracticeItemTechniques to update
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * Limit how many PracticeItemTechniques to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticeItemTechnique upsert
   */
  export type PracticeItemTechniqueUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * The filter to search for the PracticeItemTechnique to update in case it exists.
     */
    where: PracticeItemTechniqueWhereUniqueInput
    /**
     * In case the PracticeItemTechnique found by the `where` argument doesn't exist, create a new PracticeItemTechnique with this data.
     */
    create: XOR<PracticeItemTechniqueCreateInput, PracticeItemTechniqueUncheckedCreateInput>
    /**
     * In case the PracticeItemTechnique was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PracticeItemTechniqueUpdateInput, PracticeItemTechniqueUncheckedUpdateInput>
  }

  /**
   * PracticeItemTechnique delete
   */
  export type PracticeItemTechniqueDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
    /**
     * Filter which PracticeItemTechnique to delete.
     */
    where: PracticeItemTechniqueWhereUniqueInput
  }

  /**
   * PracticeItemTechnique deleteMany
   */
  export type PracticeItemTechniqueDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticeItemTechniques to delete
     */
    where?: PracticeItemTechniqueWhereInput
    /**
     * Limit how many PracticeItemTechniques to delete.
     */
    limit?: number
  }

  /**
   * PracticeItemTechnique without action
   */
  export type PracticeItemTechniqueDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticeItemTechnique
     */
    select?: PracticeItemTechniqueSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticeItemTechnique
     */
    omit?: PracticeItemTechniqueOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticeItemTechniqueInclude<ExtArgs> | null
  }


  /**
   * Model PracticePerformance
   */

  export type AggregatePracticePerformance = {
    _count: PracticePerformanceCountAggregateOutputType | null
    _avg: PracticePerformanceAvgAggregateOutputType | null
    _sum: PracticePerformanceSumAggregateOutputType | null
    _min: PracticePerformanceMinAggregateOutputType | null
    _max: PracticePerformanceMaxAggregateOutputType | null
  }

  export type PracticePerformanceAvgAggregateOutputType = {
    performanceDuration: number | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    retryCount: number | null
  }

  export type PracticePerformanceSumAggregateOutputType = {
    performanceDuration: number | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    retryCount: number | null
  }

  export type PracticePerformanceMinAggregateOutputType = {
    id: string | null
    userId: string | null
    practiceItemId: string | null
    audioPath: string | null
    comparisonResultPath: string | null
    performanceDuration: number | null
    uploadedAt: Date | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
  }

  export type PracticePerformanceMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    practiceItemId: string | null
    audioPath: string | null
    comparisonResultPath: string | null
    performanceDuration: number | null
    uploadedAt: Date | null
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisStatus: $Enums.JobStatus | null
    retryCount: number | null
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
  }

  export type PracticePerformanceCountAggregateOutputType = {
    id: number
    userId: number
    practiceItemId: number
    audioPath: number
    comparisonResultPath: number
    performanceDuration: number
    uploadedAt: number
    pitchAccuracy: number
    timingAccuracy: number
    overallScore: number
    evaluatedNotes: number
    analysisSummary: number
    analysisStatus: number
    retryCount: number
    errorMessage: number
    lastAttemptedAt: number
    executionId: number
    idempotencyKey: number
    _all: number
  }


  export type PracticePerformanceAvgAggregateInputType = {
    performanceDuration?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    retryCount?: true
  }

  export type PracticePerformanceSumAggregateInputType = {
    performanceDuration?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    retryCount?: true
  }

  export type PracticePerformanceMinAggregateInputType = {
    id?: true
    userId?: true
    practiceItemId?: true
    audioPath?: true
    comparisonResultPath?: true
    performanceDuration?: true
    uploadedAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
  }

  export type PracticePerformanceMaxAggregateInputType = {
    id?: true
    userId?: true
    practiceItemId?: true
    audioPath?: true
    comparisonResultPath?: true
    performanceDuration?: true
    uploadedAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
  }

  export type PracticePerformanceCountAggregateInputType = {
    id?: true
    userId?: true
    practiceItemId?: true
    audioPath?: true
    comparisonResultPath?: true
    performanceDuration?: true
    uploadedAt?: true
    pitchAccuracy?: true
    timingAccuracy?: true
    overallScore?: true
    evaluatedNotes?: true
    analysisSummary?: true
    analysisStatus?: true
    retryCount?: true
    errorMessage?: true
    lastAttemptedAt?: true
    executionId?: true
    idempotencyKey?: true
    _all?: true
  }

  export type PracticePerformanceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticePerformance to aggregate.
     */
    where?: PracticePerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticePerformances to fetch.
     */
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PracticePerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticePerformances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticePerformances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PracticePerformances
    **/
    _count?: true | PracticePerformanceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PracticePerformanceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PracticePerformanceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PracticePerformanceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PracticePerformanceMaxAggregateInputType
  }

  export type GetPracticePerformanceAggregateType<T extends PracticePerformanceAggregateArgs> = {
        [P in keyof T & keyof AggregatePracticePerformance]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePracticePerformance[P]>
      : GetScalarType<T[P], AggregatePracticePerformance[P]>
  }




  export type PracticePerformanceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PracticePerformanceWhereInput
    orderBy?: PracticePerformanceOrderByWithAggregationInput | PracticePerformanceOrderByWithAggregationInput[]
    by: PracticePerformanceScalarFieldEnum[] | PracticePerformanceScalarFieldEnum
    having?: PracticePerformanceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PracticePerformanceCountAggregateInputType | true
    _avg?: PracticePerformanceAvgAggregateInputType
    _sum?: PracticePerformanceSumAggregateInputType
    _min?: PracticePerformanceMinAggregateInputType
    _max?: PracticePerformanceMaxAggregateInputType
  }

  export type PracticePerformanceGroupByOutputType = {
    id: string
    userId: string
    practiceItemId: string
    audioPath: string
    comparisonResultPath: string | null
    performanceDuration: number | null
    uploadedAt: Date
    pitchAccuracy: number | null
    timingAccuracy: number | null
    overallScore: number | null
    evaluatedNotes: number | null
    analysisSummary: JsonValue | null
    analysisStatus: $Enums.JobStatus
    retryCount: number
    errorMessage: string | null
    lastAttemptedAt: Date | null
    executionId: string | null
    idempotencyKey: string | null
    _count: PracticePerformanceCountAggregateOutputType | null
    _avg: PracticePerformanceAvgAggregateOutputType | null
    _sum: PracticePerformanceSumAggregateOutputType | null
    _min: PracticePerformanceMinAggregateOutputType | null
    _max: PracticePerformanceMaxAggregateOutputType | null
  }

  type GetPracticePerformanceGroupByPayload<T extends PracticePerformanceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PracticePerformanceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PracticePerformanceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PracticePerformanceGroupByOutputType[P]>
            : GetScalarType<T[P], PracticePerformanceGroupByOutputType[P]>
        }
      >
    >


  export type PracticePerformanceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    practiceItemId?: boolean
    audioPath?: boolean
    comparisonResultPath?: boolean
    performanceDuration?: boolean
    uploadedAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practicePerformance"]>

  export type PracticePerformanceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    practiceItemId?: boolean
    audioPath?: boolean
    comparisonResultPath?: boolean
    performanceDuration?: boolean
    uploadedAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practicePerformance"]>

  export type PracticePerformanceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    practiceItemId?: boolean
    audioPath?: boolean
    comparisonResultPath?: boolean
    performanceDuration?: boolean
    uploadedAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["practicePerformance"]>

  export type PracticePerformanceSelectScalar = {
    id?: boolean
    userId?: boolean
    practiceItemId?: boolean
    audioPath?: boolean
    comparisonResultPath?: boolean
    performanceDuration?: boolean
    uploadedAt?: boolean
    pitchAccuracy?: boolean
    timingAccuracy?: boolean
    overallScore?: boolean
    evaluatedNotes?: boolean
    analysisSummary?: boolean
    analysisStatus?: boolean
    retryCount?: boolean
    errorMessage?: boolean
    lastAttemptedAt?: boolean
    executionId?: boolean
    idempotencyKey?: boolean
  }

  export type PracticePerformanceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "practiceItemId" | "audioPath" | "comparisonResultPath" | "performanceDuration" | "uploadedAt" | "pitchAccuracy" | "timingAccuracy" | "overallScore" | "evaluatedNotes" | "analysisSummary" | "analysisStatus" | "retryCount" | "errorMessage" | "lastAttemptedAt" | "executionId" | "idempotencyKey", ExtArgs["result"]["practicePerformance"]>
  export type PracticePerformanceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }
  export type PracticePerformanceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }
  export type PracticePerformanceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    practiceItem?: boolean | PracticeItemDefaultArgs<ExtArgs>
  }

  export type $PracticePerformancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PracticePerformance"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      practiceItem: Prisma.$PracticeItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      practiceItemId: string
      audioPath: string
      comparisonResultPath: string | null
      performanceDuration: number | null
      uploadedAt: Date
      pitchAccuracy: number | null
      timingAccuracy: number | null
      overallScore: number | null
      evaluatedNotes: number | null
      analysisSummary: Prisma.JsonValue | null
      analysisStatus: $Enums.JobStatus
      retryCount: number
      errorMessage: string | null
      lastAttemptedAt: Date | null
      executionId: string | null
      idempotencyKey: string | null
    }, ExtArgs["result"]["practicePerformance"]>
    composites: {}
  }

  type PracticePerformanceGetPayload<S extends boolean | null | undefined | PracticePerformanceDefaultArgs> = $Result.GetResult<Prisma.$PracticePerformancePayload, S>

  type PracticePerformanceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PracticePerformanceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PracticePerformanceCountAggregateInputType | true
    }

  export interface PracticePerformanceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PracticePerformance'], meta: { name: 'PracticePerformance' } }
    /**
     * Find zero or one PracticePerformance that matches the filter.
     * @param {PracticePerformanceFindUniqueArgs} args - Arguments to find a PracticePerformance
     * @example
     * // Get one PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PracticePerformanceFindUniqueArgs>(args: SelectSubset<T, PracticePerformanceFindUniqueArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PracticePerformance that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PracticePerformanceFindUniqueOrThrowArgs} args - Arguments to find a PracticePerformance
     * @example
     * // Get one PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PracticePerformanceFindUniqueOrThrowArgs>(args: SelectSubset<T, PracticePerformanceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticePerformance that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceFindFirstArgs} args - Arguments to find a PracticePerformance
     * @example
     * // Get one PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PracticePerformanceFindFirstArgs>(args?: SelectSubset<T, PracticePerformanceFindFirstArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PracticePerformance that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceFindFirstOrThrowArgs} args - Arguments to find a PracticePerformance
     * @example
     * // Get one PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PracticePerformanceFindFirstOrThrowArgs>(args?: SelectSubset<T, PracticePerformanceFindFirstOrThrowArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PracticePerformances that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PracticePerformances
     * const practicePerformances = await prisma.practicePerformance.findMany()
     * 
     * // Get first 10 PracticePerformances
     * const practicePerformances = await prisma.practicePerformance.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const practicePerformanceWithIdOnly = await prisma.practicePerformance.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PracticePerformanceFindManyArgs>(args?: SelectSubset<T, PracticePerformanceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PracticePerformance.
     * @param {PracticePerformanceCreateArgs} args - Arguments to create a PracticePerformance.
     * @example
     * // Create one PracticePerformance
     * const PracticePerformance = await prisma.practicePerformance.create({
     *   data: {
     *     // ... data to create a PracticePerformance
     *   }
     * })
     * 
     */
    create<T extends PracticePerformanceCreateArgs>(args: SelectSubset<T, PracticePerformanceCreateArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PracticePerformances.
     * @param {PracticePerformanceCreateManyArgs} args - Arguments to create many PracticePerformances.
     * @example
     * // Create many PracticePerformances
     * const practicePerformance = await prisma.practicePerformance.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PracticePerformanceCreateManyArgs>(args?: SelectSubset<T, PracticePerformanceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PracticePerformances and returns the data saved in the database.
     * @param {PracticePerformanceCreateManyAndReturnArgs} args - Arguments to create many PracticePerformances.
     * @example
     * // Create many PracticePerformances
     * const practicePerformance = await prisma.practicePerformance.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PracticePerformances and only return the `id`
     * const practicePerformanceWithIdOnly = await prisma.practicePerformance.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PracticePerformanceCreateManyAndReturnArgs>(args?: SelectSubset<T, PracticePerformanceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PracticePerformance.
     * @param {PracticePerformanceDeleteArgs} args - Arguments to delete one PracticePerformance.
     * @example
     * // Delete one PracticePerformance
     * const PracticePerformance = await prisma.practicePerformance.delete({
     *   where: {
     *     // ... filter to delete one PracticePerformance
     *   }
     * })
     * 
     */
    delete<T extends PracticePerformanceDeleteArgs>(args: SelectSubset<T, PracticePerformanceDeleteArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PracticePerformance.
     * @param {PracticePerformanceUpdateArgs} args - Arguments to update one PracticePerformance.
     * @example
     * // Update one PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PracticePerformanceUpdateArgs>(args: SelectSubset<T, PracticePerformanceUpdateArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PracticePerformances.
     * @param {PracticePerformanceDeleteManyArgs} args - Arguments to filter PracticePerformances to delete.
     * @example
     * // Delete a few PracticePerformances
     * const { count } = await prisma.practicePerformance.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PracticePerformanceDeleteManyArgs>(args?: SelectSubset<T, PracticePerformanceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticePerformances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PracticePerformances
     * const practicePerformance = await prisma.practicePerformance.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PracticePerformanceUpdateManyArgs>(args: SelectSubset<T, PracticePerformanceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PracticePerformances and returns the data updated in the database.
     * @param {PracticePerformanceUpdateManyAndReturnArgs} args - Arguments to update many PracticePerformances.
     * @example
     * // Update many PracticePerformances
     * const practicePerformance = await prisma.practicePerformance.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PracticePerformances and only return the `id`
     * const practicePerformanceWithIdOnly = await prisma.practicePerformance.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PracticePerformanceUpdateManyAndReturnArgs>(args: SelectSubset<T, PracticePerformanceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PracticePerformance.
     * @param {PracticePerformanceUpsertArgs} args - Arguments to update or create a PracticePerformance.
     * @example
     * // Update or create a PracticePerformance
     * const practicePerformance = await prisma.practicePerformance.upsert({
     *   create: {
     *     // ... data to create a PracticePerformance
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PracticePerformance we want to update
     *   }
     * })
     */
    upsert<T extends PracticePerformanceUpsertArgs>(args: SelectSubset<T, PracticePerformanceUpsertArgs<ExtArgs>>): Prisma__PracticePerformanceClient<$Result.GetResult<Prisma.$PracticePerformancePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PracticePerformances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceCountArgs} args - Arguments to filter PracticePerformances to count.
     * @example
     * // Count the number of PracticePerformances
     * const count = await prisma.practicePerformance.count({
     *   where: {
     *     // ... the filter for the PracticePerformances we want to count
     *   }
     * })
    **/
    count<T extends PracticePerformanceCountArgs>(
      args?: Subset<T, PracticePerformanceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PracticePerformanceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PracticePerformance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PracticePerformanceAggregateArgs>(args: Subset<T, PracticePerformanceAggregateArgs>): Prisma.PrismaPromise<GetPracticePerformanceAggregateType<T>>

    /**
     * Group by PracticePerformance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PracticePerformanceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PracticePerformanceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PracticePerformanceGroupByArgs['orderBy'] }
        : { orderBy?: PracticePerformanceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PracticePerformanceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPracticePerformanceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PracticePerformance model
   */
  readonly fields: PracticePerformanceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PracticePerformance.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PracticePerformanceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    practiceItem<T extends PracticeItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PracticeItemDefaultArgs<ExtArgs>>): Prisma__PracticeItemClient<$Result.GetResult<Prisma.$PracticeItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PracticePerformance model
   */
  interface PracticePerformanceFieldRefs {
    readonly id: FieldRef<"PracticePerformance", 'String'>
    readonly userId: FieldRef<"PracticePerformance", 'String'>
    readonly practiceItemId: FieldRef<"PracticePerformance", 'String'>
    readonly audioPath: FieldRef<"PracticePerformance", 'String'>
    readonly comparisonResultPath: FieldRef<"PracticePerformance", 'String'>
    readonly performanceDuration: FieldRef<"PracticePerformance", 'Float'>
    readonly uploadedAt: FieldRef<"PracticePerformance", 'DateTime'>
    readonly pitchAccuracy: FieldRef<"PracticePerformance", 'Float'>
    readonly timingAccuracy: FieldRef<"PracticePerformance", 'Float'>
    readonly overallScore: FieldRef<"PracticePerformance", 'Float'>
    readonly evaluatedNotes: FieldRef<"PracticePerformance", 'Int'>
    readonly analysisSummary: FieldRef<"PracticePerformance", 'Json'>
    readonly analysisStatus: FieldRef<"PracticePerformance", 'JobStatus'>
    readonly retryCount: FieldRef<"PracticePerformance", 'Int'>
    readonly errorMessage: FieldRef<"PracticePerformance", 'String'>
    readonly lastAttemptedAt: FieldRef<"PracticePerformance", 'DateTime'>
    readonly executionId: FieldRef<"PracticePerformance", 'String'>
    readonly idempotencyKey: FieldRef<"PracticePerformance", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PracticePerformance findUnique
   */
  export type PracticePerformanceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter, which PracticePerformance to fetch.
     */
    where: PracticePerformanceWhereUniqueInput
  }

  /**
   * PracticePerformance findUniqueOrThrow
   */
  export type PracticePerformanceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter, which PracticePerformance to fetch.
     */
    where: PracticePerformanceWhereUniqueInput
  }

  /**
   * PracticePerformance findFirst
   */
  export type PracticePerformanceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter, which PracticePerformance to fetch.
     */
    where?: PracticePerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticePerformances to fetch.
     */
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticePerformances.
     */
    cursor?: PracticePerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticePerformances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticePerformances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticePerformances.
     */
    distinct?: PracticePerformanceScalarFieldEnum | PracticePerformanceScalarFieldEnum[]
  }

  /**
   * PracticePerformance findFirstOrThrow
   */
  export type PracticePerformanceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter, which PracticePerformance to fetch.
     */
    where?: PracticePerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticePerformances to fetch.
     */
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PracticePerformances.
     */
    cursor?: PracticePerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticePerformances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticePerformances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PracticePerformances.
     */
    distinct?: PracticePerformanceScalarFieldEnum | PracticePerformanceScalarFieldEnum[]
  }

  /**
   * PracticePerformance findMany
   */
  export type PracticePerformanceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter, which PracticePerformances to fetch.
     */
    where?: PracticePerformanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PracticePerformances to fetch.
     */
    orderBy?: PracticePerformanceOrderByWithRelationInput | PracticePerformanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PracticePerformances.
     */
    cursor?: PracticePerformanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PracticePerformances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PracticePerformances.
     */
    skip?: number
    distinct?: PracticePerformanceScalarFieldEnum | PracticePerformanceScalarFieldEnum[]
  }

  /**
   * PracticePerformance create
   */
  export type PracticePerformanceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * The data needed to create a PracticePerformance.
     */
    data: XOR<PracticePerformanceCreateInput, PracticePerformanceUncheckedCreateInput>
  }

  /**
   * PracticePerformance createMany
   */
  export type PracticePerformanceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PracticePerformances.
     */
    data: PracticePerformanceCreateManyInput | PracticePerformanceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PracticePerformance createManyAndReturn
   */
  export type PracticePerformanceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * The data used to create many PracticePerformances.
     */
    data: PracticePerformanceCreateManyInput | PracticePerformanceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticePerformance update
   */
  export type PracticePerformanceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * The data needed to update a PracticePerformance.
     */
    data: XOR<PracticePerformanceUpdateInput, PracticePerformanceUncheckedUpdateInput>
    /**
     * Choose, which PracticePerformance to update.
     */
    where: PracticePerformanceWhereUniqueInput
  }

  /**
   * PracticePerformance updateMany
   */
  export type PracticePerformanceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PracticePerformances.
     */
    data: XOR<PracticePerformanceUpdateManyMutationInput, PracticePerformanceUncheckedUpdateManyInput>
    /**
     * Filter which PracticePerformances to update
     */
    where?: PracticePerformanceWhereInput
    /**
     * Limit how many PracticePerformances to update.
     */
    limit?: number
  }

  /**
   * PracticePerformance updateManyAndReturn
   */
  export type PracticePerformanceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * The data used to update PracticePerformances.
     */
    data: XOR<PracticePerformanceUpdateManyMutationInput, PracticePerformanceUncheckedUpdateManyInput>
    /**
     * Filter which PracticePerformances to update
     */
    where?: PracticePerformanceWhereInput
    /**
     * Limit how many PracticePerformances to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PracticePerformance upsert
   */
  export type PracticePerformanceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * The filter to search for the PracticePerformance to update in case it exists.
     */
    where: PracticePerformanceWhereUniqueInput
    /**
     * In case the PracticePerformance found by the `where` argument doesn't exist, create a new PracticePerformance with this data.
     */
    create: XOR<PracticePerformanceCreateInput, PracticePerformanceUncheckedCreateInput>
    /**
     * In case the PracticePerformance was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PracticePerformanceUpdateInput, PracticePerformanceUncheckedUpdateInput>
  }

  /**
   * PracticePerformance delete
   */
  export type PracticePerformanceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
    /**
     * Filter which PracticePerformance to delete.
     */
    where: PracticePerformanceWhereUniqueInput
  }

  /**
   * PracticePerformance deleteMany
   */
  export type PracticePerformanceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PracticePerformances to delete
     */
    where?: PracticePerformanceWhereInput
    /**
     * Limit how many PracticePerformances to delete.
     */
    limit?: number
  }

  /**
   * PracticePerformance without action
   */
  export type PracticePerformanceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PracticePerformance
     */
    select?: PracticePerformanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PracticePerformance
     */
    omit?: PracticePerformanceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PracticePerformanceInclude<ExtArgs> | null
  }


  /**
   * Model UserWeakness
   */

  export type AggregateUserWeakness = {
    _count: UserWeaknessCountAggregateOutputType | null
    _avg: UserWeaknessAvgAggregateOutputType | null
    _sum: UserWeaknessSumAggregateOutputType | null
    _min: UserWeaknessMinAggregateOutputType | null
    _max: UserWeaknessMaxAggregateOutputType | null
  }

  export type UserWeaknessAvgAggregateOutputType = {
    severity: number | null
    sampleCount: number | null
  }

  export type UserWeaknessSumAggregateOutputType = {
    severity: number | null
    sampleCount: number | null
  }

  export type UserWeaknessMinAggregateOutputType = {
    id: string | null
    userId: string | null
    weaknessType: string | null
    weaknessKey: string | null
    techniqueTagId: string | null
    severity: number | null
    sampleCount: number | null
    lastUpdated: Date | null
  }

  export type UserWeaknessMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    weaknessType: string | null
    weaknessKey: string | null
    techniqueTagId: string | null
    severity: number | null
    sampleCount: number | null
    lastUpdated: Date | null
  }

  export type UserWeaknessCountAggregateOutputType = {
    id: number
    userId: number
    weaknessType: number
    weaknessKey: number
    techniqueTagId: number
    severity: number
    sampleCount: number
    lastUpdated: number
    _all: number
  }


  export type UserWeaknessAvgAggregateInputType = {
    severity?: true
    sampleCount?: true
  }

  export type UserWeaknessSumAggregateInputType = {
    severity?: true
    sampleCount?: true
  }

  export type UserWeaknessMinAggregateInputType = {
    id?: true
    userId?: true
    weaknessType?: true
    weaknessKey?: true
    techniqueTagId?: true
    severity?: true
    sampleCount?: true
    lastUpdated?: true
  }

  export type UserWeaknessMaxAggregateInputType = {
    id?: true
    userId?: true
    weaknessType?: true
    weaknessKey?: true
    techniqueTagId?: true
    severity?: true
    sampleCount?: true
    lastUpdated?: true
  }

  export type UserWeaknessCountAggregateInputType = {
    id?: true
    userId?: true
    weaknessType?: true
    weaknessKey?: true
    techniqueTagId?: true
    severity?: true
    sampleCount?: true
    lastUpdated?: true
    _all?: true
  }

  export type UserWeaknessAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserWeakness to aggregate.
     */
    where?: UserWeaknessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeaknesses to fetch.
     */
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWeaknessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeaknesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeaknesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserWeaknesses
    **/
    _count?: true | UserWeaknessCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserWeaknessAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserWeaknessSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserWeaknessMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserWeaknessMaxAggregateInputType
  }

  export type GetUserWeaknessAggregateType<T extends UserWeaknessAggregateArgs> = {
        [P in keyof T & keyof AggregateUserWeakness]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserWeakness[P]>
      : GetScalarType<T[P], AggregateUserWeakness[P]>
  }




  export type UserWeaknessGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWeaknessWhereInput
    orderBy?: UserWeaknessOrderByWithAggregationInput | UserWeaknessOrderByWithAggregationInput[]
    by: UserWeaknessScalarFieldEnum[] | UserWeaknessScalarFieldEnum
    having?: UserWeaknessScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserWeaknessCountAggregateInputType | true
    _avg?: UserWeaknessAvgAggregateInputType
    _sum?: UserWeaknessSumAggregateInputType
    _min?: UserWeaknessMinAggregateInputType
    _max?: UserWeaknessMaxAggregateInputType
  }

  export type UserWeaknessGroupByOutputType = {
    id: string
    userId: string
    weaknessType: string
    weaknessKey: string
    techniqueTagId: string | null
    severity: number
    sampleCount: number
    lastUpdated: Date
    _count: UserWeaknessCountAggregateOutputType | null
    _avg: UserWeaknessAvgAggregateOutputType | null
    _sum: UserWeaknessSumAggregateOutputType | null
    _min: UserWeaknessMinAggregateOutputType | null
    _max: UserWeaknessMaxAggregateOutputType | null
  }

  type GetUserWeaknessGroupByPayload<T extends UserWeaknessGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserWeaknessGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserWeaknessGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserWeaknessGroupByOutputType[P]>
            : GetScalarType<T[P], UserWeaknessGroupByOutputType[P]>
        }
      >
    >


  export type UserWeaknessSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    weaknessType?: boolean
    weaknessKey?: boolean
    techniqueTagId?: boolean
    severity?: boolean
    sampleCount?: boolean
    lastUpdated?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }, ExtArgs["result"]["userWeakness"]>

  export type UserWeaknessSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    weaknessType?: boolean
    weaknessKey?: boolean
    techniqueTagId?: boolean
    severity?: boolean
    sampleCount?: boolean
    lastUpdated?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }, ExtArgs["result"]["userWeakness"]>

  export type UserWeaknessSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    weaknessType?: boolean
    weaknessKey?: boolean
    techniqueTagId?: boolean
    severity?: boolean
    sampleCount?: boolean
    lastUpdated?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }, ExtArgs["result"]["userWeakness"]>

  export type UserWeaknessSelectScalar = {
    id?: boolean
    userId?: boolean
    weaknessType?: boolean
    weaknessKey?: boolean
    techniqueTagId?: boolean
    severity?: boolean
    sampleCount?: boolean
    lastUpdated?: boolean
  }

  export type UserWeaknessOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "weaknessType" | "weaknessKey" | "techniqueTagId" | "severity" | "sampleCount" | "lastUpdated", ExtArgs["result"]["userWeakness"]>
  export type UserWeaknessInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }
  export type UserWeaknessIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }
  export type UserWeaknessIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    techniqueTag?: boolean | UserWeakness$techniqueTagArgs<ExtArgs>
  }

  export type $UserWeaknessPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserWeakness"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      techniqueTag: Prisma.$TechniqueTagPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      weaknessType: string
      weaknessKey: string
      techniqueTagId: string | null
      severity: number
      sampleCount: number
      lastUpdated: Date
    }, ExtArgs["result"]["userWeakness"]>
    composites: {}
  }

  type UserWeaknessGetPayload<S extends boolean | null | undefined | UserWeaknessDefaultArgs> = $Result.GetResult<Prisma.$UserWeaknessPayload, S>

  type UserWeaknessCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserWeaknessFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserWeaknessCountAggregateInputType | true
    }

  export interface UserWeaknessDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserWeakness'], meta: { name: 'UserWeakness' } }
    /**
     * Find zero or one UserWeakness that matches the filter.
     * @param {UserWeaknessFindUniqueArgs} args - Arguments to find a UserWeakness
     * @example
     * // Get one UserWeakness
     * const userWeakness = await prisma.userWeakness.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserWeaknessFindUniqueArgs>(args: SelectSubset<T, UserWeaknessFindUniqueArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserWeakness that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserWeaknessFindUniqueOrThrowArgs} args - Arguments to find a UserWeakness
     * @example
     * // Get one UserWeakness
     * const userWeakness = await prisma.userWeakness.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserWeaknessFindUniqueOrThrowArgs>(args: SelectSubset<T, UserWeaknessFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserWeakness that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessFindFirstArgs} args - Arguments to find a UserWeakness
     * @example
     * // Get one UserWeakness
     * const userWeakness = await prisma.userWeakness.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserWeaknessFindFirstArgs>(args?: SelectSubset<T, UserWeaknessFindFirstArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserWeakness that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessFindFirstOrThrowArgs} args - Arguments to find a UserWeakness
     * @example
     * // Get one UserWeakness
     * const userWeakness = await prisma.userWeakness.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserWeaknessFindFirstOrThrowArgs>(args?: SelectSubset<T, UserWeaknessFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserWeaknesses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserWeaknesses
     * const userWeaknesses = await prisma.userWeakness.findMany()
     * 
     * // Get first 10 UserWeaknesses
     * const userWeaknesses = await prisma.userWeakness.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWeaknessWithIdOnly = await prisma.userWeakness.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserWeaknessFindManyArgs>(args?: SelectSubset<T, UserWeaknessFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserWeakness.
     * @param {UserWeaknessCreateArgs} args - Arguments to create a UserWeakness.
     * @example
     * // Create one UserWeakness
     * const UserWeakness = await prisma.userWeakness.create({
     *   data: {
     *     // ... data to create a UserWeakness
     *   }
     * })
     * 
     */
    create<T extends UserWeaknessCreateArgs>(args: SelectSubset<T, UserWeaknessCreateArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserWeaknesses.
     * @param {UserWeaknessCreateManyArgs} args - Arguments to create many UserWeaknesses.
     * @example
     * // Create many UserWeaknesses
     * const userWeakness = await prisma.userWeakness.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserWeaknessCreateManyArgs>(args?: SelectSubset<T, UserWeaknessCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserWeaknesses and returns the data saved in the database.
     * @param {UserWeaknessCreateManyAndReturnArgs} args - Arguments to create many UserWeaknesses.
     * @example
     * // Create many UserWeaknesses
     * const userWeakness = await prisma.userWeakness.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserWeaknesses and only return the `id`
     * const userWeaknessWithIdOnly = await prisma.userWeakness.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserWeaknessCreateManyAndReturnArgs>(args?: SelectSubset<T, UserWeaknessCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserWeakness.
     * @param {UserWeaknessDeleteArgs} args - Arguments to delete one UserWeakness.
     * @example
     * // Delete one UserWeakness
     * const UserWeakness = await prisma.userWeakness.delete({
     *   where: {
     *     // ... filter to delete one UserWeakness
     *   }
     * })
     * 
     */
    delete<T extends UserWeaknessDeleteArgs>(args: SelectSubset<T, UserWeaknessDeleteArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserWeakness.
     * @param {UserWeaknessUpdateArgs} args - Arguments to update one UserWeakness.
     * @example
     * // Update one UserWeakness
     * const userWeakness = await prisma.userWeakness.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserWeaknessUpdateArgs>(args: SelectSubset<T, UserWeaknessUpdateArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserWeaknesses.
     * @param {UserWeaknessDeleteManyArgs} args - Arguments to filter UserWeaknesses to delete.
     * @example
     * // Delete a few UserWeaknesses
     * const { count } = await prisma.userWeakness.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserWeaknessDeleteManyArgs>(args?: SelectSubset<T, UserWeaknessDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserWeaknesses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserWeaknesses
     * const userWeakness = await prisma.userWeakness.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserWeaknessUpdateManyArgs>(args: SelectSubset<T, UserWeaknessUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserWeaknesses and returns the data updated in the database.
     * @param {UserWeaknessUpdateManyAndReturnArgs} args - Arguments to update many UserWeaknesses.
     * @example
     * // Update many UserWeaknesses
     * const userWeakness = await prisma.userWeakness.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserWeaknesses and only return the `id`
     * const userWeaknessWithIdOnly = await prisma.userWeakness.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserWeaknessUpdateManyAndReturnArgs>(args: SelectSubset<T, UserWeaknessUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserWeakness.
     * @param {UserWeaknessUpsertArgs} args - Arguments to update or create a UserWeakness.
     * @example
     * // Update or create a UserWeakness
     * const userWeakness = await prisma.userWeakness.upsert({
     *   create: {
     *     // ... data to create a UserWeakness
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserWeakness we want to update
     *   }
     * })
     */
    upsert<T extends UserWeaknessUpsertArgs>(args: SelectSubset<T, UserWeaknessUpsertArgs<ExtArgs>>): Prisma__UserWeaknessClient<$Result.GetResult<Prisma.$UserWeaknessPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserWeaknesses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessCountArgs} args - Arguments to filter UserWeaknesses to count.
     * @example
     * // Count the number of UserWeaknesses
     * const count = await prisma.userWeakness.count({
     *   where: {
     *     // ... the filter for the UserWeaknesses we want to count
     *   }
     * })
    **/
    count<T extends UserWeaknessCountArgs>(
      args?: Subset<T, UserWeaknessCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserWeaknessCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserWeakness.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserWeaknessAggregateArgs>(args: Subset<T, UserWeaknessAggregateArgs>): Prisma.PrismaPromise<GetUserWeaknessAggregateType<T>>

    /**
     * Group by UserWeakness.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserWeaknessGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserWeaknessGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserWeaknessGroupByArgs['orderBy'] }
        : { orderBy?: UserWeaknessGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserWeaknessGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserWeaknessGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserWeakness model
   */
  readonly fields: UserWeaknessFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserWeakness.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserWeaknessClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    techniqueTag<T extends UserWeakness$techniqueTagArgs<ExtArgs> = {}>(args?: Subset<T, UserWeakness$techniqueTagArgs<ExtArgs>>): Prisma__TechniqueTagClient<$Result.GetResult<Prisma.$TechniqueTagPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserWeakness model
   */
  interface UserWeaknessFieldRefs {
    readonly id: FieldRef<"UserWeakness", 'String'>
    readonly userId: FieldRef<"UserWeakness", 'String'>
    readonly weaknessType: FieldRef<"UserWeakness", 'String'>
    readonly weaknessKey: FieldRef<"UserWeakness", 'String'>
    readonly techniqueTagId: FieldRef<"UserWeakness", 'String'>
    readonly severity: FieldRef<"UserWeakness", 'Float'>
    readonly sampleCount: FieldRef<"UserWeakness", 'Int'>
    readonly lastUpdated: FieldRef<"UserWeakness", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserWeakness findUnique
   */
  export type UserWeaknessFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter, which UserWeakness to fetch.
     */
    where: UserWeaknessWhereUniqueInput
  }

  /**
   * UserWeakness findUniqueOrThrow
   */
  export type UserWeaknessFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter, which UserWeakness to fetch.
     */
    where: UserWeaknessWhereUniqueInput
  }

  /**
   * UserWeakness findFirst
   */
  export type UserWeaknessFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter, which UserWeakness to fetch.
     */
    where?: UserWeaknessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeaknesses to fetch.
     */
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserWeaknesses.
     */
    cursor?: UserWeaknessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeaknesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeaknesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserWeaknesses.
     */
    distinct?: UserWeaknessScalarFieldEnum | UserWeaknessScalarFieldEnum[]
  }

  /**
   * UserWeakness findFirstOrThrow
   */
  export type UserWeaknessFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter, which UserWeakness to fetch.
     */
    where?: UserWeaknessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeaknesses to fetch.
     */
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserWeaknesses.
     */
    cursor?: UserWeaknessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeaknesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeaknesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserWeaknesses.
     */
    distinct?: UserWeaknessScalarFieldEnum | UserWeaknessScalarFieldEnum[]
  }

  /**
   * UserWeakness findMany
   */
  export type UserWeaknessFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter, which UserWeaknesses to fetch.
     */
    where?: UserWeaknessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserWeaknesses to fetch.
     */
    orderBy?: UserWeaknessOrderByWithRelationInput | UserWeaknessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserWeaknesses.
     */
    cursor?: UserWeaknessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserWeaknesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserWeaknesses.
     */
    skip?: number
    distinct?: UserWeaknessScalarFieldEnum | UserWeaknessScalarFieldEnum[]
  }

  /**
   * UserWeakness create
   */
  export type UserWeaknessCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * The data needed to create a UserWeakness.
     */
    data: XOR<UserWeaknessCreateInput, UserWeaknessUncheckedCreateInput>
  }

  /**
   * UserWeakness createMany
   */
  export type UserWeaknessCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserWeaknesses.
     */
    data: UserWeaknessCreateManyInput | UserWeaknessCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserWeakness createManyAndReturn
   */
  export type UserWeaknessCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * The data used to create many UserWeaknesses.
     */
    data: UserWeaknessCreateManyInput | UserWeaknessCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserWeakness update
   */
  export type UserWeaknessUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * The data needed to update a UserWeakness.
     */
    data: XOR<UserWeaknessUpdateInput, UserWeaknessUncheckedUpdateInput>
    /**
     * Choose, which UserWeakness to update.
     */
    where: UserWeaknessWhereUniqueInput
  }

  /**
   * UserWeakness updateMany
   */
  export type UserWeaknessUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserWeaknesses.
     */
    data: XOR<UserWeaknessUpdateManyMutationInput, UserWeaknessUncheckedUpdateManyInput>
    /**
     * Filter which UserWeaknesses to update
     */
    where?: UserWeaknessWhereInput
    /**
     * Limit how many UserWeaknesses to update.
     */
    limit?: number
  }

  /**
   * UserWeakness updateManyAndReturn
   */
  export type UserWeaknessUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * The data used to update UserWeaknesses.
     */
    data: XOR<UserWeaknessUpdateManyMutationInput, UserWeaknessUncheckedUpdateManyInput>
    /**
     * Filter which UserWeaknesses to update
     */
    where?: UserWeaknessWhereInput
    /**
     * Limit how many UserWeaknesses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserWeakness upsert
   */
  export type UserWeaknessUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * The filter to search for the UserWeakness to update in case it exists.
     */
    where: UserWeaknessWhereUniqueInput
    /**
     * In case the UserWeakness found by the `where` argument doesn't exist, create a new UserWeakness with this data.
     */
    create: XOR<UserWeaknessCreateInput, UserWeaknessUncheckedCreateInput>
    /**
     * In case the UserWeakness was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserWeaknessUpdateInput, UserWeaknessUncheckedUpdateInput>
  }

  /**
   * UserWeakness delete
   */
  export type UserWeaknessDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
    /**
     * Filter which UserWeakness to delete.
     */
    where: UserWeaknessWhereUniqueInput
  }

  /**
   * UserWeakness deleteMany
   */
  export type UserWeaknessDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserWeaknesses to delete
     */
    where?: UserWeaknessWhereInput
    /**
     * Limit how many UserWeaknesses to delete.
     */
    limit?: number
  }

  /**
   * UserWeakness.techniqueTag
   */
  export type UserWeakness$techniqueTagArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TechniqueTag
     */
    select?: TechniqueTagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TechniqueTag
     */
    omit?: TechniqueTagOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TechniqueTagInclude<ExtArgs> | null
    where?: TechniqueTagWhereInput
  }

  /**
   * UserWeakness without action
   */
  export type UserWeaknessDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserWeakness
     */
    select?: UserWeaknessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserWeakness
     */
    omit?: UserWeaknessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserWeaknessInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    supabaseUserId: 'supabaseUserId',
    name: 'name',
    role: 'role',
    plan: 'plan',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ScoreScalarFieldEnum: {
    id: 'id',
    createdById: 'createdById',
    title: 'title',
    composer: 'composer',
    arranger: 'arranger',
    originalXmlPath: 'originalXmlPath',
    generatedXmlPath: 'generatedXmlPath',
    analysisStatus: 'analysisStatus',
    buildStatus: 'buildStatus',
    retryCount: 'retryCount',
    errorMessage: 'errorMessage',
    lastAttemptedAt: 'lastAttemptedAt',
    executionId: 'executionId',
    idempotencyKey: 'idempotencyKey',
    keyTonic: 'keyTonic',
    keyMode: 'keyMode',
    timeNumerator: 'timeNumerator',
    timeDenominator: 'timeDenominator',
    defaultTempo: 'defaultTempo',
    isShared: 'isShared',
    createdAt: 'createdAt'
  };

  export type ScoreScalarFieldEnum = (typeof ScoreScalarFieldEnum)[keyof typeof ScoreScalarFieldEnum]


  export const PerformanceScalarFieldEnum: {
    id: 'id',
    performanceType: 'performanceType',
    performanceStatus: 'performanceStatus',
    userId: 'userId',
    scoreId: 'scoreId',
    audioPath: 'audioPath',
    audioFeaturesPath: 'audioFeaturesPath',
    comparisonResultPath: 'comparisonResultPath',
    pseudoXmlPath: 'pseudoXmlPath',
    performanceDuration: 'performanceDuration',
    performanceDate: 'performanceDate',
    uploadedAt: 'uploadedAt',
    createdAt: 'createdAt',
    pitchAccuracy: 'pitchAccuracy',
    timingAccuracy: 'timingAccuracy',
    overallScore: 'overallScore',
    evaluatedNotes: 'evaluatedNotes',
    analysisSummary: 'analysisSummary',
    analysisStatus: 'analysisStatus',
    retryCount: 'retryCount',
    errorMessage: 'errorMessage',
    lastAttemptedAt: 'lastAttemptedAt',
    executionId: 'executionId',
    idempotencyKey: 'idempotencyKey'
  };

  export type PerformanceScalarFieldEnum = (typeof PerformanceScalarFieldEnum)[keyof typeof PerformanceScalarFieldEnum]


  export const PracticeItemScalarFieldEnum: {
    id: 'id',
    category: 'category',
    title: 'title',
    composer: 'composer',
    description: 'description',
    descriptionShort: 'descriptionShort',
    keyTonic: 'keyTonic',
    keyMode: 'keyMode',
    tempoMin: 'tempoMin',
    tempoMax: 'tempoMax',
    positions: 'positions',
    instrument: 'instrument',
    originalXmlPath: 'originalXmlPath',
    generatedXmlPath: 'generatedXmlPath',
    analysisPath: 'analysisPath',
    analysisStatus: 'analysisStatus',
    buildStatus: 'buildStatus',
    retryCount: 'retryCount',
    errorMessage: 'errorMessage',
    lastAttemptedAt: 'lastAttemptedAt',
    executionId: 'executionId',
    idempotencyKey: 'idempotencyKey',
    ownerUserId: 'ownerUserId',
    source: 'source',
    sortOrder: 'sortOrder',
    isPublished: 'isPublished',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PracticeItemScalarFieldEnum = (typeof PracticeItemScalarFieldEnum)[keyof typeof PracticeItemScalarFieldEnum]


  export const TechniqueTagScalarFieldEnum: {
    id: 'id',
    category: 'category',
    name: 'name',
    nameEn: 'nameEn',
    description: 'description',
    xmlTags: 'xmlTags',
    isAnalyzable: 'isAnalyzable',
    implementStatus: 'implementStatus'
  };

  export type TechniqueTagScalarFieldEnum = (typeof TechniqueTagScalarFieldEnum)[keyof typeof TechniqueTagScalarFieldEnum]


  export const PracticeItemTechniqueScalarFieldEnum: {
    practiceItemId: 'practiceItemId',
    techniqueTagId: 'techniqueTagId',
    isPrimary: 'isPrimary'
  };

  export type PracticeItemTechniqueScalarFieldEnum = (typeof PracticeItemTechniqueScalarFieldEnum)[keyof typeof PracticeItemTechniqueScalarFieldEnum]


  export const PracticePerformanceScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    practiceItemId: 'practiceItemId',
    audioPath: 'audioPath',
    comparisonResultPath: 'comparisonResultPath',
    performanceDuration: 'performanceDuration',
    uploadedAt: 'uploadedAt',
    pitchAccuracy: 'pitchAccuracy',
    timingAccuracy: 'timingAccuracy',
    overallScore: 'overallScore',
    evaluatedNotes: 'evaluatedNotes',
    analysisSummary: 'analysisSummary',
    analysisStatus: 'analysisStatus',
    retryCount: 'retryCount',
    errorMessage: 'errorMessage',
    lastAttemptedAt: 'lastAttemptedAt',
    executionId: 'executionId',
    idempotencyKey: 'idempotencyKey'
  };

  export type PracticePerformanceScalarFieldEnum = (typeof PracticePerformanceScalarFieldEnum)[keyof typeof PracticePerformanceScalarFieldEnum]


  export const UserWeaknessScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    weaknessType: 'weaknessType',
    weaknessKey: 'weaknessKey',
    techniqueTagId: 'techniqueTagId',
    severity: 'severity',
    sampleCount: 'sampleCount',
    lastUpdated: 'lastUpdated'
  };

  export type UserWeaknessScalarFieldEnum = (typeof UserWeaknessScalarFieldEnum)[keyof typeof UserWeaknessScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'JobStatus'
   */
  export type EnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus'>
    


  /**
   * Reference to a field of type 'JobStatus[]'
   */
  export type ListEnumJobStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JobStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'PerformanceType'
   */
  export type EnumPerformanceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PerformanceType'>
    


  /**
   * Reference to a field of type 'PerformanceType[]'
   */
  export type ListEnumPerformanceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PerformanceType[]'>
    


  /**
   * Reference to a field of type 'PerformanceStatus'
   */
  export type EnumPerformanceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PerformanceStatus'>
    


  /**
   * Reference to a field of type 'PerformanceStatus[]'
   */
  export type ListEnumPerformanceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PerformanceStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'PracticeCategory'
   */
  export type EnumPracticeCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PracticeCategory'>
    


  /**
   * Reference to a field of type 'PracticeCategory[]'
   */
  export type ListEnumPracticeCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PracticeCategory[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    supabaseUserId?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    plan?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    performances?: PerformanceListRelationFilter
    scores?: ScoreListRelationFilter
    practiceItems?: PracticeItemListRelationFilter
    practicePerformances?: PracticePerformanceListRelationFilter
    weaknesses?: UserWeaknessListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    supabaseUserId?: SortOrder
    name?: SortOrder
    role?: SortOrder
    plan?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    performances?: PerformanceOrderByRelationAggregateInput
    scores?: ScoreOrderByRelationAggregateInput
    practiceItems?: PracticeItemOrderByRelationAggregateInput
    practicePerformances?: PracticePerformanceOrderByRelationAggregateInput
    weaknesses?: UserWeaknessOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    supabaseUserId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    plan?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    performances?: PerformanceListRelationFilter
    scores?: ScoreListRelationFilter
    practiceItems?: PracticeItemListRelationFilter
    practicePerformances?: PracticePerformanceListRelationFilter
    weaknesses?: UserWeaknessListRelationFilter
  }, "id" | "supabaseUserId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    supabaseUserId?: SortOrder
    name?: SortOrder
    role?: SortOrder
    plan?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    supabaseUserId?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    plan?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ScoreWhereInput = {
    AND?: ScoreWhereInput | ScoreWhereInput[]
    OR?: ScoreWhereInput[]
    NOT?: ScoreWhereInput | ScoreWhereInput[]
    id?: StringFilter<"Score"> | string
    createdById?: StringFilter<"Score"> | string
    title?: StringFilter<"Score"> | string
    composer?: StringNullableFilter<"Score"> | string | null
    arranger?: StringNullableFilter<"Score"> | string | null
    originalXmlPath?: StringFilter<"Score"> | string
    generatedXmlPath?: StringNullableFilter<"Score"> | string | null
    analysisStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    retryCount?: IntFilter<"Score"> | number
    errorMessage?: StringNullableFilter<"Score"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Score"> | Date | string | null
    executionId?: StringNullableFilter<"Score"> | string | null
    idempotencyKey?: StringNullableFilter<"Score"> | string | null
    keyTonic?: StringNullableFilter<"Score"> | string | null
    keyMode?: StringNullableFilter<"Score"> | string | null
    timeNumerator?: IntNullableFilter<"Score"> | number | null
    timeDenominator?: IntNullableFilter<"Score"> | number | null
    defaultTempo?: IntNullableFilter<"Score"> | number | null
    isShared?: BoolFilter<"Score"> | boolean
    createdAt?: DateTimeFilter<"Score"> | Date | string
    performances?: PerformanceListRelationFilter
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ScoreOrderByWithRelationInput = {
    id?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    composer?: SortOrderInput | SortOrder
    arranger?: SortOrderInput | SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    keyTonic?: SortOrderInput | SortOrder
    keyMode?: SortOrderInput | SortOrder
    timeNumerator?: SortOrderInput | SortOrder
    timeDenominator?: SortOrderInput | SortOrder
    defaultTempo?: SortOrderInput | SortOrder
    isShared?: SortOrder
    createdAt?: SortOrder
    performances?: PerformanceOrderByRelationAggregateInput
    createdBy?: UserOrderByWithRelationInput
  }

  export type ScoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    AND?: ScoreWhereInput | ScoreWhereInput[]
    OR?: ScoreWhereInput[]
    NOT?: ScoreWhereInput | ScoreWhereInput[]
    createdById?: StringFilter<"Score"> | string
    title?: StringFilter<"Score"> | string
    composer?: StringNullableFilter<"Score"> | string | null
    arranger?: StringNullableFilter<"Score"> | string | null
    originalXmlPath?: StringFilter<"Score"> | string
    generatedXmlPath?: StringNullableFilter<"Score"> | string | null
    analysisStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    retryCount?: IntFilter<"Score"> | number
    errorMessage?: StringNullableFilter<"Score"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Score"> | Date | string | null
    executionId?: StringNullableFilter<"Score"> | string | null
    keyTonic?: StringNullableFilter<"Score"> | string | null
    keyMode?: StringNullableFilter<"Score"> | string | null
    timeNumerator?: IntNullableFilter<"Score"> | number | null
    timeDenominator?: IntNullableFilter<"Score"> | number | null
    defaultTempo?: IntNullableFilter<"Score"> | number | null
    isShared?: BoolFilter<"Score"> | boolean
    createdAt?: DateTimeFilter<"Score"> | Date | string
    performances?: PerformanceListRelationFilter
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "idempotencyKey">

  export type ScoreOrderByWithAggregationInput = {
    id?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    composer?: SortOrderInput | SortOrder
    arranger?: SortOrderInput | SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    keyTonic?: SortOrderInput | SortOrder
    keyMode?: SortOrderInput | SortOrder
    timeNumerator?: SortOrderInput | SortOrder
    timeDenominator?: SortOrderInput | SortOrder
    defaultTempo?: SortOrderInput | SortOrder
    isShared?: SortOrder
    createdAt?: SortOrder
    _count?: ScoreCountOrderByAggregateInput
    _avg?: ScoreAvgOrderByAggregateInput
    _max?: ScoreMaxOrderByAggregateInput
    _min?: ScoreMinOrderByAggregateInput
    _sum?: ScoreSumOrderByAggregateInput
  }

  export type ScoreScalarWhereWithAggregatesInput = {
    AND?: ScoreScalarWhereWithAggregatesInput | ScoreScalarWhereWithAggregatesInput[]
    OR?: ScoreScalarWhereWithAggregatesInput[]
    NOT?: ScoreScalarWhereWithAggregatesInput | ScoreScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Score"> | string
    createdById?: StringWithAggregatesFilter<"Score"> | string
    title?: StringWithAggregatesFilter<"Score"> | string
    composer?: StringNullableWithAggregatesFilter<"Score"> | string | null
    arranger?: StringNullableWithAggregatesFilter<"Score"> | string | null
    originalXmlPath?: StringWithAggregatesFilter<"Score"> | string
    generatedXmlPath?: StringNullableWithAggregatesFilter<"Score"> | string | null
    analysisStatus?: EnumJobStatusWithAggregatesFilter<"Score"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusWithAggregatesFilter<"Score"> | $Enums.JobStatus
    retryCount?: IntWithAggregatesFilter<"Score"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"Score"> | string | null
    lastAttemptedAt?: DateTimeNullableWithAggregatesFilter<"Score"> | Date | string | null
    executionId?: StringNullableWithAggregatesFilter<"Score"> | string | null
    idempotencyKey?: StringNullableWithAggregatesFilter<"Score"> | string | null
    keyTonic?: StringNullableWithAggregatesFilter<"Score"> | string | null
    keyMode?: StringNullableWithAggregatesFilter<"Score"> | string | null
    timeNumerator?: IntNullableWithAggregatesFilter<"Score"> | number | null
    timeDenominator?: IntNullableWithAggregatesFilter<"Score"> | number | null
    defaultTempo?: IntNullableWithAggregatesFilter<"Score"> | number | null
    isShared?: BoolWithAggregatesFilter<"Score"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Score"> | Date | string
  }

  export type PerformanceWhereInput = {
    AND?: PerformanceWhereInput | PerformanceWhereInput[]
    OR?: PerformanceWhereInput[]
    NOT?: PerformanceWhereInput | PerformanceWhereInput[]
    id?: StringFilter<"Performance"> | string
    performanceType?: EnumPerformanceTypeFilter<"Performance"> | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFilter<"Performance"> | $Enums.PerformanceStatus
    userId?: StringFilter<"Performance"> | string
    scoreId?: StringFilter<"Performance"> | string
    audioPath?: StringFilter<"Performance"> | string
    audioFeaturesPath?: StringNullableFilter<"Performance"> | string | null
    comparisonResultPath?: StringNullableFilter<"Performance"> | string | null
    pseudoXmlPath?: StringNullableFilter<"Performance"> | string | null
    performanceDuration?: FloatNullableFilter<"Performance"> | number | null
    performanceDate?: DateTimeNullableFilter<"Performance"> | Date | string | null
    uploadedAt?: DateTimeFilter<"Performance"> | Date | string
    createdAt?: DateTimeFilter<"Performance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"Performance"> | number | null
    timingAccuracy?: FloatNullableFilter<"Performance"> | number | null
    overallScore?: FloatNullableFilter<"Performance"> | number | null
    evaluatedNotes?: IntNullableFilter<"Performance"> | number | null
    analysisSummary?: JsonNullableFilter<"Performance">
    analysisStatus?: EnumJobStatusFilter<"Performance"> | $Enums.JobStatus
    retryCount?: IntFilter<"Performance"> | number
    errorMessage?: StringNullableFilter<"Performance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Performance"> | Date | string | null
    executionId?: StringNullableFilter<"Performance"> | string | null
    idempotencyKey?: StringNullableFilter<"Performance"> | string | null
    score?: XOR<ScoreScalarRelationFilter, ScoreWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PerformanceOrderByWithRelationInput = {
    id?: SortOrder
    performanceType?: SortOrder
    performanceStatus?: SortOrder
    userId?: SortOrder
    scoreId?: SortOrder
    audioPath?: SortOrder
    audioFeaturesPath?: SortOrderInput | SortOrder
    comparisonResultPath?: SortOrderInput | SortOrder
    pseudoXmlPath?: SortOrderInput | SortOrder
    performanceDuration?: SortOrderInput | SortOrder
    performanceDate?: SortOrderInput | SortOrder
    uploadedAt?: SortOrder
    createdAt?: SortOrder
    pitchAccuracy?: SortOrderInput | SortOrder
    timingAccuracy?: SortOrderInput | SortOrder
    overallScore?: SortOrderInput | SortOrder
    evaluatedNotes?: SortOrderInput | SortOrder
    analysisSummary?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    score?: ScoreOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type PerformanceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    AND?: PerformanceWhereInput | PerformanceWhereInput[]
    OR?: PerformanceWhereInput[]
    NOT?: PerformanceWhereInput | PerformanceWhereInput[]
    performanceType?: EnumPerformanceTypeFilter<"Performance"> | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFilter<"Performance"> | $Enums.PerformanceStatus
    userId?: StringFilter<"Performance"> | string
    scoreId?: StringFilter<"Performance"> | string
    audioPath?: StringFilter<"Performance"> | string
    audioFeaturesPath?: StringNullableFilter<"Performance"> | string | null
    comparisonResultPath?: StringNullableFilter<"Performance"> | string | null
    pseudoXmlPath?: StringNullableFilter<"Performance"> | string | null
    performanceDuration?: FloatNullableFilter<"Performance"> | number | null
    performanceDate?: DateTimeNullableFilter<"Performance"> | Date | string | null
    uploadedAt?: DateTimeFilter<"Performance"> | Date | string
    createdAt?: DateTimeFilter<"Performance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"Performance"> | number | null
    timingAccuracy?: FloatNullableFilter<"Performance"> | number | null
    overallScore?: FloatNullableFilter<"Performance"> | number | null
    evaluatedNotes?: IntNullableFilter<"Performance"> | number | null
    analysisSummary?: JsonNullableFilter<"Performance">
    analysisStatus?: EnumJobStatusFilter<"Performance"> | $Enums.JobStatus
    retryCount?: IntFilter<"Performance"> | number
    errorMessage?: StringNullableFilter<"Performance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Performance"> | Date | string | null
    executionId?: StringNullableFilter<"Performance"> | string | null
    score?: XOR<ScoreScalarRelationFilter, ScoreWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "idempotencyKey">

  export type PerformanceOrderByWithAggregationInput = {
    id?: SortOrder
    performanceType?: SortOrder
    performanceStatus?: SortOrder
    userId?: SortOrder
    scoreId?: SortOrder
    audioPath?: SortOrder
    audioFeaturesPath?: SortOrderInput | SortOrder
    comparisonResultPath?: SortOrderInput | SortOrder
    pseudoXmlPath?: SortOrderInput | SortOrder
    performanceDuration?: SortOrderInput | SortOrder
    performanceDate?: SortOrderInput | SortOrder
    uploadedAt?: SortOrder
    createdAt?: SortOrder
    pitchAccuracy?: SortOrderInput | SortOrder
    timingAccuracy?: SortOrderInput | SortOrder
    overallScore?: SortOrderInput | SortOrder
    evaluatedNotes?: SortOrderInput | SortOrder
    analysisSummary?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    _count?: PerformanceCountOrderByAggregateInput
    _avg?: PerformanceAvgOrderByAggregateInput
    _max?: PerformanceMaxOrderByAggregateInput
    _min?: PerformanceMinOrderByAggregateInput
    _sum?: PerformanceSumOrderByAggregateInput
  }

  export type PerformanceScalarWhereWithAggregatesInput = {
    AND?: PerformanceScalarWhereWithAggregatesInput | PerformanceScalarWhereWithAggregatesInput[]
    OR?: PerformanceScalarWhereWithAggregatesInput[]
    NOT?: PerformanceScalarWhereWithAggregatesInput | PerformanceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Performance"> | string
    performanceType?: EnumPerformanceTypeWithAggregatesFilter<"Performance"> | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusWithAggregatesFilter<"Performance"> | $Enums.PerformanceStatus
    userId?: StringWithAggregatesFilter<"Performance"> | string
    scoreId?: StringWithAggregatesFilter<"Performance"> | string
    audioPath?: StringWithAggregatesFilter<"Performance"> | string
    audioFeaturesPath?: StringNullableWithAggregatesFilter<"Performance"> | string | null
    comparisonResultPath?: StringNullableWithAggregatesFilter<"Performance"> | string | null
    pseudoXmlPath?: StringNullableWithAggregatesFilter<"Performance"> | string | null
    performanceDuration?: FloatNullableWithAggregatesFilter<"Performance"> | number | null
    performanceDate?: DateTimeNullableWithAggregatesFilter<"Performance"> | Date | string | null
    uploadedAt?: DateTimeWithAggregatesFilter<"Performance"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Performance"> | Date | string
    pitchAccuracy?: FloatNullableWithAggregatesFilter<"Performance"> | number | null
    timingAccuracy?: FloatNullableWithAggregatesFilter<"Performance"> | number | null
    overallScore?: FloatNullableWithAggregatesFilter<"Performance"> | number | null
    evaluatedNotes?: IntNullableWithAggregatesFilter<"Performance"> | number | null
    analysisSummary?: JsonNullableWithAggregatesFilter<"Performance">
    analysisStatus?: EnumJobStatusWithAggregatesFilter<"Performance"> | $Enums.JobStatus
    retryCount?: IntWithAggregatesFilter<"Performance"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"Performance"> | string | null
    lastAttemptedAt?: DateTimeNullableWithAggregatesFilter<"Performance"> | Date | string | null
    executionId?: StringNullableWithAggregatesFilter<"Performance"> | string | null
    idempotencyKey?: StringNullableWithAggregatesFilter<"Performance"> | string | null
  }

  export type PracticeItemWhereInput = {
    AND?: PracticeItemWhereInput | PracticeItemWhereInput[]
    OR?: PracticeItemWhereInput[]
    NOT?: PracticeItemWhereInput | PracticeItemWhereInput[]
    id?: StringFilter<"PracticeItem"> | string
    category?: EnumPracticeCategoryFilter<"PracticeItem"> | $Enums.PracticeCategory
    title?: StringFilter<"PracticeItem"> | string
    composer?: StringNullableFilter<"PracticeItem"> | string | null
    description?: StringNullableFilter<"PracticeItem"> | string | null
    descriptionShort?: StringNullableFilter<"PracticeItem"> | string | null
    keyTonic?: StringFilter<"PracticeItem"> | string
    keyMode?: StringFilter<"PracticeItem"> | string
    tempoMin?: IntNullableFilter<"PracticeItem"> | number | null
    tempoMax?: IntNullableFilter<"PracticeItem"> | number | null
    positions?: StringNullableListFilter<"PracticeItem">
    instrument?: StringFilter<"PracticeItem"> | string
    originalXmlPath?: StringFilter<"PracticeItem"> | string
    generatedXmlPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticeItem"> | number
    errorMessage?: StringNullableFilter<"PracticeItem"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticeItem"> | Date | string | null
    executionId?: StringNullableFilter<"PracticeItem"> | string | null
    idempotencyKey?: StringNullableFilter<"PracticeItem"> | string | null
    ownerUserId?: StringNullableFilter<"PracticeItem"> | string | null
    source?: StringNullableFilter<"PracticeItem"> | string | null
    sortOrder?: IntFilter<"PracticeItem"> | number
    isPublished?: BoolFilter<"PracticeItem"> | boolean
    metadata?: JsonNullableFilter<"PracticeItem">
    createdAt?: DateTimeFilter<"PracticeItem"> | Date | string
    updatedAt?: DateTimeFilter<"PracticeItem"> | Date | string
    owner?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    techniques?: PracticeItemTechniqueListRelationFilter
    practicePerformances?: PracticePerformanceListRelationFilter
  }

  export type PracticeItemOrderByWithRelationInput = {
    id?: SortOrder
    category?: SortOrder
    title?: SortOrder
    composer?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    descriptionShort?: SortOrderInput | SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    tempoMin?: SortOrderInput | SortOrder
    tempoMax?: SortOrderInput | SortOrder
    positions?: SortOrder
    instrument?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrderInput | SortOrder
    analysisPath?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    ownerUserId?: SortOrderInput | SortOrder
    source?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isPublished?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    owner?: UserOrderByWithRelationInput
    techniques?: PracticeItemTechniqueOrderByRelationAggregateInput
    practicePerformances?: PracticePerformanceOrderByRelationAggregateInput
  }

  export type PracticeItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    AND?: PracticeItemWhereInput | PracticeItemWhereInput[]
    OR?: PracticeItemWhereInput[]
    NOT?: PracticeItemWhereInput | PracticeItemWhereInput[]
    category?: EnumPracticeCategoryFilter<"PracticeItem"> | $Enums.PracticeCategory
    title?: StringFilter<"PracticeItem"> | string
    composer?: StringNullableFilter<"PracticeItem"> | string | null
    description?: StringNullableFilter<"PracticeItem"> | string | null
    descriptionShort?: StringNullableFilter<"PracticeItem"> | string | null
    keyTonic?: StringFilter<"PracticeItem"> | string
    keyMode?: StringFilter<"PracticeItem"> | string
    tempoMin?: IntNullableFilter<"PracticeItem"> | number | null
    tempoMax?: IntNullableFilter<"PracticeItem"> | number | null
    positions?: StringNullableListFilter<"PracticeItem">
    instrument?: StringFilter<"PracticeItem"> | string
    originalXmlPath?: StringFilter<"PracticeItem"> | string
    generatedXmlPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticeItem"> | number
    errorMessage?: StringNullableFilter<"PracticeItem"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticeItem"> | Date | string | null
    executionId?: StringNullableFilter<"PracticeItem"> | string | null
    ownerUserId?: StringNullableFilter<"PracticeItem"> | string | null
    source?: StringNullableFilter<"PracticeItem"> | string | null
    sortOrder?: IntFilter<"PracticeItem"> | number
    isPublished?: BoolFilter<"PracticeItem"> | boolean
    metadata?: JsonNullableFilter<"PracticeItem">
    createdAt?: DateTimeFilter<"PracticeItem"> | Date | string
    updatedAt?: DateTimeFilter<"PracticeItem"> | Date | string
    owner?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    techniques?: PracticeItemTechniqueListRelationFilter
    practicePerformances?: PracticePerformanceListRelationFilter
  }, "id" | "idempotencyKey">

  export type PracticeItemOrderByWithAggregationInput = {
    id?: SortOrder
    category?: SortOrder
    title?: SortOrder
    composer?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    descriptionShort?: SortOrderInput | SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    tempoMin?: SortOrderInput | SortOrder
    tempoMax?: SortOrderInput | SortOrder
    positions?: SortOrder
    instrument?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrderInput | SortOrder
    analysisPath?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    ownerUserId?: SortOrderInput | SortOrder
    source?: SortOrderInput | SortOrder
    sortOrder?: SortOrder
    isPublished?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PracticeItemCountOrderByAggregateInput
    _avg?: PracticeItemAvgOrderByAggregateInput
    _max?: PracticeItemMaxOrderByAggregateInput
    _min?: PracticeItemMinOrderByAggregateInput
    _sum?: PracticeItemSumOrderByAggregateInput
  }

  export type PracticeItemScalarWhereWithAggregatesInput = {
    AND?: PracticeItemScalarWhereWithAggregatesInput | PracticeItemScalarWhereWithAggregatesInput[]
    OR?: PracticeItemScalarWhereWithAggregatesInput[]
    NOT?: PracticeItemScalarWhereWithAggregatesInput | PracticeItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PracticeItem"> | string
    category?: EnumPracticeCategoryWithAggregatesFilter<"PracticeItem"> | $Enums.PracticeCategory
    title?: StringWithAggregatesFilter<"PracticeItem"> | string
    composer?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    description?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    descriptionShort?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    keyTonic?: StringWithAggregatesFilter<"PracticeItem"> | string
    keyMode?: StringWithAggregatesFilter<"PracticeItem"> | string
    tempoMin?: IntNullableWithAggregatesFilter<"PracticeItem"> | number | null
    tempoMax?: IntNullableWithAggregatesFilter<"PracticeItem"> | number | null
    positions?: StringNullableListFilter<"PracticeItem">
    instrument?: StringWithAggregatesFilter<"PracticeItem"> | string
    originalXmlPath?: StringWithAggregatesFilter<"PracticeItem"> | string
    generatedXmlPath?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    analysisPath?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    analysisStatus?: EnumJobStatusWithAggregatesFilter<"PracticeItem"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusWithAggregatesFilter<"PracticeItem"> | $Enums.JobStatus
    retryCount?: IntWithAggregatesFilter<"PracticeItem"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    lastAttemptedAt?: DateTimeNullableWithAggregatesFilter<"PracticeItem"> | Date | string | null
    executionId?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    idempotencyKey?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    ownerUserId?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    source?: StringNullableWithAggregatesFilter<"PracticeItem"> | string | null
    sortOrder?: IntWithAggregatesFilter<"PracticeItem"> | number
    isPublished?: BoolWithAggregatesFilter<"PracticeItem"> | boolean
    metadata?: JsonNullableWithAggregatesFilter<"PracticeItem">
    createdAt?: DateTimeWithAggregatesFilter<"PracticeItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PracticeItem"> | Date | string
  }

  export type TechniqueTagWhereInput = {
    AND?: TechniqueTagWhereInput | TechniqueTagWhereInput[]
    OR?: TechniqueTagWhereInput[]
    NOT?: TechniqueTagWhereInput | TechniqueTagWhereInput[]
    id?: StringFilter<"TechniqueTag"> | string
    category?: StringFilter<"TechniqueTag"> | string
    name?: StringFilter<"TechniqueTag"> | string
    nameEn?: StringNullableFilter<"TechniqueTag"> | string | null
    description?: StringNullableFilter<"TechniqueTag"> | string | null
    xmlTags?: StringNullableListFilter<"TechniqueTag">
    isAnalyzable?: StringFilter<"TechniqueTag"> | string
    implementStatus?: StringFilter<"TechniqueTag"> | string
    practiceItems?: PracticeItemTechniqueListRelationFilter
    weaknesses?: UserWeaknessListRelationFilter
  }

  export type TechniqueTagOrderByWithRelationInput = {
    id?: SortOrder
    category?: SortOrder
    name?: SortOrder
    nameEn?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    xmlTags?: SortOrder
    isAnalyzable?: SortOrder
    implementStatus?: SortOrder
    practiceItems?: PracticeItemTechniqueOrderByRelationAggregateInput
    weaknesses?: UserWeaknessOrderByRelationAggregateInput
  }

  export type TechniqueTagWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    category_name?: TechniqueTagCategoryNameCompoundUniqueInput
    AND?: TechniqueTagWhereInput | TechniqueTagWhereInput[]
    OR?: TechniqueTagWhereInput[]
    NOT?: TechniqueTagWhereInput | TechniqueTagWhereInput[]
    category?: StringFilter<"TechniqueTag"> | string
    name?: StringFilter<"TechniqueTag"> | string
    nameEn?: StringNullableFilter<"TechniqueTag"> | string | null
    description?: StringNullableFilter<"TechniqueTag"> | string | null
    xmlTags?: StringNullableListFilter<"TechniqueTag">
    isAnalyzable?: StringFilter<"TechniqueTag"> | string
    implementStatus?: StringFilter<"TechniqueTag"> | string
    practiceItems?: PracticeItemTechniqueListRelationFilter
    weaknesses?: UserWeaknessListRelationFilter
  }, "id" | "category_name">

  export type TechniqueTagOrderByWithAggregationInput = {
    id?: SortOrder
    category?: SortOrder
    name?: SortOrder
    nameEn?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    xmlTags?: SortOrder
    isAnalyzable?: SortOrder
    implementStatus?: SortOrder
    _count?: TechniqueTagCountOrderByAggregateInput
    _max?: TechniqueTagMaxOrderByAggregateInput
    _min?: TechniqueTagMinOrderByAggregateInput
  }

  export type TechniqueTagScalarWhereWithAggregatesInput = {
    AND?: TechniqueTagScalarWhereWithAggregatesInput | TechniqueTagScalarWhereWithAggregatesInput[]
    OR?: TechniqueTagScalarWhereWithAggregatesInput[]
    NOT?: TechniqueTagScalarWhereWithAggregatesInput | TechniqueTagScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TechniqueTag"> | string
    category?: StringWithAggregatesFilter<"TechniqueTag"> | string
    name?: StringWithAggregatesFilter<"TechniqueTag"> | string
    nameEn?: StringNullableWithAggregatesFilter<"TechniqueTag"> | string | null
    description?: StringNullableWithAggregatesFilter<"TechniqueTag"> | string | null
    xmlTags?: StringNullableListFilter<"TechniqueTag">
    isAnalyzable?: StringWithAggregatesFilter<"TechniqueTag"> | string
    implementStatus?: StringWithAggregatesFilter<"TechniqueTag"> | string
  }

  export type PracticeItemTechniqueWhereInput = {
    AND?: PracticeItemTechniqueWhereInput | PracticeItemTechniqueWhereInput[]
    OR?: PracticeItemTechniqueWhereInput[]
    NOT?: PracticeItemTechniqueWhereInput | PracticeItemTechniqueWhereInput[]
    practiceItemId?: StringFilter<"PracticeItemTechnique"> | string
    techniqueTagId?: StringFilter<"PracticeItemTechnique"> | string
    isPrimary?: BoolFilter<"PracticeItemTechnique"> | boolean
    practiceItem?: XOR<PracticeItemScalarRelationFilter, PracticeItemWhereInput>
    techniqueTag?: XOR<TechniqueTagScalarRelationFilter, TechniqueTagWhereInput>
  }

  export type PracticeItemTechniqueOrderByWithRelationInput = {
    practiceItemId?: SortOrder
    techniqueTagId?: SortOrder
    isPrimary?: SortOrder
    practiceItem?: PracticeItemOrderByWithRelationInput
    techniqueTag?: TechniqueTagOrderByWithRelationInput
  }

  export type PracticeItemTechniqueWhereUniqueInput = Prisma.AtLeast<{
    practiceItemId_techniqueTagId?: PracticeItemTechniquePracticeItemIdTechniqueTagIdCompoundUniqueInput
    AND?: PracticeItemTechniqueWhereInput | PracticeItemTechniqueWhereInput[]
    OR?: PracticeItemTechniqueWhereInput[]
    NOT?: PracticeItemTechniqueWhereInput | PracticeItemTechniqueWhereInput[]
    practiceItemId?: StringFilter<"PracticeItemTechnique"> | string
    techniqueTagId?: StringFilter<"PracticeItemTechnique"> | string
    isPrimary?: BoolFilter<"PracticeItemTechnique"> | boolean
    practiceItem?: XOR<PracticeItemScalarRelationFilter, PracticeItemWhereInput>
    techniqueTag?: XOR<TechniqueTagScalarRelationFilter, TechniqueTagWhereInput>
  }, "practiceItemId_techniqueTagId">

  export type PracticeItemTechniqueOrderByWithAggregationInput = {
    practiceItemId?: SortOrder
    techniqueTagId?: SortOrder
    isPrimary?: SortOrder
    _count?: PracticeItemTechniqueCountOrderByAggregateInput
    _max?: PracticeItemTechniqueMaxOrderByAggregateInput
    _min?: PracticeItemTechniqueMinOrderByAggregateInput
  }

  export type PracticeItemTechniqueScalarWhereWithAggregatesInput = {
    AND?: PracticeItemTechniqueScalarWhereWithAggregatesInput | PracticeItemTechniqueScalarWhereWithAggregatesInput[]
    OR?: PracticeItemTechniqueScalarWhereWithAggregatesInput[]
    NOT?: PracticeItemTechniqueScalarWhereWithAggregatesInput | PracticeItemTechniqueScalarWhereWithAggregatesInput[]
    practiceItemId?: StringWithAggregatesFilter<"PracticeItemTechnique"> | string
    techniqueTagId?: StringWithAggregatesFilter<"PracticeItemTechnique"> | string
    isPrimary?: BoolWithAggregatesFilter<"PracticeItemTechnique"> | boolean
  }

  export type PracticePerformanceWhereInput = {
    AND?: PracticePerformanceWhereInput | PracticePerformanceWhereInput[]
    OR?: PracticePerformanceWhereInput[]
    NOT?: PracticePerformanceWhereInput | PracticePerformanceWhereInput[]
    id?: StringFilter<"PracticePerformance"> | string
    userId?: StringFilter<"PracticePerformance"> | string
    practiceItemId?: StringFilter<"PracticePerformance"> | string
    audioPath?: StringFilter<"PracticePerformance"> | string
    comparisonResultPath?: StringNullableFilter<"PracticePerformance"> | string | null
    performanceDuration?: FloatNullableFilter<"PracticePerformance"> | number | null
    uploadedAt?: DateTimeFilter<"PracticePerformance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    timingAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    overallScore?: FloatNullableFilter<"PracticePerformance"> | number | null
    evaluatedNotes?: IntNullableFilter<"PracticePerformance"> | number | null
    analysisSummary?: JsonNullableFilter<"PracticePerformance">
    analysisStatus?: EnumJobStatusFilter<"PracticePerformance"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticePerformance"> | number
    errorMessage?: StringNullableFilter<"PracticePerformance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticePerformance"> | Date | string | null
    executionId?: StringNullableFilter<"PracticePerformance"> | string | null
    idempotencyKey?: StringNullableFilter<"PracticePerformance"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    practiceItem?: XOR<PracticeItemScalarRelationFilter, PracticeItemWhereInput>
  }

  export type PracticePerformanceOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    practiceItemId?: SortOrder
    audioPath?: SortOrder
    comparisonResultPath?: SortOrderInput | SortOrder
    performanceDuration?: SortOrderInput | SortOrder
    uploadedAt?: SortOrder
    pitchAccuracy?: SortOrderInput | SortOrder
    timingAccuracy?: SortOrderInput | SortOrder
    overallScore?: SortOrderInput | SortOrder
    evaluatedNotes?: SortOrderInput | SortOrder
    analysisSummary?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
    practiceItem?: PracticeItemOrderByWithRelationInput
  }

  export type PracticePerformanceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    AND?: PracticePerformanceWhereInput | PracticePerformanceWhereInput[]
    OR?: PracticePerformanceWhereInput[]
    NOT?: PracticePerformanceWhereInput | PracticePerformanceWhereInput[]
    userId?: StringFilter<"PracticePerformance"> | string
    practiceItemId?: StringFilter<"PracticePerformance"> | string
    audioPath?: StringFilter<"PracticePerformance"> | string
    comparisonResultPath?: StringNullableFilter<"PracticePerformance"> | string | null
    performanceDuration?: FloatNullableFilter<"PracticePerformance"> | number | null
    uploadedAt?: DateTimeFilter<"PracticePerformance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    timingAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    overallScore?: FloatNullableFilter<"PracticePerformance"> | number | null
    evaluatedNotes?: IntNullableFilter<"PracticePerformance"> | number | null
    analysisSummary?: JsonNullableFilter<"PracticePerformance">
    analysisStatus?: EnumJobStatusFilter<"PracticePerformance"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticePerformance"> | number
    errorMessage?: StringNullableFilter<"PracticePerformance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticePerformance"> | Date | string | null
    executionId?: StringNullableFilter<"PracticePerformance"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    practiceItem?: XOR<PracticeItemScalarRelationFilter, PracticeItemWhereInput>
  }, "id" | "idempotencyKey">

  export type PracticePerformanceOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    practiceItemId?: SortOrder
    audioPath?: SortOrder
    comparisonResultPath?: SortOrderInput | SortOrder
    performanceDuration?: SortOrderInput | SortOrder
    uploadedAt?: SortOrder
    pitchAccuracy?: SortOrderInput | SortOrder
    timingAccuracy?: SortOrderInput | SortOrder
    overallScore?: SortOrderInput | SortOrder
    evaluatedNotes?: SortOrderInput | SortOrder
    analysisSummary?: SortOrderInput | SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    lastAttemptedAt?: SortOrderInput | SortOrder
    executionId?: SortOrderInput | SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    _count?: PracticePerformanceCountOrderByAggregateInput
    _avg?: PracticePerformanceAvgOrderByAggregateInput
    _max?: PracticePerformanceMaxOrderByAggregateInput
    _min?: PracticePerformanceMinOrderByAggregateInput
    _sum?: PracticePerformanceSumOrderByAggregateInput
  }

  export type PracticePerformanceScalarWhereWithAggregatesInput = {
    AND?: PracticePerformanceScalarWhereWithAggregatesInput | PracticePerformanceScalarWhereWithAggregatesInput[]
    OR?: PracticePerformanceScalarWhereWithAggregatesInput[]
    NOT?: PracticePerformanceScalarWhereWithAggregatesInput | PracticePerformanceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PracticePerformance"> | string
    userId?: StringWithAggregatesFilter<"PracticePerformance"> | string
    practiceItemId?: StringWithAggregatesFilter<"PracticePerformance"> | string
    audioPath?: StringWithAggregatesFilter<"PracticePerformance"> | string
    comparisonResultPath?: StringNullableWithAggregatesFilter<"PracticePerformance"> | string | null
    performanceDuration?: FloatNullableWithAggregatesFilter<"PracticePerformance"> | number | null
    uploadedAt?: DateTimeWithAggregatesFilter<"PracticePerformance"> | Date | string
    pitchAccuracy?: FloatNullableWithAggregatesFilter<"PracticePerformance"> | number | null
    timingAccuracy?: FloatNullableWithAggregatesFilter<"PracticePerformance"> | number | null
    overallScore?: FloatNullableWithAggregatesFilter<"PracticePerformance"> | number | null
    evaluatedNotes?: IntNullableWithAggregatesFilter<"PracticePerformance"> | number | null
    analysisSummary?: JsonNullableWithAggregatesFilter<"PracticePerformance">
    analysisStatus?: EnumJobStatusWithAggregatesFilter<"PracticePerformance"> | $Enums.JobStatus
    retryCount?: IntWithAggregatesFilter<"PracticePerformance"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"PracticePerformance"> | string | null
    lastAttemptedAt?: DateTimeNullableWithAggregatesFilter<"PracticePerformance"> | Date | string | null
    executionId?: StringNullableWithAggregatesFilter<"PracticePerformance"> | string | null
    idempotencyKey?: StringNullableWithAggregatesFilter<"PracticePerformance"> | string | null
  }

  export type UserWeaknessWhereInput = {
    AND?: UserWeaknessWhereInput | UserWeaknessWhereInput[]
    OR?: UserWeaknessWhereInput[]
    NOT?: UserWeaknessWhereInput | UserWeaknessWhereInput[]
    id?: StringFilter<"UserWeakness"> | string
    userId?: StringFilter<"UserWeakness"> | string
    weaknessType?: StringFilter<"UserWeakness"> | string
    weaknessKey?: StringFilter<"UserWeakness"> | string
    techniqueTagId?: StringNullableFilter<"UserWeakness"> | string | null
    severity?: FloatFilter<"UserWeakness"> | number
    sampleCount?: IntFilter<"UserWeakness"> | number
    lastUpdated?: DateTimeFilter<"UserWeakness"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    techniqueTag?: XOR<TechniqueTagNullableScalarRelationFilter, TechniqueTagWhereInput> | null
  }

  export type UserWeaknessOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    weaknessType?: SortOrder
    weaknessKey?: SortOrder
    techniqueTagId?: SortOrderInput | SortOrder
    severity?: SortOrder
    sampleCount?: SortOrder
    lastUpdated?: SortOrder
    user?: UserOrderByWithRelationInput
    techniqueTag?: TechniqueTagOrderByWithRelationInput
  }

  export type UserWeaknessWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_weaknessType_weaknessKey?: UserWeaknessUserIdWeaknessTypeWeaknessKeyCompoundUniqueInput
    AND?: UserWeaknessWhereInput | UserWeaknessWhereInput[]
    OR?: UserWeaknessWhereInput[]
    NOT?: UserWeaknessWhereInput | UserWeaknessWhereInput[]
    userId?: StringFilter<"UserWeakness"> | string
    weaknessType?: StringFilter<"UserWeakness"> | string
    weaknessKey?: StringFilter<"UserWeakness"> | string
    techniqueTagId?: StringNullableFilter<"UserWeakness"> | string | null
    severity?: FloatFilter<"UserWeakness"> | number
    sampleCount?: IntFilter<"UserWeakness"> | number
    lastUpdated?: DateTimeFilter<"UserWeakness"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    techniqueTag?: XOR<TechniqueTagNullableScalarRelationFilter, TechniqueTagWhereInput> | null
  }, "id" | "userId_weaknessType_weaknessKey">

  export type UserWeaknessOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    weaknessType?: SortOrder
    weaknessKey?: SortOrder
    techniqueTagId?: SortOrderInput | SortOrder
    severity?: SortOrder
    sampleCount?: SortOrder
    lastUpdated?: SortOrder
    _count?: UserWeaknessCountOrderByAggregateInput
    _avg?: UserWeaknessAvgOrderByAggregateInput
    _max?: UserWeaknessMaxOrderByAggregateInput
    _min?: UserWeaknessMinOrderByAggregateInput
    _sum?: UserWeaknessSumOrderByAggregateInput
  }

  export type UserWeaknessScalarWhereWithAggregatesInput = {
    AND?: UserWeaknessScalarWhereWithAggregatesInput | UserWeaknessScalarWhereWithAggregatesInput[]
    OR?: UserWeaknessScalarWhereWithAggregatesInput[]
    NOT?: UserWeaknessScalarWhereWithAggregatesInput | UserWeaknessScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserWeakness"> | string
    userId?: StringWithAggregatesFilter<"UserWeakness"> | string
    weaknessType?: StringWithAggregatesFilter<"UserWeakness"> | string
    weaknessKey?: StringWithAggregatesFilter<"UserWeakness"> | string
    techniqueTagId?: StringNullableWithAggregatesFilter<"UserWeakness"> | string | null
    severity?: FloatWithAggregatesFilter<"UserWeakness"> | number
    sampleCount?: IntWithAggregatesFilter<"UserWeakness"> | number
    lastUpdated?: DateTimeWithAggregatesFilter<"UserWeakness"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutUserInput
    scores?: ScoreCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutUserInput
    scores?: ScoreUncheckedCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemUncheckedCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutUserNestedInput
    scores?: ScoreUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutUserNestedInput
    scores?: ScoreUncheckedUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScoreCreateInput = {
    id?: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutScoreInput
    createdBy: UserCreateNestedOneWithoutScoresInput
  }

  export type ScoreUncheckedCreateInput = {
    id?: string
    createdById: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutScoreInput
  }

  export type ScoreUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutScoreNestedInput
    createdBy?: UserUpdateOneRequiredWithoutScoresNestedInput
  }

  export type ScoreUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutScoreNestedInput
  }

  export type ScoreCreateManyInput = {
    id?: string
    createdById: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
  }

  export type ScoreUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ScoreUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceCreateInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    score: ScoreCreateNestedOneWithoutPerformancesInput
    user: UserCreateNestedOneWithoutPerformancesInput
  }

  export type PerformanceUncheckedCreateInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    userId: string
    scoreId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PerformanceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    score?: ScoreUpdateOneRequiredWithoutPerformancesNestedInput
    user?: UserUpdateOneRequiredWithoutPerformancesNestedInput
  }

  export type PerformanceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    userId?: StringFieldUpdateOperationsInput | string
    scoreId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PerformanceCreateManyInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    userId: string
    scoreId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PerformanceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PerformanceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    userId?: StringFieldUpdateOperationsInput | string
    scoreId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticeItemCreateInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    owner?: UserCreateNestedOneWithoutPracticeItemsInput
    techniques?: PracticeItemTechniqueCreateNestedManyWithoutPracticeItemInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemUncheckedCreateInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    ownerUserId?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    techniques?: PracticeItemTechniqueUncheckedCreateNestedManyWithoutPracticeItemInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneWithoutPracticeItemsNestedInput
    techniques?: PracticeItemTechniqueUpdateManyWithoutPracticeItemNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    ownerUserId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    techniques?: PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemCreateManyInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    ownerUserId?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PracticeItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PracticeItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    ownerUserId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TechniqueTagCreateInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    practiceItems?: PracticeItemTechniqueCreateNestedManyWithoutTechniqueTagInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagUncheckedCreateInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    practiceItems?: PracticeItemTechniqueUncheckedCreateNestedManyWithoutTechniqueTagInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    practiceItems?: PracticeItemTechniqueUpdateManyWithoutTechniqueTagNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutTechniqueTagNestedInput
  }

  export type TechniqueTagUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    practiceItems?: PracticeItemTechniqueUncheckedUpdateManyWithoutTechniqueTagNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutTechniqueTagNestedInput
  }

  export type TechniqueTagCreateManyInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
  }

  export type TechniqueTagUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
  }

  export type TechniqueTagUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
  }

  export type PracticeItemTechniqueCreateInput = {
    isPrimary?: boolean
    practiceItem: PracticeItemCreateNestedOneWithoutTechniquesInput
    techniqueTag: TechniqueTagCreateNestedOneWithoutPracticeItemsInput
  }

  export type PracticeItemTechniqueUncheckedCreateInput = {
    practiceItemId: string
    techniqueTagId: string
    isPrimary?: boolean
  }

  export type PracticeItemTechniqueUpdateInput = {
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    practiceItem?: PracticeItemUpdateOneRequiredWithoutTechniquesNestedInput
    techniqueTag?: TechniqueTagUpdateOneRequiredWithoutPracticeItemsNestedInput
  }

  export type PracticeItemTechniqueUncheckedUpdateInput = {
    practiceItemId?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticeItemTechniqueCreateManyInput = {
    practiceItemId: string
    techniqueTagId: string
    isPrimary?: boolean
  }

  export type PracticeItemTechniqueUpdateManyMutationInput = {
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticeItemTechniqueUncheckedUpdateManyInput = {
    practiceItemId?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticePerformanceCreateInput = {
    id?: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    user: UserCreateNestedOneWithoutPracticePerformancesInput
    practiceItem: PracticeItemCreateNestedOneWithoutPracticePerformancesInput
  }

  export type PracticePerformanceUncheckedCreateInput = {
    id?: string
    userId: string
    practiceItemId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PracticePerformanceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutPracticePerformancesNestedInput
    practiceItem?: PracticeItemUpdateOneRequiredWithoutPracticePerformancesNestedInput
  }

  export type PracticePerformanceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    practiceItemId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticePerformanceCreateManyInput = {
    id?: string
    userId: string
    practiceItemId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PracticePerformanceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticePerformanceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    practiceItemId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserWeaknessCreateInput = {
    id?: string
    weaknessType: string
    weaknessKey: string
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
    user: UserCreateNestedOneWithoutWeaknessesInput
    techniqueTag?: TechniqueTagCreateNestedOneWithoutWeaknessesInput
  }

  export type UserWeaknessUncheckedCreateInput = {
    id?: string
    userId: string
    weaknessType: string
    weaknessKey: string
    techniqueTagId?: string | null
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type UserWeaknessUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWeaknessesNestedInput
    techniqueTag?: TechniqueTagUpdateOneWithoutWeaknessesNestedInput
  }

  export type UserWeaknessUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserWeaknessCreateManyInput = {
    id?: string
    userId: string
    weaknessType: string
    weaknessKey: string
    techniqueTagId?: string | null
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type UserWeaknessUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserWeaknessUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PerformanceListRelationFilter = {
    every?: PerformanceWhereInput
    some?: PerformanceWhereInput
    none?: PerformanceWhereInput
  }

  export type ScoreListRelationFilter = {
    every?: ScoreWhereInput
    some?: ScoreWhereInput
    none?: ScoreWhereInput
  }

  export type PracticeItemListRelationFilter = {
    every?: PracticeItemWhereInput
    some?: PracticeItemWhereInput
    none?: PracticeItemWhereInput
  }

  export type PracticePerformanceListRelationFilter = {
    every?: PracticePerformanceWhereInput
    some?: PracticePerformanceWhereInput
    none?: PracticePerformanceWhereInput
  }

  export type UserWeaknessListRelationFilter = {
    every?: UserWeaknessWhereInput
    some?: UserWeaknessWhereInput
    none?: UserWeaknessWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PerformanceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ScoreOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PracticeItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PracticePerformanceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserWeaknessOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    supabaseUserId?: SortOrder
    name?: SortOrder
    role?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    supabaseUserId?: SortOrder
    name?: SortOrder
    role?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    supabaseUserId?: SortOrder
    name?: SortOrder
    role?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ScoreCountOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    arranger?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    timeNumerator?: SortOrder
    timeDenominator?: SortOrder
    defaultTempo?: SortOrder
    isShared?: SortOrder
    createdAt?: SortOrder
  }

  export type ScoreAvgOrderByAggregateInput = {
    retryCount?: SortOrder
    timeNumerator?: SortOrder
    timeDenominator?: SortOrder
    defaultTempo?: SortOrder
  }

  export type ScoreMaxOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    arranger?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    timeNumerator?: SortOrder
    timeDenominator?: SortOrder
    defaultTempo?: SortOrder
    isShared?: SortOrder
    createdAt?: SortOrder
  }

  export type ScoreMinOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    arranger?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    timeNumerator?: SortOrder
    timeDenominator?: SortOrder
    defaultTempo?: SortOrder
    isShared?: SortOrder
    createdAt?: SortOrder
  }

  export type ScoreSumOrderByAggregateInput = {
    retryCount?: SortOrder
    timeNumerator?: SortOrder
    timeDenominator?: SortOrder
    defaultTempo?: SortOrder
  }

  export type EnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumPerformanceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceType | EnumPerformanceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceTypeFilter<$PrismaModel> | $Enums.PerformanceType
  }

  export type EnumPerformanceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceStatus | EnumPerformanceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceStatusFilter<$PrismaModel> | $Enums.PerformanceStatus
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ScoreScalarRelationFilter = {
    is?: ScoreWhereInput
    isNot?: ScoreWhereInput
  }

  export type PerformanceCountOrderByAggregateInput = {
    id?: SortOrder
    performanceType?: SortOrder
    performanceStatus?: SortOrder
    userId?: SortOrder
    scoreId?: SortOrder
    audioPath?: SortOrder
    audioFeaturesPath?: SortOrder
    comparisonResultPath?: SortOrder
    pseudoXmlPath?: SortOrder
    performanceDuration?: SortOrder
    performanceDate?: SortOrder
    uploadedAt?: SortOrder
    createdAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisSummary?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PerformanceAvgOrderByAggregateInput = {
    performanceDuration?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    retryCount?: SortOrder
  }

  export type PerformanceMaxOrderByAggregateInput = {
    id?: SortOrder
    performanceType?: SortOrder
    performanceStatus?: SortOrder
    userId?: SortOrder
    scoreId?: SortOrder
    audioPath?: SortOrder
    audioFeaturesPath?: SortOrder
    comparisonResultPath?: SortOrder
    pseudoXmlPath?: SortOrder
    performanceDuration?: SortOrder
    performanceDate?: SortOrder
    uploadedAt?: SortOrder
    createdAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PerformanceMinOrderByAggregateInput = {
    id?: SortOrder
    performanceType?: SortOrder
    performanceStatus?: SortOrder
    userId?: SortOrder
    scoreId?: SortOrder
    audioPath?: SortOrder
    audioFeaturesPath?: SortOrder
    comparisonResultPath?: SortOrder
    pseudoXmlPath?: SortOrder
    performanceDuration?: SortOrder
    performanceDate?: SortOrder
    uploadedAt?: SortOrder
    createdAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PerformanceSumOrderByAggregateInput = {
    performanceDuration?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    retryCount?: SortOrder
  }

  export type EnumPerformanceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceType | EnumPerformanceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceTypeWithAggregatesFilter<$PrismaModel> | $Enums.PerformanceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPerformanceTypeFilter<$PrismaModel>
    _max?: NestedEnumPerformanceTypeFilter<$PrismaModel>
  }

  export type EnumPerformanceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceStatus | EnumPerformanceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceStatusWithAggregatesFilter<$PrismaModel> | $Enums.PerformanceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPerformanceStatusFilter<$PrismaModel>
    _max?: NestedEnumPerformanceStatusFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumPracticeCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PracticeCategory | EnumPracticeCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPracticeCategoryFilter<$PrismaModel> | $Enums.PracticeCategory
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type PracticeItemTechniqueListRelationFilter = {
    every?: PracticeItemTechniqueWhereInput
    some?: PracticeItemTechniqueWhereInput
    none?: PracticeItemTechniqueWhereInput
  }

  export type PracticeItemTechniqueOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PracticeItemCountOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    description?: SortOrder
    descriptionShort?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    tempoMin?: SortOrder
    tempoMax?: SortOrder
    positions?: SortOrder
    instrument?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    ownerUserId?: SortOrder
    source?: SortOrder
    sortOrder?: SortOrder
    isPublished?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PracticeItemAvgOrderByAggregateInput = {
    tempoMin?: SortOrder
    tempoMax?: SortOrder
    retryCount?: SortOrder
    sortOrder?: SortOrder
  }

  export type PracticeItemMaxOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    description?: SortOrder
    descriptionShort?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    tempoMin?: SortOrder
    tempoMax?: SortOrder
    instrument?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    ownerUserId?: SortOrder
    source?: SortOrder
    sortOrder?: SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PracticeItemMinOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    title?: SortOrder
    composer?: SortOrder
    description?: SortOrder
    descriptionShort?: SortOrder
    keyTonic?: SortOrder
    keyMode?: SortOrder
    tempoMin?: SortOrder
    tempoMax?: SortOrder
    instrument?: SortOrder
    originalXmlPath?: SortOrder
    generatedXmlPath?: SortOrder
    analysisPath?: SortOrder
    analysisStatus?: SortOrder
    buildStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
    ownerUserId?: SortOrder
    source?: SortOrder
    sortOrder?: SortOrder
    isPublished?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PracticeItemSumOrderByAggregateInput = {
    tempoMin?: SortOrder
    tempoMax?: SortOrder
    retryCount?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumPracticeCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PracticeCategory | EnumPracticeCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPracticeCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PracticeCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPracticeCategoryFilter<$PrismaModel>
    _max?: NestedEnumPracticeCategoryFilter<$PrismaModel>
  }

  export type TechniqueTagCategoryNameCompoundUniqueInput = {
    category: string
    name: string
  }

  export type TechniqueTagCountOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    name?: SortOrder
    nameEn?: SortOrder
    description?: SortOrder
    xmlTags?: SortOrder
    isAnalyzable?: SortOrder
    implementStatus?: SortOrder
  }

  export type TechniqueTagMaxOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    name?: SortOrder
    nameEn?: SortOrder
    description?: SortOrder
    isAnalyzable?: SortOrder
    implementStatus?: SortOrder
  }

  export type TechniqueTagMinOrderByAggregateInput = {
    id?: SortOrder
    category?: SortOrder
    name?: SortOrder
    nameEn?: SortOrder
    description?: SortOrder
    isAnalyzable?: SortOrder
    implementStatus?: SortOrder
  }

  export type PracticeItemScalarRelationFilter = {
    is?: PracticeItemWhereInput
    isNot?: PracticeItemWhereInput
  }

  export type TechniqueTagScalarRelationFilter = {
    is?: TechniqueTagWhereInput
    isNot?: TechniqueTagWhereInput
  }

  export type PracticeItemTechniquePracticeItemIdTechniqueTagIdCompoundUniqueInput = {
    practiceItemId: string
    techniqueTagId: string
  }

  export type PracticeItemTechniqueCountOrderByAggregateInput = {
    practiceItemId?: SortOrder
    techniqueTagId?: SortOrder
    isPrimary?: SortOrder
  }

  export type PracticeItemTechniqueMaxOrderByAggregateInput = {
    practiceItemId?: SortOrder
    techniqueTagId?: SortOrder
    isPrimary?: SortOrder
  }

  export type PracticeItemTechniqueMinOrderByAggregateInput = {
    practiceItemId?: SortOrder
    techniqueTagId?: SortOrder
    isPrimary?: SortOrder
  }

  export type PracticePerformanceCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    practiceItemId?: SortOrder
    audioPath?: SortOrder
    comparisonResultPath?: SortOrder
    performanceDuration?: SortOrder
    uploadedAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisSummary?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PracticePerformanceAvgOrderByAggregateInput = {
    performanceDuration?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    retryCount?: SortOrder
  }

  export type PracticePerformanceMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    practiceItemId?: SortOrder
    audioPath?: SortOrder
    comparisonResultPath?: SortOrder
    performanceDuration?: SortOrder
    uploadedAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PracticePerformanceMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    practiceItemId?: SortOrder
    audioPath?: SortOrder
    comparisonResultPath?: SortOrder
    performanceDuration?: SortOrder
    uploadedAt?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    analysisStatus?: SortOrder
    retryCount?: SortOrder
    errorMessage?: SortOrder
    lastAttemptedAt?: SortOrder
    executionId?: SortOrder
    idempotencyKey?: SortOrder
  }

  export type PracticePerformanceSumOrderByAggregateInput = {
    performanceDuration?: SortOrder
    pitchAccuracy?: SortOrder
    timingAccuracy?: SortOrder
    overallScore?: SortOrder
    evaluatedNotes?: SortOrder
    retryCount?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TechniqueTagNullableScalarRelationFilter = {
    is?: TechniqueTagWhereInput | null
    isNot?: TechniqueTagWhereInput | null
  }

  export type UserWeaknessUserIdWeaknessTypeWeaknessKeyCompoundUniqueInput = {
    userId: string
    weaknessType: string
    weaknessKey: string
  }

  export type UserWeaknessCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    weaknessType?: SortOrder
    weaknessKey?: SortOrder
    techniqueTagId?: SortOrder
    severity?: SortOrder
    sampleCount?: SortOrder
    lastUpdated?: SortOrder
  }

  export type UserWeaknessAvgOrderByAggregateInput = {
    severity?: SortOrder
    sampleCount?: SortOrder
  }

  export type UserWeaknessMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    weaknessType?: SortOrder
    weaknessKey?: SortOrder
    techniqueTagId?: SortOrder
    severity?: SortOrder
    sampleCount?: SortOrder
    lastUpdated?: SortOrder
  }

  export type UserWeaknessMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    weaknessType?: SortOrder
    weaknessKey?: SortOrder
    techniqueTagId?: SortOrder
    severity?: SortOrder
    sampleCount?: SortOrder
    lastUpdated?: SortOrder
  }

  export type UserWeaknessSumOrderByAggregateInput = {
    severity?: SortOrder
    sampleCount?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type PerformanceCreateNestedManyWithoutUserInput = {
    create?: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput> | PerformanceCreateWithoutUserInput[] | PerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutUserInput | PerformanceCreateOrConnectWithoutUserInput[]
    createMany?: PerformanceCreateManyUserInputEnvelope
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
  }

  export type ScoreCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput> | ScoreCreateWithoutCreatedByInput[] | ScoreUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ScoreCreateOrConnectWithoutCreatedByInput | ScoreCreateOrConnectWithoutCreatedByInput[]
    createMany?: ScoreCreateManyCreatedByInputEnvelope
    connect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
  }

  export type PracticeItemCreateNestedManyWithoutOwnerInput = {
    create?: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput> | PracticeItemCreateWithoutOwnerInput[] | PracticeItemUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PracticeItemCreateOrConnectWithoutOwnerInput | PracticeItemCreateOrConnectWithoutOwnerInput[]
    createMany?: PracticeItemCreateManyOwnerInputEnvelope
    connect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
  }

  export type PracticePerformanceCreateNestedManyWithoutUserInput = {
    create?: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput> | PracticePerformanceCreateWithoutUserInput[] | PracticePerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutUserInput | PracticePerformanceCreateOrConnectWithoutUserInput[]
    createMany?: PracticePerformanceCreateManyUserInputEnvelope
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
  }

  export type UserWeaknessCreateNestedManyWithoutUserInput = {
    create?: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput> | UserWeaknessCreateWithoutUserInput[] | UserWeaknessUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutUserInput | UserWeaknessCreateOrConnectWithoutUserInput[]
    createMany?: UserWeaknessCreateManyUserInputEnvelope
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
  }

  export type PerformanceUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput> | PerformanceCreateWithoutUserInput[] | PerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutUserInput | PerformanceCreateOrConnectWithoutUserInput[]
    createMany?: PerformanceCreateManyUserInputEnvelope
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
  }

  export type ScoreUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput> | ScoreCreateWithoutCreatedByInput[] | ScoreUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ScoreCreateOrConnectWithoutCreatedByInput | ScoreCreateOrConnectWithoutCreatedByInput[]
    createMany?: ScoreCreateManyCreatedByInputEnvelope
    connect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
  }

  export type PracticeItemUncheckedCreateNestedManyWithoutOwnerInput = {
    create?: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput> | PracticeItemCreateWithoutOwnerInput[] | PracticeItemUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PracticeItemCreateOrConnectWithoutOwnerInput | PracticeItemCreateOrConnectWithoutOwnerInput[]
    createMany?: PracticeItemCreateManyOwnerInputEnvelope
    connect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
  }

  export type PracticePerformanceUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput> | PracticePerformanceCreateWithoutUserInput[] | PracticePerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutUserInput | PracticePerformanceCreateOrConnectWithoutUserInput[]
    createMany?: PracticePerformanceCreateManyUserInputEnvelope
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
  }

  export type UserWeaknessUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput> | UserWeaknessCreateWithoutUserInput[] | UserWeaknessUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutUserInput | UserWeaknessCreateOrConnectWithoutUserInput[]
    createMany?: UserWeaknessCreateManyUserInputEnvelope
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PerformanceUpdateManyWithoutUserNestedInput = {
    create?: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput> | PerformanceCreateWithoutUserInput[] | PerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutUserInput | PerformanceCreateOrConnectWithoutUserInput[]
    upsert?: PerformanceUpsertWithWhereUniqueWithoutUserInput | PerformanceUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PerformanceCreateManyUserInputEnvelope
    set?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    disconnect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    delete?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    update?: PerformanceUpdateWithWhereUniqueWithoutUserInput | PerformanceUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PerformanceUpdateManyWithWhereWithoutUserInput | PerformanceUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
  }

  export type ScoreUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput> | ScoreCreateWithoutCreatedByInput[] | ScoreUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ScoreCreateOrConnectWithoutCreatedByInput | ScoreCreateOrConnectWithoutCreatedByInput[]
    upsert?: ScoreUpsertWithWhereUniqueWithoutCreatedByInput | ScoreUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: ScoreCreateManyCreatedByInputEnvelope
    set?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    disconnect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    delete?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    connect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    update?: ScoreUpdateWithWhereUniqueWithoutCreatedByInput | ScoreUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: ScoreUpdateManyWithWhereWithoutCreatedByInput | ScoreUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: ScoreScalarWhereInput | ScoreScalarWhereInput[]
  }

  export type PracticeItemUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput> | PracticeItemCreateWithoutOwnerInput[] | PracticeItemUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PracticeItemCreateOrConnectWithoutOwnerInput | PracticeItemCreateOrConnectWithoutOwnerInput[]
    upsert?: PracticeItemUpsertWithWhereUniqueWithoutOwnerInput | PracticeItemUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: PracticeItemCreateManyOwnerInputEnvelope
    set?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    disconnect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    delete?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    connect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    update?: PracticeItemUpdateWithWhereUniqueWithoutOwnerInput | PracticeItemUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: PracticeItemUpdateManyWithWhereWithoutOwnerInput | PracticeItemUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: PracticeItemScalarWhereInput | PracticeItemScalarWhereInput[]
  }

  export type PracticePerformanceUpdateManyWithoutUserNestedInput = {
    create?: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput> | PracticePerformanceCreateWithoutUserInput[] | PracticePerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutUserInput | PracticePerformanceCreateOrConnectWithoutUserInput[]
    upsert?: PracticePerformanceUpsertWithWhereUniqueWithoutUserInput | PracticePerformanceUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PracticePerformanceCreateManyUserInputEnvelope
    set?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    disconnect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    delete?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    update?: PracticePerformanceUpdateWithWhereUniqueWithoutUserInput | PracticePerformanceUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PracticePerformanceUpdateManyWithWhereWithoutUserInput | PracticePerformanceUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
  }

  export type UserWeaknessUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput> | UserWeaknessCreateWithoutUserInput[] | UserWeaknessUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutUserInput | UserWeaknessCreateOrConnectWithoutUserInput[]
    upsert?: UserWeaknessUpsertWithWhereUniqueWithoutUserInput | UserWeaknessUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserWeaknessCreateManyUserInputEnvelope
    set?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    disconnect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    delete?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    update?: UserWeaknessUpdateWithWhereUniqueWithoutUserInput | UserWeaknessUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserWeaknessUpdateManyWithWhereWithoutUserInput | UserWeaknessUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
  }

  export type PerformanceUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput> | PerformanceCreateWithoutUserInput[] | PerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutUserInput | PerformanceCreateOrConnectWithoutUserInput[]
    upsert?: PerformanceUpsertWithWhereUniqueWithoutUserInput | PerformanceUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PerformanceCreateManyUserInputEnvelope
    set?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    disconnect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    delete?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    update?: PerformanceUpdateWithWhereUniqueWithoutUserInput | PerformanceUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PerformanceUpdateManyWithWhereWithoutUserInput | PerformanceUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
  }

  export type ScoreUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput> | ScoreCreateWithoutCreatedByInput[] | ScoreUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ScoreCreateOrConnectWithoutCreatedByInput | ScoreCreateOrConnectWithoutCreatedByInput[]
    upsert?: ScoreUpsertWithWhereUniqueWithoutCreatedByInput | ScoreUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: ScoreCreateManyCreatedByInputEnvelope
    set?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    disconnect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    delete?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    connect?: ScoreWhereUniqueInput | ScoreWhereUniqueInput[]
    update?: ScoreUpdateWithWhereUniqueWithoutCreatedByInput | ScoreUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: ScoreUpdateManyWithWhereWithoutCreatedByInput | ScoreUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: ScoreScalarWhereInput | ScoreScalarWhereInput[]
  }

  export type PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput> | PracticeItemCreateWithoutOwnerInput[] | PracticeItemUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PracticeItemCreateOrConnectWithoutOwnerInput | PracticeItemCreateOrConnectWithoutOwnerInput[]
    upsert?: PracticeItemUpsertWithWhereUniqueWithoutOwnerInput | PracticeItemUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: PracticeItemCreateManyOwnerInputEnvelope
    set?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    disconnect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    delete?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    connect?: PracticeItemWhereUniqueInput | PracticeItemWhereUniqueInput[]
    update?: PracticeItemUpdateWithWhereUniqueWithoutOwnerInput | PracticeItemUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: PracticeItemUpdateManyWithWhereWithoutOwnerInput | PracticeItemUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: PracticeItemScalarWhereInput | PracticeItemScalarWhereInput[]
  }

  export type PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput> | PracticePerformanceCreateWithoutUserInput[] | PracticePerformanceUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutUserInput | PracticePerformanceCreateOrConnectWithoutUserInput[]
    upsert?: PracticePerformanceUpsertWithWhereUniqueWithoutUserInput | PracticePerformanceUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PracticePerformanceCreateManyUserInputEnvelope
    set?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    disconnect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    delete?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    update?: PracticePerformanceUpdateWithWhereUniqueWithoutUserInput | PracticePerformanceUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PracticePerformanceUpdateManyWithWhereWithoutUserInput | PracticePerformanceUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
  }

  export type UserWeaknessUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput> | UserWeaknessCreateWithoutUserInput[] | UserWeaknessUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutUserInput | UserWeaknessCreateOrConnectWithoutUserInput[]
    upsert?: UserWeaknessUpsertWithWhereUniqueWithoutUserInput | UserWeaknessUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserWeaknessCreateManyUserInputEnvelope
    set?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    disconnect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    delete?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    update?: UserWeaknessUpdateWithWhereUniqueWithoutUserInput | UserWeaknessUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserWeaknessUpdateManyWithWhereWithoutUserInput | UserWeaknessUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
  }

  export type PerformanceCreateNestedManyWithoutScoreInput = {
    create?: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput> | PerformanceCreateWithoutScoreInput[] | PerformanceUncheckedCreateWithoutScoreInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutScoreInput | PerformanceCreateOrConnectWithoutScoreInput[]
    createMany?: PerformanceCreateManyScoreInputEnvelope
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutScoresInput = {
    create?: XOR<UserCreateWithoutScoresInput, UserUncheckedCreateWithoutScoresInput>
    connectOrCreate?: UserCreateOrConnectWithoutScoresInput
    connect?: UserWhereUniqueInput
  }

  export type PerformanceUncheckedCreateNestedManyWithoutScoreInput = {
    create?: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput> | PerformanceCreateWithoutScoreInput[] | PerformanceUncheckedCreateWithoutScoreInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutScoreInput | PerformanceCreateOrConnectWithoutScoreInput[]
    createMany?: PerformanceCreateManyScoreInputEnvelope
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
  }

  export type EnumJobStatusFieldUpdateOperationsInput = {
    set?: $Enums.JobStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type PerformanceUpdateManyWithoutScoreNestedInput = {
    create?: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput> | PerformanceCreateWithoutScoreInput[] | PerformanceUncheckedCreateWithoutScoreInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutScoreInput | PerformanceCreateOrConnectWithoutScoreInput[]
    upsert?: PerformanceUpsertWithWhereUniqueWithoutScoreInput | PerformanceUpsertWithWhereUniqueWithoutScoreInput[]
    createMany?: PerformanceCreateManyScoreInputEnvelope
    set?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    disconnect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    delete?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    update?: PerformanceUpdateWithWhereUniqueWithoutScoreInput | PerformanceUpdateWithWhereUniqueWithoutScoreInput[]
    updateMany?: PerformanceUpdateManyWithWhereWithoutScoreInput | PerformanceUpdateManyWithWhereWithoutScoreInput[]
    deleteMany?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutScoresNestedInput = {
    create?: XOR<UserCreateWithoutScoresInput, UserUncheckedCreateWithoutScoresInput>
    connectOrCreate?: UserCreateOrConnectWithoutScoresInput
    upsert?: UserUpsertWithoutScoresInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutScoresInput, UserUpdateWithoutScoresInput>, UserUncheckedUpdateWithoutScoresInput>
  }

  export type PerformanceUncheckedUpdateManyWithoutScoreNestedInput = {
    create?: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput> | PerformanceCreateWithoutScoreInput[] | PerformanceUncheckedCreateWithoutScoreInput[]
    connectOrCreate?: PerformanceCreateOrConnectWithoutScoreInput | PerformanceCreateOrConnectWithoutScoreInput[]
    upsert?: PerformanceUpsertWithWhereUniqueWithoutScoreInput | PerformanceUpsertWithWhereUniqueWithoutScoreInput[]
    createMany?: PerformanceCreateManyScoreInputEnvelope
    set?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    disconnect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    delete?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    connect?: PerformanceWhereUniqueInput | PerformanceWhereUniqueInput[]
    update?: PerformanceUpdateWithWhereUniqueWithoutScoreInput | PerformanceUpdateWithWhereUniqueWithoutScoreInput[]
    updateMany?: PerformanceUpdateManyWithWhereWithoutScoreInput | PerformanceUpdateManyWithWhereWithoutScoreInput[]
    deleteMany?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
  }

  export type ScoreCreateNestedOneWithoutPerformancesInput = {
    create?: XOR<ScoreCreateWithoutPerformancesInput, ScoreUncheckedCreateWithoutPerformancesInput>
    connectOrCreate?: ScoreCreateOrConnectWithoutPerformancesInput
    connect?: ScoreWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutPerformancesInput = {
    create?: XOR<UserCreateWithoutPerformancesInput, UserUncheckedCreateWithoutPerformancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPerformancesInput
    connect?: UserWhereUniqueInput
  }

  export type EnumPerformanceTypeFieldUpdateOperationsInput = {
    set?: $Enums.PerformanceType
  }

  export type EnumPerformanceStatusFieldUpdateOperationsInput = {
    set?: $Enums.PerformanceStatus
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ScoreUpdateOneRequiredWithoutPerformancesNestedInput = {
    create?: XOR<ScoreCreateWithoutPerformancesInput, ScoreUncheckedCreateWithoutPerformancesInput>
    connectOrCreate?: ScoreCreateOrConnectWithoutPerformancesInput
    upsert?: ScoreUpsertWithoutPerformancesInput
    connect?: ScoreWhereUniqueInput
    update?: XOR<XOR<ScoreUpdateToOneWithWhereWithoutPerformancesInput, ScoreUpdateWithoutPerformancesInput>, ScoreUncheckedUpdateWithoutPerformancesInput>
  }

  export type UserUpdateOneRequiredWithoutPerformancesNestedInput = {
    create?: XOR<UserCreateWithoutPerformancesInput, UserUncheckedCreateWithoutPerformancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPerformancesInput
    upsert?: UserUpsertWithoutPerformancesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPerformancesInput, UserUpdateWithoutPerformancesInput>, UserUncheckedUpdateWithoutPerformancesInput>
  }

  export type PracticeItemCreatepositionsInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutPracticeItemsInput = {
    create?: XOR<UserCreateWithoutPracticeItemsInput, UserUncheckedCreateWithoutPracticeItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPracticeItemsInput
    connect?: UserWhereUniqueInput
  }

  export type PracticeItemTechniqueCreateNestedManyWithoutPracticeItemInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput> | PracticeItemTechniqueCreateWithoutPracticeItemInput[] | PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput | PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput[]
    createMany?: PracticeItemTechniqueCreateManyPracticeItemInputEnvelope
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
  }

  export type PracticePerformanceCreateNestedManyWithoutPracticeItemInput = {
    create?: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput> | PracticePerformanceCreateWithoutPracticeItemInput[] | PracticePerformanceUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutPracticeItemInput | PracticePerformanceCreateOrConnectWithoutPracticeItemInput[]
    createMany?: PracticePerformanceCreateManyPracticeItemInputEnvelope
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
  }

  export type PracticeItemTechniqueUncheckedCreateNestedManyWithoutPracticeItemInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput> | PracticeItemTechniqueCreateWithoutPracticeItemInput[] | PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput | PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput[]
    createMany?: PracticeItemTechniqueCreateManyPracticeItemInputEnvelope
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
  }

  export type PracticePerformanceUncheckedCreateNestedManyWithoutPracticeItemInput = {
    create?: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput> | PracticePerformanceCreateWithoutPracticeItemInput[] | PracticePerformanceUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutPracticeItemInput | PracticePerformanceCreateOrConnectWithoutPracticeItemInput[]
    createMany?: PracticePerformanceCreateManyPracticeItemInputEnvelope
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
  }

  export type EnumPracticeCategoryFieldUpdateOperationsInput = {
    set?: $Enums.PracticeCategory
  }

  export type PracticeItemUpdatepositionsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneWithoutPracticeItemsNestedInput = {
    create?: XOR<UserCreateWithoutPracticeItemsInput, UserUncheckedCreateWithoutPracticeItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPracticeItemsInput
    upsert?: UserUpsertWithoutPracticeItemsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPracticeItemsInput, UserUpdateWithoutPracticeItemsInput>, UserUncheckedUpdateWithoutPracticeItemsInput>
  }

  export type PracticeItemTechniqueUpdateManyWithoutPracticeItemNestedInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput> | PracticeItemTechniqueCreateWithoutPracticeItemInput[] | PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput | PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput[]
    upsert?: PracticeItemTechniqueUpsertWithWhereUniqueWithoutPracticeItemInput | PracticeItemTechniqueUpsertWithWhereUniqueWithoutPracticeItemInput[]
    createMany?: PracticeItemTechniqueCreateManyPracticeItemInputEnvelope
    set?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    disconnect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    delete?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    update?: PracticeItemTechniqueUpdateWithWhereUniqueWithoutPracticeItemInput | PracticeItemTechniqueUpdateWithWhereUniqueWithoutPracticeItemInput[]
    updateMany?: PracticeItemTechniqueUpdateManyWithWhereWithoutPracticeItemInput | PracticeItemTechniqueUpdateManyWithWhereWithoutPracticeItemInput[]
    deleteMany?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
  }

  export type PracticePerformanceUpdateManyWithoutPracticeItemNestedInput = {
    create?: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput> | PracticePerformanceCreateWithoutPracticeItemInput[] | PracticePerformanceUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutPracticeItemInput | PracticePerformanceCreateOrConnectWithoutPracticeItemInput[]
    upsert?: PracticePerformanceUpsertWithWhereUniqueWithoutPracticeItemInput | PracticePerformanceUpsertWithWhereUniqueWithoutPracticeItemInput[]
    createMany?: PracticePerformanceCreateManyPracticeItemInputEnvelope
    set?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    disconnect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    delete?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    update?: PracticePerformanceUpdateWithWhereUniqueWithoutPracticeItemInput | PracticePerformanceUpdateWithWhereUniqueWithoutPracticeItemInput[]
    updateMany?: PracticePerformanceUpdateManyWithWhereWithoutPracticeItemInput | PracticePerformanceUpdateManyWithWhereWithoutPracticeItemInput[]
    deleteMany?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
  }

  export type PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemNestedInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput> | PracticeItemTechniqueCreateWithoutPracticeItemInput[] | PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput | PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput[]
    upsert?: PracticeItemTechniqueUpsertWithWhereUniqueWithoutPracticeItemInput | PracticeItemTechniqueUpsertWithWhereUniqueWithoutPracticeItemInput[]
    createMany?: PracticeItemTechniqueCreateManyPracticeItemInputEnvelope
    set?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    disconnect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    delete?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    update?: PracticeItemTechniqueUpdateWithWhereUniqueWithoutPracticeItemInput | PracticeItemTechniqueUpdateWithWhereUniqueWithoutPracticeItemInput[]
    updateMany?: PracticeItemTechniqueUpdateManyWithWhereWithoutPracticeItemInput | PracticeItemTechniqueUpdateManyWithWhereWithoutPracticeItemInput[]
    deleteMany?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
  }

  export type PracticePerformanceUncheckedUpdateManyWithoutPracticeItemNestedInput = {
    create?: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput> | PracticePerformanceCreateWithoutPracticeItemInput[] | PracticePerformanceUncheckedCreateWithoutPracticeItemInput[]
    connectOrCreate?: PracticePerformanceCreateOrConnectWithoutPracticeItemInput | PracticePerformanceCreateOrConnectWithoutPracticeItemInput[]
    upsert?: PracticePerformanceUpsertWithWhereUniqueWithoutPracticeItemInput | PracticePerformanceUpsertWithWhereUniqueWithoutPracticeItemInput[]
    createMany?: PracticePerformanceCreateManyPracticeItemInputEnvelope
    set?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    disconnect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    delete?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    connect?: PracticePerformanceWhereUniqueInput | PracticePerformanceWhereUniqueInput[]
    update?: PracticePerformanceUpdateWithWhereUniqueWithoutPracticeItemInput | PracticePerformanceUpdateWithWhereUniqueWithoutPracticeItemInput[]
    updateMany?: PracticePerformanceUpdateManyWithWhereWithoutPracticeItemInput | PracticePerformanceUpdateManyWithWhereWithoutPracticeItemInput[]
    deleteMany?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
  }

  export type TechniqueTagCreatexmlTagsInput = {
    set: string[]
  }

  export type PracticeItemTechniqueCreateNestedManyWithoutTechniqueTagInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput> | PracticeItemTechniqueCreateWithoutTechniqueTagInput[] | PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput | PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput[]
    createMany?: PracticeItemTechniqueCreateManyTechniqueTagInputEnvelope
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
  }

  export type UserWeaknessCreateNestedManyWithoutTechniqueTagInput = {
    create?: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput> | UserWeaknessCreateWithoutTechniqueTagInput[] | UserWeaknessUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutTechniqueTagInput | UserWeaknessCreateOrConnectWithoutTechniqueTagInput[]
    createMany?: UserWeaknessCreateManyTechniqueTagInputEnvelope
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
  }

  export type PracticeItemTechniqueUncheckedCreateNestedManyWithoutTechniqueTagInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput> | PracticeItemTechniqueCreateWithoutTechniqueTagInput[] | PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput | PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput[]
    createMany?: PracticeItemTechniqueCreateManyTechniqueTagInputEnvelope
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
  }

  export type UserWeaknessUncheckedCreateNestedManyWithoutTechniqueTagInput = {
    create?: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput> | UserWeaknessCreateWithoutTechniqueTagInput[] | UserWeaknessUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutTechniqueTagInput | UserWeaknessCreateOrConnectWithoutTechniqueTagInput[]
    createMany?: UserWeaknessCreateManyTechniqueTagInputEnvelope
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
  }

  export type TechniqueTagUpdatexmlTagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type PracticeItemTechniqueUpdateManyWithoutTechniqueTagNestedInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput> | PracticeItemTechniqueCreateWithoutTechniqueTagInput[] | PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput | PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput[]
    upsert?: PracticeItemTechniqueUpsertWithWhereUniqueWithoutTechniqueTagInput | PracticeItemTechniqueUpsertWithWhereUniqueWithoutTechniqueTagInput[]
    createMany?: PracticeItemTechniqueCreateManyTechniqueTagInputEnvelope
    set?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    disconnect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    delete?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    update?: PracticeItemTechniqueUpdateWithWhereUniqueWithoutTechniqueTagInput | PracticeItemTechniqueUpdateWithWhereUniqueWithoutTechniqueTagInput[]
    updateMany?: PracticeItemTechniqueUpdateManyWithWhereWithoutTechniqueTagInput | PracticeItemTechniqueUpdateManyWithWhereWithoutTechniqueTagInput[]
    deleteMany?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
  }

  export type UserWeaknessUpdateManyWithoutTechniqueTagNestedInput = {
    create?: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput> | UserWeaknessCreateWithoutTechniqueTagInput[] | UserWeaknessUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutTechniqueTagInput | UserWeaknessCreateOrConnectWithoutTechniqueTagInput[]
    upsert?: UserWeaknessUpsertWithWhereUniqueWithoutTechniqueTagInput | UserWeaknessUpsertWithWhereUniqueWithoutTechniqueTagInput[]
    createMany?: UserWeaknessCreateManyTechniqueTagInputEnvelope
    set?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    disconnect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    delete?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    update?: UserWeaknessUpdateWithWhereUniqueWithoutTechniqueTagInput | UserWeaknessUpdateWithWhereUniqueWithoutTechniqueTagInput[]
    updateMany?: UserWeaknessUpdateManyWithWhereWithoutTechniqueTagInput | UserWeaknessUpdateManyWithWhereWithoutTechniqueTagInput[]
    deleteMany?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
  }

  export type PracticeItemTechniqueUncheckedUpdateManyWithoutTechniqueTagNestedInput = {
    create?: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput> | PracticeItemTechniqueCreateWithoutTechniqueTagInput[] | PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput | PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput[]
    upsert?: PracticeItemTechniqueUpsertWithWhereUniqueWithoutTechniqueTagInput | PracticeItemTechniqueUpsertWithWhereUniqueWithoutTechniqueTagInput[]
    createMany?: PracticeItemTechniqueCreateManyTechniqueTagInputEnvelope
    set?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    disconnect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    delete?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    connect?: PracticeItemTechniqueWhereUniqueInput | PracticeItemTechniqueWhereUniqueInput[]
    update?: PracticeItemTechniqueUpdateWithWhereUniqueWithoutTechniqueTagInput | PracticeItemTechniqueUpdateWithWhereUniqueWithoutTechniqueTagInput[]
    updateMany?: PracticeItemTechniqueUpdateManyWithWhereWithoutTechniqueTagInput | PracticeItemTechniqueUpdateManyWithWhereWithoutTechniqueTagInput[]
    deleteMany?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
  }

  export type UserWeaknessUncheckedUpdateManyWithoutTechniqueTagNestedInput = {
    create?: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput> | UserWeaknessCreateWithoutTechniqueTagInput[] | UserWeaknessUncheckedCreateWithoutTechniqueTagInput[]
    connectOrCreate?: UserWeaknessCreateOrConnectWithoutTechniqueTagInput | UserWeaknessCreateOrConnectWithoutTechniqueTagInput[]
    upsert?: UserWeaknessUpsertWithWhereUniqueWithoutTechniqueTagInput | UserWeaknessUpsertWithWhereUniqueWithoutTechniqueTagInput[]
    createMany?: UserWeaknessCreateManyTechniqueTagInputEnvelope
    set?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    disconnect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    delete?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    connect?: UserWeaknessWhereUniqueInput | UserWeaknessWhereUniqueInput[]
    update?: UserWeaknessUpdateWithWhereUniqueWithoutTechniqueTagInput | UserWeaknessUpdateWithWhereUniqueWithoutTechniqueTagInput[]
    updateMany?: UserWeaknessUpdateManyWithWhereWithoutTechniqueTagInput | UserWeaknessUpdateManyWithWhereWithoutTechniqueTagInput[]
    deleteMany?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
  }

  export type PracticeItemCreateNestedOneWithoutTechniquesInput = {
    create?: XOR<PracticeItemCreateWithoutTechniquesInput, PracticeItemUncheckedCreateWithoutTechniquesInput>
    connectOrCreate?: PracticeItemCreateOrConnectWithoutTechniquesInput
    connect?: PracticeItemWhereUniqueInput
  }

  export type TechniqueTagCreateNestedOneWithoutPracticeItemsInput = {
    create?: XOR<TechniqueTagCreateWithoutPracticeItemsInput, TechniqueTagUncheckedCreateWithoutPracticeItemsInput>
    connectOrCreate?: TechniqueTagCreateOrConnectWithoutPracticeItemsInput
    connect?: TechniqueTagWhereUniqueInput
  }

  export type PracticeItemUpdateOneRequiredWithoutTechniquesNestedInput = {
    create?: XOR<PracticeItemCreateWithoutTechniquesInput, PracticeItemUncheckedCreateWithoutTechniquesInput>
    connectOrCreate?: PracticeItemCreateOrConnectWithoutTechniquesInput
    upsert?: PracticeItemUpsertWithoutTechniquesInput
    connect?: PracticeItemWhereUniqueInput
    update?: XOR<XOR<PracticeItemUpdateToOneWithWhereWithoutTechniquesInput, PracticeItemUpdateWithoutTechniquesInput>, PracticeItemUncheckedUpdateWithoutTechniquesInput>
  }

  export type TechniqueTagUpdateOneRequiredWithoutPracticeItemsNestedInput = {
    create?: XOR<TechniqueTagCreateWithoutPracticeItemsInput, TechniqueTagUncheckedCreateWithoutPracticeItemsInput>
    connectOrCreate?: TechniqueTagCreateOrConnectWithoutPracticeItemsInput
    upsert?: TechniqueTagUpsertWithoutPracticeItemsInput
    connect?: TechniqueTagWhereUniqueInput
    update?: XOR<XOR<TechniqueTagUpdateToOneWithWhereWithoutPracticeItemsInput, TechniqueTagUpdateWithoutPracticeItemsInput>, TechniqueTagUncheckedUpdateWithoutPracticeItemsInput>
  }

  export type UserCreateNestedOneWithoutPracticePerformancesInput = {
    create?: XOR<UserCreateWithoutPracticePerformancesInput, UserUncheckedCreateWithoutPracticePerformancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPracticePerformancesInput
    connect?: UserWhereUniqueInput
  }

  export type PracticeItemCreateNestedOneWithoutPracticePerformancesInput = {
    create?: XOR<PracticeItemCreateWithoutPracticePerformancesInput, PracticeItemUncheckedCreateWithoutPracticePerformancesInput>
    connectOrCreate?: PracticeItemCreateOrConnectWithoutPracticePerformancesInput
    connect?: PracticeItemWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPracticePerformancesNestedInput = {
    create?: XOR<UserCreateWithoutPracticePerformancesInput, UserUncheckedCreateWithoutPracticePerformancesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPracticePerformancesInput
    upsert?: UserUpsertWithoutPracticePerformancesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPracticePerformancesInput, UserUpdateWithoutPracticePerformancesInput>, UserUncheckedUpdateWithoutPracticePerformancesInput>
  }

  export type PracticeItemUpdateOneRequiredWithoutPracticePerformancesNestedInput = {
    create?: XOR<PracticeItemCreateWithoutPracticePerformancesInput, PracticeItemUncheckedCreateWithoutPracticePerformancesInput>
    connectOrCreate?: PracticeItemCreateOrConnectWithoutPracticePerformancesInput
    upsert?: PracticeItemUpsertWithoutPracticePerformancesInput
    connect?: PracticeItemWhereUniqueInput
    update?: XOR<XOR<PracticeItemUpdateToOneWithWhereWithoutPracticePerformancesInput, PracticeItemUpdateWithoutPracticePerformancesInput>, PracticeItemUncheckedUpdateWithoutPracticePerformancesInput>
  }

  export type UserCreateNestedOneWithoutWeaknessesInput = {
    create?: XOR<UserCreateWithoutWeaknessesInput, UserUncheckedCreateWithoutWeaknessesInput>
    connectOrCreate?: UserCreateOrConnectWithoutWeaknessesInput
    connect?: UserWhereUniqueInput
  }

  export type TechniqueTagCreateNestedOneWithoutWeaknessesInput = {
    create?: XOR<TechniqueTagCreateWithoutWeaknessesInput, TechniqueTagUncheckedCreateWithoutWeaknessesInput>
    connectOrCreate?: TechniqueTagCreateOrConnectWithoutWeaknessesInput
    connect?: TechniqueTagWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutWeaknessesNestedInput = {
    create?: XOR<UserCreateWithoutWeaknessesInput, UserUncheckedCreateWithoutWeaknessesInput>
    connectOrCreate?: UserCreateOrConnectWithoutWeaknessesInput
    upsert?: UserUpsertWithoutWeaknessesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutWeaknessesInput, UserUpdateWithoutWeaknessesInput>, UserUncheckedUpdateWithoutWeaknessesInput>
  }

  export type TechniqueTagUpdateOneWithoutWeaknessesNestedInput = {
    create?: XOR<TechniqueTagCreateWithoutWeaknessesInput, TechniqueTagUncheckedCreateWithoutWeaknessesInput>
    connectOrCreate?: TechniqueTagCreateOrConnectWithoutWeaknessesInput
    upsert?: TechniqueTagUpsertWithoutWeaknessesInput
    disconnect?: TechniqueTagWhereInput | boolean
    delete?: TechniqueTagWhereInput | boolean
    connect?: TechniqueTagWhereUniqueInput
    update?: XOR<XOR<TechniqueTagUpdateToOneWithWhereWithoutWeaknessesInput, TechniqueTagUpdateWithoutWeaknessesInput>, TechniqueTagUncheckedUpdateWithoutWeaknessesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumJobStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusFilter<$PrismaModel> | $Enums.JobStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumJobStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.JobStatus | EnumJobStatusFieldRefInput<$PrismaModel>
    in?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.JobStatus[] | ListEnumJobStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumJobStatusWithAggregatesFilter<$PrismaModel> | $Enums.JobStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumJobStatusFilter<$PrismaModel>
    _max?: NestedEnumJobStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumPerformanceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceType | EnumPerformanceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceTypeFilter<$PrismaModel> | $Enums.PerformanceType
  }

  export type NestedEnumPerformanceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceStatus | EnumPerformanceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceStatusFilter<$PrismaModel> | $Enums.PerformanceStatus
  }

  export type NestedEnumPerformanceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceType | EnumPerformanceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceType[] | ListEnumPerformanceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceTypeWithAggregatesFilter<$PrismaModel> | $Enums.PerformanceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPerformanceTypeFilter<$PrismaModel>
    _max?: NestedEnumPerformanceTypeFilter<$PrismaModel>
  }

  export type NestedEnumPerformanceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PerformanceStatus | EnumPerformanceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PerformanceStatus[] | ListEnumPerformanceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPerformanceStatusWithAggregatesFilter<$PrismaModel> | $Enums.PerformanceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPerformanceStatusFilter<$PrismaModel>
    _max?: NestedEnumPerformanceStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumPracticeCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.PracticeCategory | EnumPracticeCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPracticeCategoryFilter<$PrismaModel> | $Enums.PracticeCategory
  }

  export type NestedEnumPracticeCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PracticeCategory | EnumPracticeCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.PracticeCategory[] | ListEnumPracticeCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumPracticeCategoryWithAggregatesFilter<$PrismaModel> | $Enums.PracticeCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPracticeCategoryFilter<$PrismaModel>
    _max?: NestedEnumPracticeCategoryFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type PerformanceCreateWithoutUserInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    score: ScoreCreateNestedOneWithoutPerformancesInput
  }

  export type PerformanceUncheckedCreateWithoutUserInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    scoreId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PerformanceCreateOrConnectWithoutUserInput = {
    where: PerformanceWhereUniqueInput
    create: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput>
  }

  export type PerformanceCreateManyUserInputEnvelope = {
    data: PerformanceCreateManyUserInput | PerformanceCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ScoreCreateWithoutCreatedByInput = {
    id?: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutScoreInput
  }

  export type ScoreUncheckedCreateWithoutCreatedByInput = {
    id?: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutScoreInput
  }

  export type ScoreCreateOrConnectWithoutCreatedByInput = {
    where: ScoreWhereUniqueInput
    create: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput>
  }

  export type ScoreCreateManyCreatedByInputEnvelope = {
    data: ScoreCreateManyCreatedByInput | ScoreCreateManyCreatedByInput[]
    skipDuplicates?: boolean
  }

  export type PracticeItemCreateWithoutOwnerInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    techniques?: PracticeItemTechniqueCreateNestedManyWithoutPracticeItemInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemUncheckedCreateWithoutOwnerInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    techniques?: PracticeItemTechniqueUncheckedCreateNestedManyWithoutPracticeItemInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemCreateOrConnectWithoutOwnerInput = {
    where: PracticeItemWhereUniqueInput
    create: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput>
  }

  export type PracticeItemCreateManyOwnerInputEnvelope = {
    data: PracticeItemCreateManyOwnerInput | PracticeItemCreateManyOwnerInput[]
    skipDuplicates?: boolean
  }

  export type PracticePerformanceCreateWithoutUserInput = {
    id?: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    practiceItem: PracticeItemCreateNestedOneWithoutPracticePerformancesInput
  }

  export type PracticePerformanceUncheckedCreateWithoutUserInput = {
    id?: string
    practiceItemId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PracticePerformanceCreateOrConnectWithoutUserInput = {
    where: PracticePerformanceWhereUniqueInput
    create: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput>
  }

  export type PracticePerformanceCreateManyUserInputEnvelope = {
    data: PracticePerformanceCreateManyUserInput | PracticePerformanceCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserWeaknessCreateWithoutUserInput = {
    id?: string
    weaknessType: string
    weaknessKey: string
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
    techniqueTag?: TechniqueTagCreateNestedOneWithoutWeaknessesInput
  }

  export type UserWeaknessUncheckedCreateWithoutUserInput = {
    id?: string
    weaknessType: string
    weaknessKey: string
    techniqueTagId?: string | null
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type UserWeaknessCreateOrConnectWithoutUserInput = {
    where: UserWeaknessWhereUniqueInput
    create: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput>
  }

  export type UserWeaknessCreateManyUserInputEnvelope = {
    data: UserWeaknessCreateManyUserInput | UserWeaknessCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PerformanceUpsertWithWhereUniqueWithoutUserInput = {
    where: PerformanceWhereUniqueInput
    update: XOR<PerformanceUpdateWithoutUserInput, PerformanceUncheckedUpdateWithoutUserInput>
    create: XOR<PerformanceCreateWithoutUserInput, PerformanceUncheckedCreateWithoutUserInput>
  }

  export type PerformanceUpdateWithWhereUniqueWithoutUserInput = {
    where: PerformanceWhereUniqueInput
    data: XOR<PerformanceUpdateWithoutUserInput, PerformanceUncheckedUpdateWithoutUserInput>
  }

  export type PerformanceUpdateManyWithWhereWithoutUserInput = {
    where: PerformanceScalarWhereInput
    data: XOR<PerformanceUpdateManyMutationInput, PerformanceUncheckedUpdateManyWithoutUserInput>
  }

  export type PerformanceScalarWhereInput = {
    AND?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
    OR?: PerformanceScalarWhereInput[]
    NOT?: PerformanceScalarWhereInput | PerformanceScalarWhereInput[]
    id?: StringFilter<"Performance"> | string
    performanceType?: EnumPerformanceTypeFilter<"Performance"> | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFilter<"Performance"> | $Enums.PerformanceStatus
    userId?: StringFilter<"Performance"> | string
    scoreId?: StringFilter<"Performance"> | string
    audioPath?: StringFilter<"Performance"> | string
    audioFeaturesPath?: StringNullableFilter<"Performance"> | string | null
    comparisonResultPath?: StringNullableFilter<"Performance"> | string | null
    pseudoXmlPath?: StringNullableFilter<"Performance"> | string | null
    performanceDuration?: FloatNullableFilter<"Performance"> | number | null
    performanceDate?: DateTimeNullableFilter<"Performance"> | Date | string | null
    uploadedAt?: DateTimeFilter<"Performance"> | Date | string
    createdAt?: DateTimeFilter<"Performance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"Performance"> | number | null
    timingAccuracy?: FloatNullableFilter<"Performance"> | number | null
    overallScore?: FloatNullableFilter<"Performance"> | number | null
    evaluatedNotes?: IntNullableFilter<"Performance"> | number | null
    analysisSummary?: JsonNullableFilter<"Performance">
    analysisStatus?: EnumJobStatusFilter<"Performance"> | $Enums.JobStatus
    retryCount?: IntFilter<"Performance"> | number
    errorMessage?: StringNullableFilter<"Performance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Performance"> | Date | string | null
    executionId?: StringNullableFilter<"Performance"> | string | null
    idempotencyKey?: StringNullableFilter<"Performance"> | string | null
  }

  export type ScoreUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: ScoreWhereUniqueInput
    update: XOR<ScoreUpdateWithoutCreatedByInput, ScoreUncheckedUpdateWithoutCreatedByInput>
    create: XOR<ScoreCreateWithoutCreatedByInput, ScoreUncheckedCreateWithoutCreatedByInput>
  }

  export type ScoreUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: ScoreWhereUniqueInput
    data: XOR<ScoreUpdateWithoutCreatedByInput, ScoreUncheckedUpdateWithoutCreatedByInput>
  }

  export type ScoreUpdateManyWithWhereWithoutCreatedByInput = {
    where: ScoreScalarWhereInput
    data: XOR<ScoreUpdateManyMutationInput, ScoreUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type ScoreScalarWhereInput = {
    AND?: ScoreScalarWhereInput | ScoreScalarWhereInput[]
    OR?: ScoreScalarWhereInput[]
    NOT?: ScoreScalarWhereInput | ScoreScalarWhereInput[]
    id?: StringFilter<"Score"> | string
    createdById?: StringFilter<"Score"> | string
    title?: StringFilter<"Score"> | string
    composer?: StringNullableFilter<"Score"> | string | null
    arranger?: StringNullableFilter<"Score"> | string | null
    originalXmlPath?: StringFilter<"Score"> | string
    generatedXmlPath?: StringNullableFilter<"Score"> | string | null
    analysisStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"Score"> | $Enums.JobStatus
    retryCount?: IntFilter<"Score"> | number
    errorMessage?: StringNullableFilter<"Score"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"Score"> | Date | string | null
    executionId?: StringNullableFilter<"Score"> | string | null
    idempotencyKey?: StringNullableFilter<"Score"> | string | null
    keyTonic?: StringNullableFilter<"Score"> | string | null
    keyMode?: StringNullableFilter<"Score"> | string | null
    timeNumerator?: IntNullableFilter<"Score"> | number | null
    timeDenominator?: IntNullableFilter<"Score"> | number | null
    defaultTempo?: IntNullableFilter<"Score"> | number | null
    isShared?: BoolFilter<"Score"> | boolean
    createdAt?: DateTimeFilter<"Score"> | Date | string
  }

  export type PracticeItemUpsertWithWhereUniqueWithoutOwnerInput = {
    where: PracticeItemWhereUniqueInput
    update: XOR<PracticeItemUpdateWithoutOwnerInput, PracticeItemUncheckedUpdateWithoutOwnerInput>
    create: XOR<PracticeItemCreateWithoutOwnerInput, PracticeItemUncheckedCreateWithoutOwnerInput>
  }

  export type PracticeItemUpdateWithWhereUniqueWithoutOwnerInput = {
    where: PracticeItemWhereUniqueInput
    data: XOR<PracticeItemUpdateWithoutOwnerInput, PracticeItemUncheckedUpdateWithoutOwnerInput>
  }

  export type PracticeItemUpdateManyWithWhereWithoutOwnerInput = {
    where: PracticeItemScalarWhereInput
    data: XOR<PracticeItemUpdateManyMutationInput, PracticeItemUncheckedUpdateManyWithoutOwnerInput>
  }

  export type PracticeItemScalarWhereInput = {
    AND?: PracticeItemScalarWhereInput | PracticeItemScalarWhereInput[]
    OR?: PracticeItemScalarWhereInput[]
    NOT?: PracticeItemScalarWhereInput | PracticeItemScalarWhereInput[]
    id?: StringFilter<"PracticeItem"> | string
    category?: EnumPracticeCategoryFilter<"PracticeItem"> | $Enums.PracticeCategory
    title?: StringFilter<"PracticeItem"> | string
    composer?: StringNullableFilter<"PracticeItem"> | string | null
    description?: StringNullableFilter<"PracticeItem"> | string | null
    descriptionShort?: StringNullableFilter<"PracticeItem"> | string | null
    keyTonic?: StringFilter<"PracticeItem"> | string
    keyMode?: StringFilter<"PracticeItem"> | string
    tempoMin?: IntNullableFilter<"PracticeItem"> | number | null
    tempoMax?: IntNullableFilter<"PracticeItem"> | number | null
    positions?: StringNullableListFilter<"PracticeItem">
    instrument?: StringFilter<"PracticeItem"> | string
    originalXmlPath?: StringFilter<"PracticeItem"> | string
    generatedXmlPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisPath?: StringNullableFilter<"PracticeItem"> | string | null
    analysisStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    buildStatus?: EnumJobStatusFilter<"PracticeItem"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticeItem"> | number
    errorMessage?: StringNullableFilter<"PracticeItem"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticeItem"> | Date | string | null
    executionId?: StringNullableFilter<"PracticeItem"> | string | null
    idempotencyKey?: StringNullableFilter<"PracticeItem"> | string | null
    ownerUserId?: StringNullableFilter<"PracticeItem"> | string | null
    source?: StringNullableFilter<"PracticeItem"> | string | null
    sortOrder?: IntFilter<"PracticeItem"> | number
    isPublished?: BoolFilter<"PracticeItem"> | boolean
    metadata?: JsonNullableFilter<"PracticeItem">
    createdAt?: DateTimeFilter<"PracticeItem"> | Date | string
    updatedAt?: DateTimeFilter<"PracticeItem"> | Date | string
  }

  export type PracticePerformanceUpsertWithWhereUniqueWithoutUserInput = {
    where: PracticePerformanceWhereUniqueInput
    update: XOR<PracticePerformanceUpdateWithoutUserInput, PracticePerformanceUncheckedUpdateWithoutUserInput>
    create: XOR<PracticePerformanceCreateWithoutUserInput, PracticePerformanceUncheckedCreateWithoutUserInput>
  }

  export type PracticePerformanceUpdateWithWhereUniqueWithoutUserInput = {
    where: PracticePerformanceWhereUniqueInput
    data: XOR<PracticePerformanceUpdateWithoutUserInput, PracticePerformanceUncheckedUpdateWithoutUserInput>
  }

  export type PracticePerformanceUpdateManyWithWhereWithoutUserInput = {
    where: PracticePerformanceScalarWhereInput
    data: XOR<PracticePerformanceUpdateManyMutationInput, PracticePerformanceUncheckedUpdateManyWithoutUserInput>
  }

  export type PracticePerformanceScalarWhereInput = {
    AND?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
    OR?: PracticePerformanceScalarWhereInput[]
    NOT?: PracticePerformanceScalarWhereInput | PracticePerformanceScalarWhereInput[]
    id?: StringFilter<"PracticePerformance"> | string
    userId?: StringFilter<"PracticePerformance"> | string
    practiceItemId?: StringFilter<"PracticePerformance"> | string
    audioPath?: StringFilter<"PracticePerformance"> | string
    comparisonResultPath?: StringNullableFilter<"PracticePerformance"> | string | null
    performanceDuration?: FloatNullableFilter<"PracticePerformance"> | number | null
    uploadedAt?: DateTimeFilter<"PracticePerformance"> | Date | string
    pitchAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    timingAccuracy?: FloatNullableFilter<"PracticePerformance"> | number | null
    overallScore?: FloatNullableFilter<"PracticePerformance"> | number | null
    evaluatedNotes?: IntNullableFilter<"PracticePerformance"> | number | null
    analysisSummary?: JsonNullableFilter<"PracticePerformance">
    analysisStatus?: EnumJobStatusFilter<"PracticePerformance"> | $Enums.JobStatus
    retryCount?: IntFilter<"PracticePerformance"> | number
    errorMessage?: StringNullableFilter<"PracticePerformance"> | string | null
    lastAttemptedAt?: DateTimeNullableFilter<"PracticePerformance"> | Date | string | null
    executionId?: StringNullableFilter<"PracticePerformance"> | string | null
    idempotencyKey?: StringNullableFilter<"PracticePerformance"> | string | null
  }

  export type UserWeaknessUpsertWithWhereUniqueWithoutUserInput = {
    where: UserWeaknessWhereUniqueInput
    update: XOR<UserWeaknessUpdateWithoutUserInput, UserWeaknessUncheckedUpdateWithoutUserInput>
    create: XOR<UserWeaknessCreateWithoutUserInput, UserWeaknessUncheckedCreateWithoutUserInput>
  }

  export type UserWeaknessUpdateWithWhereUniqueWithoutUserInput = {
    where: UserWeaknessWhereUniqueInput
    data: XOR<UserWeaknessUpdateWithoutUserInput, UserWeaknessUncheckedUpdateWithoutUserInput>
  }

  export type UserWeaknessUpdateManyWithWhereWithoutUserInput = {
    where: UserWeaknessScalarWhereInput
    data: XOR<UserWeaknessUpdateManyMutationInput, UserWeaknessUncheckedUpdateManyWithoutUserInput>
  }

  export type UserWeaknessScalarWhereInput = {
    AND?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
    OR?: UserWeaknessScalarWhereInput[]
    NOT?: UserWeaknessScalarWhereInput | UserWeaknessScalarWhereInput[]
    id?: StringFilter<"UserWeakness"> | string
    userId?: StringFilter<"UserWeakness"> | string
    weaknessType?: StringFilter<"UserWeakness"> | string
    weaknessKey?: StringFilter<"UserWeakness"> | string
    techniqueTagId?: StringNullableFilter<"UserWeakness"> | string | null
    severity?: FloatFilter<"UserWeakness"> | number
    sampleCount?: IntFilter<"UserWeakness"> | number
    lastUpdated?: DateTimeFilter<"UserWeakness"> | Date | string
  }

  export type PerformanceCreateWithoutScoreInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    user: UserCreateNestedOneWithoutPerformancesInput
  }

  export type PerformanceUncheckedCreateWithoutScoreInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    userId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PerformanceCreateOrConnectWithoutScoreInput = {
    where: PerformanceWhereUniqueInput
    create: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput>
  }

  export type PerformanceCreateManyScoreInputEnvelope = {
    data: PerformanceCreateManyScoreInput | PerformanceCreateManyScoreInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutScoresInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutUserInput
    practiceItems?: PracticeItemCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutScoresInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutUserInput
    practiceItems?: PracticeItemUncheckedCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutScoresInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutScoresInput, UserUncheckedCreateWithoutScoresInput>
  }

  export type PerformanceUpsertWithWhereUniqueWithoutScoreInput = {
    where: PerformanceWhereUniqueInput
    update: XOR<PerformanceUpdateWithoutScoreInput, PerformanceUncheckedUpdateWithoutScoreInput>
    create: XOR<PerformanceCreateWithoutScoreInput, PerformanceUncheckedCreateWithoutScoreInput>
  }

  export type PerformanceUpdateWithWhereUniqueWithoutScoreInput = {
    where: PerformanceWhereUniqueInput
    data: XOR<PerformanceUpdateWithoutScoreInput, PerformanceUncheckedUpdateWithoutScoreInput>
  }

  export type PerformanceUpdateManyWithWhereWithoutScoreInput = {
    where: PerformanceScalarWhereInput
    data: XOR<PerformanceUpdateManyMutationInput, PerformanceUncheckedUpdateManyWithoutScoreInput>
  }

  export type UserUpsertWithoutScoresInput = {
    update: XOR<UserUpdateWithoutScoresInput, UserUncheckedUpdateWithoutScoresInput>
    create: XOR<UserCreateWithoutScoresInput, UserUncheckedCreateWithoutScoresInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutScoresInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutScoresInput, UserUncheckedUpdateWithoutScoresInput>
  }

  export type UserUpdateWithoutScoresInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutUserNestedInput
    practiceItems?: PracticeItemUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutScoresInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutUserNestedInput
    practiceItems?: PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ScoreCreateWithoutPerformancesInput = {
    id?: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
    createdBy: UserCreateNestedOneWithoutScoresInput
  }

  export type ScoreUncheckedCreateWithoutPerformancesInput = {
    id?: string
    createdById: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
  }

  export type ScoreCreateOrConnectWithoutPerformancesInput = {
    where: ScoreWhereUniqueInput
    create: XOR<ScoreCreateWithoutPerformancesInput, ScoreUncheckedCreateWithoutPerformancesInput>
  }

  export type UserCreateWithoutPerformancesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scores?: ScoreCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPerformancesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    scores?: ScoreUncheckedCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemUncheckedCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPerformancesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPerformancesInput, UserUncheckedCreateWithoutPerformancesInput>
  }

  export type ScoreUpsertWithoutPerformancesInput = {
    update: XOR<ScoreUpdateWithoutPerformancesInput, ScoreUncheckedUpdateWithoutPerformancesInput>
    create: XOR<ScoreCreateWithoutPerformancesInput, ScoreUncheckedCreateWithoutPerformancesInput>
    where?: ScoreWhereInput
  }

  export type ScoreUpdateToOneWithWhereWithoutPerformancesInput = {
    where?: ScoreWhereInput
    data: XOR<ScoreUpdateWithoutPerformancesInput, ScoreUncheckedUpdateWithoutPerformancesInput>
  }

  export type ScoreUpdateWithoutPerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: UserUpdateOneRequiredWithoutScoresNestedInput
  }

  export type ScoreUncheckedUpdateWithoutPerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutPerformancesInput = {
    update: XOR<UserUpdateWithoutPerformancesInput, UserUncheckedUpdateWithoutPerformancesInput>
    create: XOR<UserCreateWithoutPerformancesInput, UserUncheckedCreateWithoutPerformancesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPerformancesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPerformancesInput, UserUncheckedUpdateWithoutPerformancesInput>
  }

  export type UserUpdateWithoutPerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scores?: ScoreUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    scores?: ScoreUncheckedUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutPracticeItemsInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutUserInput
    scores?: ScoreCreateNestedManyWithoutCreatedByInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPracticeItemsInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutUserInput
    scores?: ScoreUncheckedCreateNestedManyWithoutCreatedByInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutUserInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPracticeItemsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPracticeItemsInput, UserUncheckedCreateWithoutPracticeItemsInput>
  }

  export type PracticeItemTechniqueCreateWithoutPracticeItemInput = {
    isPrimary?: boolean
    techniqueTag: TechniqueTagCreateNestedOneWithoutPracticeItemsInput
  }

  export type PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput = {
    techniqueTagId: string
    isPrimary?: boolean
  }

  export type PracticeItemTechniqueCreateOrConnectWithoutPracticeItemInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    create: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput>
  }

  export type PracticeItemTechniqueCreateManyPracticeItemInputEnvelope = {
    data: PracticeItemTechniqueCreateManyPracticeItemInput | PracticeItemTechniqueCreateManyPracticeItemInput[]
    skipDuplicates?: boolean
  }

  export type PracticePerformanceCreateWithoutPracticeItemInput = {
    id?: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    user: UserCreateNestedOneWithoutPracticePerformancesInput
  }

  export type PracticePerformanceUncheckedCreateWithoutPracticeItemInput = {
    id?: string
    userId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PracticePerformanceCreateOrConnectWithoutPracticeItemInput = {
    where: PracticePerformanceWhereUniqueInput
    create: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput>
  }

  export type PracticePerformanceCreateManyPracticeItemInputEnvelope = {
    data: PracticePerformanceCreateManyPracticeItemInput | PracticePerformanceCreateManyPracticeItemInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutPracticeItemsInput = {
    update: XOR<UserUpdateWithoutPracticeItemsInput, UserUncheckedUpdateWithoutPracticeItemsInput>
    create: XOR<UserCreateWithoutPracticeItemsInput, UserUncheckedCreateWithoutPracticeItemsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPracticeItemsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPracticeItemsInput, UserUncheckedUpdateWithoutPracticeItemsInput>
  }

  export type UserUpdateWithoutPracticeItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutUserNestedInput
    scores?: ScoreUpdateManyWithoutCreatedByNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPracticeItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutUserNestedInput
    scores?: ScoreUncheckedUpdateManyWithoutCreatedByNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutUserNestedInput
  }

  export type PracticeItemTechniqueUpsertWithWhereUniqueWithoutPracticeItemInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    update: XOR<PracticeItemTechniqueUpdateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedUpdateWithoutPracticeItemInput>
    create: XOR<PracticeItemTechniqueCreateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedCreateWithoutPracticeItemInput>
  }

  export type PracticeItemTechniqueUpdateWithWhereUniqueWithoutPracticeItemInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    data: XOR<PracticeItemTechniqueUpdateWithoutPracticeItemInput, PracticeItemTechniqueUncheckedUpdateWithoutPracticeItemInput>
  }

  export type PracticeItemTechniqueUpdateManyWithWhereWithoutPracticeItemInput = {
    where: PracticeItemTechniqueScalarWhereInput
    data: XOR<PracticeItemTechniqueUpdateManyMutationInput, PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemInput>
  }

  export type PracticeItemTechniqueScalarWhereInput = {
    AND?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
    OR?: PracticeItemTechniqueScalarWhereInput[]
    NOT?: PracticeItemTechniqueScalarWhereInput | PracticeItemTechniqueScalarWhereInput[]
    practiceItemId?: StringFilter<"PracticeItemTechnique"> | string
    techniqueTagId?: StringFilter<"PracticeItemTechnique"> | string
    isPrimary?: BoolFilter<"PracticeItemTechnique"> | boolean
  }

  export type PracticePerformanceUpsertWithWhereUniqueWithoutPracticeItemInput = {
    where: PracticePerformanceWhereUniqueInput
    update: XOR<PracticePerformanceUpdateWithoutPracticeItemInput, PracticePerformanceUncheckedUpdateWithoutPracticeItemInput>
    create: XOR<PracticePerformanceCreateWithoutPracticeItemInput, PracticePerformanceUncheckedCreateWithoutPracticeItemInput>
  }

  export type PracticePerformanceUpdateWithWhereUniqueWithoutPracticeItemInput = {
    where: PracticePerformanceWhereUniqueInput
    data: XOR<PracticePerformanceUpdateWithoutPracticeItemInput, PracticePerformanceUncheckedUpdateWithoutPracticeItemInput>
  }

  export type PracticePerformanceUpdateManyWithWhereWithoutPracticeItemInput = {
    where: PracticePerformanceScalarWhereInput
    data: XOR<PracticePerformanceUpdateManyMutationInput, PracticePerformanceUncheckedUpdateManyWithoutPracticeItemInput>
  }

  export type PracticeItemTechniqueCreateWithoutTechniqueTagInput = {
    isPrimary?: boolean
    practiceItem: PracticeItemCreateNestedOneWithoutTechniquesInput
  }

  export type PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput = {
    practiceItemId: string
    isPrimary?: boolean
  }

  export type PracticeItemTechniqueCreateOrConnectWithoutTechniqueTagInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    create: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput>
  }

  export type PracticeItemTechniqueCreateManyTechniqueTagInputEnvelope = {
    data: PracticeItemTechniqueCreateManyTechniqueTagInput | PracticeItemTechniqueCreateManyTechniqueTagInput[]
    skipDuplicates?: boolean
  }

  export type UserWeaknessCreateWithoutTechniqueTagInput = {
    id?: string
    weaknessType: string
    weaknessKey: string
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
    user: UserCreateNestedOneWithoutWeaknessesInput
  }

  export type UserWeaknessUncheckedCreateWithoutTechniqueTagInput = {
    id?: string
    userId: string
    weaknessType: string
    weaknessKey: string
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type UserWeaknessCreateOrConnectWithoutTechniqueTagInput = {
    where: UserWeaknessWhereUniqueInput
    create: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput>
  }

  export type UserWeaknessCreateManyTechniqueTagInputEnvelope = {
    data: UserWeaknessCreateManyTechniqueTagInput | UserWeaknessCreateManyTechniqueTagInput[]
    skipDuplicates?: boolean
  }

  export type PracticeItemTechniqueUpsertWithWhereUniqueWithoutTechniqueTagInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    update: XOR<PracticeItemTechniqueUpdateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedUpdateWithoutTechniqueTagInput>
    create: XOR<PracticeItemTechniqueCreateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedCreateWithoutTechniqueTagInput>
  }

  export type PracticeItemTechniqueUpdateWithWhereUniqueWithoutTechniqueTagInput = {
    where: PracticeItemTechniqueWhereUniqueInput
    data: XOR<PracticeItemTechniqueUpdateWithoutTechniqueTagInput, PracticeItemTechniqueUncheckedUpdateWithoutTechniqueTagInput>
  }

  export type PracticeItemTechniqueUpdateManyWithWhereWithoutTechniqueTagInput = {
    where: PracticeItemTechniqueScalarWhereInput
    data: XOR<PracticeItemTechniqueUpdateManyMutationInput, PracticeItemTechniqueUncheckedUpdateManyWithoutTechniqueTagInput>
  }

  export type UserWeaknessUpsertWithWhereUniqueWithoutTechniqueTagInput = {
    where: UserWeaknessWhereUniqueInput
    update: XOR<UserWeaknessUpdateWithoutTechniqueTagInput, UserWeaknessUncheckedUpdateWithoutTechniqueTagInput>
    create: XOR<UserWeaknessCreateWithoutTechniqueTagInput, UserWeaknessUncheckedCreateWithoutTechniqueTagInput>
  }

  export type UserWeaknessUpdateWithWhereUniqueWithoutTechniqueTagInput = {
    where: UserWeaknessWhereUniqueInput
    data: XOR<UserWeaknessUpdateWithoutTechniqueTagInput, UserWeaknessUncheckedUpdateWithoutTechniqueTagInput>
  }

  export type UserWeaknessUpdateManyWithWhereWithoutTechniqueTagInput = {
    where: UserWeaknessScalarWhereInput
    data: XOR<UserWeaknessUpdateManyMutationInput, UserWeaknessUncheckedUpdateManyWithoutTechniqueTagInput>
  }

  export type PracticeItemCreateWithoutTechniquesInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    owner?: UserCreateNestedOneWithoutPracticeItemsInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemUncheckedCreateWithoutTechniquesInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    ownerUserId?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemCreateOrConnectWithoutTechniquesInput = {
    where: PracticeItemWhereUniqueInput
    create: XOR<PracticeItemCreateWithoutTechniquesInput, PracticeItemUncheckedCreateWithoutTechniquesInput>
  }

  export type TechniqueTagCreateWithoutPracticeItemsInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    weaknesses?: UserWeaknessCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagUncheckedCreateWithoutPracticeItemsInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagCreateOrConnectWithoutPracticeItemsInput = {
    where: TechniqueTagWhereUniqueInput
    create: XOR<TechniqueTagCreateWithoutPracticeItemsInput, TechniqueTagUncheckedCreateWithoutPracticeItemsInput>
  }

  export type PracticeItemUpsertWithoutTechniquesInput = {
    update: XOR<PracticeItemUpdateWithoutTechniquesInput, PracticeItemUncheckedUpdateWithoutTechniquesInput>
    create: XOR<PracticeItemCreateWithoutTechniquesInput, PracticeItemUncheckedCreateWithoutTechniquesInput>
    where?: PracticeItemWhereInput
  }

  export type PracticeItemUpdateToOneWithWhereWithoutTechniquesInput = {
    where?: PracticeItemWhereInput
    data: XOR<PracticeItemUpdateWithoutTechniquesInput, PracticeItemUncheckedUpdateWithoutTechniquesInput>
  }

  export type PracticeItemUpdateWithoutTechniquesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneWithoutPracticeItemsNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemUncheckedUpdateWithoutTechniquesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    ownerUserId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutPracticeItemNestedInput
  }

  export type TechniqueTagUpsertWithoutPracticeItemsInput = {
    update: XOR<TechniqueTagUpdateWithoutPracticeItemsInput, TechniqueTagUncheckedUpdateWithoutPracticeItemsInput>
    create: XOR<TechniqueTagCreateWithoutPracticeItemsInput, TechniqueTagUncheckedCreateWithoutPracticeItemsInput>
    where?: TechniqueTagWhereInput
  }

  export type TechniqueTagUpdateToOneWithWhereWithoutPracticeItemsInput = {
    where?: TechniqueTagWhereInput
    data: XOR<TechniqueTagUpdateWithoutPracticeItemsInput, TechniqueTagUncheckedUpdateWithoutPracticeItemsInput>
  }

  export type TechniqueTagUpdateWithoutPracticeItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    weaknesses?: UserWeaknessUpdateManyWithoutTechniqueTagNestedInput
  }

  export type TechniqueTagUncheckedUpdateWithoutPracticeItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutTechniqueTagNestedInput
  }

  export type UserCreateWithoutPracticePerformancesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutUserInput
    scores?: ScoreCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemCreateNestedManyWithoutOwnerInput
    weaknesses?: UserWeaknessCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPracticePerformancesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutUserInput
    scores?: ScoreUncheckedCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemUncheckedCreateNestedManyWithoutOwnerInput
    weaknesses?: UserWeaknessUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPracticePerformancesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPracticePerformancesInput, UserUncheckedCreateWithoutPracticePerformancesInput>
  }

  export type PracticeItemCreateWithoutPracticePerformancesInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    owner?: UserCreateNestedOneWithoutPracticeItemsInput
    techniques?: PracticeItemTechniqueCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemUncheckedCreateWithoutPracticePerformancesInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    ownerUserId?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    techniques?: PracticeItemTechniqueUncheckedCreateNestedManyWithoutPracticeItemInput
  }

  export type PracticeItemCreateOrConnectWithoutPracticePerformancesInput = {
    where: PracticeItemWhereUniqueInput
    create: XOR<PracticeItemCreateWithoutPracticePerformancesInput, PracticeItemUncheckedCreateWithoutPracticePerformancesInput>
  }

  export type UserUpsertWithoutPracticePerformancesInput = {
    update: XOR<UserUpdateWithoutPracticePerformancesInput, UserUncheckedUpdateWithoutPracticePerformancesInput>
    create: XOR<UserCreateWithoutPracticePerformancesInput, UserUncheckedCreateWithoutPracticePerformancesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPracticePerformancesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPracticePerformancesInput, UserUncheckedUpdateWithoutPracticePerformancesInput>
  }

  export type UserUpdateWithoutPracticePerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutUserNestedInput
    scores?: ScoreUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUpdateManyWithoutOwnerNestedInput
    weaknesses?: UserWeaknessUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPracticePerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutUserNestedInput
    scores?: ScoreUncheckedUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput
    weaknesses?: UserWeaknessUncheckedUpdateManyWithoutUserNestedInput
  }

  export type PracticeItemUpsertWithoutPracticePerformancesInput = {
    update: XOR<PracticeItemUpdateWithoutPracticePerformancesInput, PracticeItemUncheckedUpdateWithoutPracticePerformancesInput>
    create: XOR<PracticeItemCreateWithoutPracticePerformancesInput, PracticeItemUncheckedCreateWithoutPracticePerformancesInput>
    where?: PracticeItemWhereInput
  }

  export type PracticeItemUpdateToOneWithWhereWithoutPracticePerformancesInput = {
    where?: PracticeItemWhereInput
    data: XOR<PracticeItemUpdateWithoutPracticePerformancesInput, PracticeItemUncheckedUpdateWithoutPracticePerformancesInput>
  }

  export type PracticeItemUpdateWithoutPracticePerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneWithoutPracticeItemsNestedInput
    techniques?: PracticeItemTechniqueUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemUncheckedUpdateWithoutPracticePerformancesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    ownerUserId?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    techniques?: PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemNestedInput
  }

  export type UserCreateWithoutWeaknessesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceCreateNestedManyWithoutUserInput
    scores?: ScoreCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutWeaknessesInput = {
    id?: string
    supabaseUserId: string
    name: string
    role?: $Enums.Role
    plan?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    performances?: PerformanceUncheckedCreateNestedManyWithoutUserInput
    scores?: ScoreUncheckedCreateNestedManyWithoutCreatedByInput
    practiceItems?: PracticeItemUncheckedCreateNestedManyWithoutOwnerInput
    practicePerformances?: PracticePerformanceUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutWeaknessesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutWeaknessesInput, UserUncheckedCreateWithoutWeaknessesInput>
  }

  export type TechniqueTagCreateWithoutWeaknessesInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    practiceItems?: PracticeItemTechniqueCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagUncheckedCreateWithoutWeaknessesInput = {
    id?: string
    category: string
    name: string
    nameEn?: string | null
    description?: string | null
    xmlTags?: TechniqueTagCreatexmlTagsInput | string[]
    isAnalyzable: string
    implementStatus: string
    practiceItems?: PracticeItemTechniqueUncheckedCreateNestedManyWithoutTechniqueTagInput
  }

  export type TechniqueTagCreateOrConnectWithoutWeaknessesInput = {
    where: TechniqueTagWhereUniqueInput
    create: XOR<TechniqueTagCreateWithoutWeaknessesInput, TechniqueTagUncheckedCreateWithoutWeaknessesInput>
  }

  export type UserUpsertWithoutWeaknessesInput = {
    update: XOR<UserUpdateWithoutWeaknessesInput, UserUncheckedUpdateWithoutWeaknessesInput>
    create: XOR<UserCreateWithoutWeaknessesInput, UserUncheckedCreateWithoutWeaknessesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutWeaknessesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutWeaknessesInput, UserUncheckedUpdateWithoutWeaknessesInput>
  }

  export type UserUpdateWithoutWeaknessesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutUserNestedInput
    scores?: ScoreUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutWeaknessesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supabaseUserId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    plan?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutUserNestedInput
    scores?: ScoreUncheckedUpdateManyWithoutCreatedByNestedInput
    practiceItems?: PracticeItemUncheckedUpdateManyWithoutOwnerNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TechniqueTagUpsertWithoutWeaknessesInput = {
    update: XOR<TechniqueTagUpdateWithoutWeaknessesInput, TechniqueTagUncheckedUpdateWithoutWeaknessesInput>
    create: XOR<TechniqueTagCreateWithoutWeaknessesInput, TechniqueTagUncheckedCreateWithoutWeaknessesInput>
    where?: TechniqueTagWhereInput
  }

  export type TechniqueTagUpdateToOneWithWhereWithoutWeaknessesInput = {
    where?: TechniqueTagWhereInput
    data: XOR<TechniqueTagUpdateWithoutWeaknessesInput, TechniqueTagUncheckedUpdateWithoutWeaknessesInput>
  }

  export type TechniqueTagUpdateWithoutWeaknessesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    practiceItems?: PracticeItemTechniqueUpdateManyWithoutTechniqueTagNestedInput
  }

  export type TechniqueTagUncheckedUpdateWithoutWeaknessesInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    nameEn?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    xmlTags?: TechniqueTagUpdatexmlTagsInput | string[]
    isAnalyzable?: StringFieldUpdateOperationsInput | string
    implementStatus?: StringFieldUpdateOperationsInput | string
    practiceItems?: PracticeItemTechniqueUncheckedUpdateManyWithoutTechniqueTagNestedInput
  }

  export type PerformanceCreateManyUserInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    scoreId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type ScoreCreateManyCreatedByInput = {
    id?: string
    title: string
    composer?: string | null
    arranger?: string | null
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    keyTonic?: string | null
    keyMode?: string | null
    timeNumerator?: number | null
    timeDenominator?: number | null
    defaultTempo?: number | null
    isShared?: boolean
    createdAt?: Date | string
  }

  export type PracticeItemCreateManyOwnerInput = {
    id?: string
    category: $Enums.PracticeCategory
    title: string
    composer?: string | null
    description?: string | null
    descriptionShort?: string | null
    keyTonic: string
    keyMode: string
    tempoMin?: number | null
    tempoMax?: number | null
    positions?: PracticeItemCreatepositionsInput | string[]
    instrument?: string
    originalXmlPath: string
    generatedXmlPath?: string | null
    analysisPath?: string | null
    analysisStatus?: $Enums.JobStatus
    buildStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
    source?: string | null
    sortOrder?: number
    isPublished?: boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PracticePerformanceCreateManyUserInput = {
    id?: string
    practiceItemId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type UserWeaknessCreateManyUserInput = {
    id?: string
    weaknessType: string
    weaknessKey: string
    techniqueTagId?: string | null
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type PerformanceUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    score?: ScoreUpdateOneRequiredWithoutPerformancesNestedInput
  }

  export type PerformanceUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    scoreId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PerformanceUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    scoreId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ScoreUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUpdateManyWithoutScoreNestedInput
  }

  export type ScoreUncheckedUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    performances?: PerformanceUncheckedUpdateManyWithoutScoreNestedInput
  }

  export type ScoreUncheckedUpdateManyWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    arranger?: NullableStringFieldUpdateOperationsInput | string | null
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: NullableStringFieldUpdateOperationsInput | string | null
    keyMode?: NullableStringFieldUpdateOperationsInput | string | null
    timeNumerator?: NullableIntFieldUpdateOperationsInput | number | null
    timeDenominator?: NullableIntFieldUpdateOperationsInput | number | null
    defaultTempo?: NullableIntFieldUpdateOperationsInput | number | null
    isShared?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PracticeItemUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    techniques?: PracticeItemTechniqueUpdateManyWithoutPracticeItemNestedInput
    practicePerformances?: PracticePerformanceUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    techniques?: PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemNestedInput
    practicePerformances?: PracticePerformanceUncheckedUpdateManyWithoutPracticeItemNestedInput
  }

  export type PracticeItemUncheckedUpdateManyWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    category?: EnumPracticeCategoryFieldUpdateOperationsInput | $Enums.PracticeCategory
    title?: StringFieldUpdateOperationsInput | string
    composer?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    descriptionShort?: NullableStringFieldUpdateOperationsInput | string | null
    keyTonic?: StringFieldUpdateOperationsInput | string
    keyMode?: StringFieldUpdateOperationsInput | string
    tempoMin?: NullableIntFieldUpdateOperationsInput | number | null
    tempoMax?: NullableIntFieldUpdateOperationsInput | number | null
    positions?: PracticeItemUpdatepositionsInput | string[]
    instrument?: StringFieldUpdateOperationsInput | string
    originalXmlPath?: StringFieldUpdateOperationsInput | string
    generatedXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisPath?: NullableStringFieldUpdateOperationsInput | string | null
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    buildStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    sortOrder?: IntFieldUpdateOperationsInput | number
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PracticePerformanceUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    practiceItem?: PracticeItemUpdateOneRequiredWithoutPracticePerformancesNestedInput
  }

  export type PracticePerformanceUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    practiceItemId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticePerformanceUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    practiceItemId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserWeaknessUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    techniqueTag?: TechniqueTagUpdateOneWithoutWeaknessesNestedInput
  }

  export type UserWeaknessUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserWeaknessUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    techniqueTagId?: NullableStringFieldUpdateOperationsInput | string | null
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceCreateManyScoreInput = {
    id?: string
    performanceType: $Enums.PerformanceType
    performanceStatus?: $Enums.PerformanceStatus
    userId: string
    audioPath: string
    audioFeaturesPath?: string | null
    comparisonResultPath?: string | null
    pseudoXmlPath?: string | null
    performanceDuration?: number | null
    performanceDate?: Date | string | null
    uploadedAt?: Date | string
    createdAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PerformanceUpdateWithoutScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutPerformancesNestedInput
  }

  export type PerformanceUncheckedUpdateWithoutScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    userId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PerformanceUncheckedUpdateManyWithoutScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    performanceType?: EnumPerformanceTypeFieldUpdateOperationsInput | $Enums.PerformanceType
    performanceStatus?: EnumPerformanceStatusFieldUpdateOperationsInput | $Enums.PerformanceStatus
    userId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    audioFeaturesPath?: NullableStringFieldUpdateOperationsInput | string | null
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    pseudoXmlPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    performanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticeItemTechniqueCreateManyPracticeItemInput = {
    techniqueTagId: string
    isPrimary?: boolean
  }

  export type PracticePerformanceCreateManyPracticeItemInput = {
    id?: string
    userId: string
    audioPath: string
    comparisonResultPath?: string | null
    performanceDuration?: number | null
    uploadedAt?: Date | string
    pitchAccuracy?: number | null
    timingAccuracy?: number | null
    overallScore?: number | null
    evaluatedNotes?: number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: $Enums.JobStatus
    retryCount?: number
    errorMessage?: string | null
    lastAttemptedAt?: Date | string | null
    executionId?: string | null
    idempotencyKey?: string | null
  }

  export type PracticeItemTechniqueUpdateWithoutPracticeItemInput = {
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    techniqueTag?: TechniqueTagUpdateOneRequiredWithoutPracticeItemsNestedInput
  }

  export type PracticeItemTechniqueUncheckedUpdateWithoutPracticeItemInput = {
    techniqueTagId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticeItemTechniqueUncheckedUpdateManyWithoutPracticeItemInput = {
    techniqueTagId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticePerformanceUpdateWithoutPracticeItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutPracticePerformancesNestedInput
  }

  export type PracticePerformanceUncheckedUpdateWithoutPracticeItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticePerformanceUncheckedUpdateManyWithoutPracticeItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    audioPath?: StringFieldUpdateOperationsInput | string
    comparisonResultPath?: NullableStringFieldUpdateOperationsInput | string | null
    performanceDuration?: NullableFloatFieldUpdateOperationsInput | number | null
    uploadedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pitchAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    timingAccuracy?: NullableFloatFieldUpdateOperationsInput | number | null
    overallScore?: NullableFloatFieldUpdateOperationsInput | number | null
    evaluatedNotes?: NullableIntFieldUpdateOperationsInput | number | null
    analysisSummary?: NullableJsonNullValueInput | InputJsonValue
    analysisStatus?: EnumJobStatusFieldUpdateOperationsInput | $Enums.JobStatus
    retryCount?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    lastAttemptedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    executionId?: NullableStringFieldUpdateOperationsInput | string | null
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PracticeItemTechniqueCreateManyTechniqueTagInput = {
    practiceItemId: string
    isPrimary?: boolean
  }

  export type UserWeaknessCreateManyTechniqueTagInput = {
    id?: string
    userId: string
    weaknessType: string
    weaknessKey: string
    severity: number
    sampleCount: number
    lastUpdated?: Date | string
  }

  export type PracticeItemTechniqueUpdateWithoutTechniqueTagInput = {
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    practiceItem?: PracticeItemUpdateOneRequiredWithoutTechniquesNestedInput
  }

  export type PracticeItemTechniqueUncheckedUpdateWithoutTechniqueTagInput = {
    practiceItemId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PracticeItemTechniqueUncheckedUpdateManyWithoutTechniqueTagInput = {
    practiceItemId?: StringFieldUpdateOperationsInput | string
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserWeaknessUpdateWithoutTechniqueTagInput = {
    id?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWeaknessesNestedInput
  }

  export type UserWeaknessUncheckedUpdateWithoutTechniqueTagInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserWeaknessUncheckedUpdateManyWithoutTechniqueTagInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    weaknessType?: StringFieldUpdateOperationsInput | string
    weaknessKey?: StringFieldUpdateOperationsInput | string
    severity?: FloatFieldUpdateOperationsInput | number
    sampleCount?: IntFieldUpdateOperationsInput | number
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}