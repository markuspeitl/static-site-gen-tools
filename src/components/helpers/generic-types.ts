export type FalseAbleVal<ValueType> = ValueType | null | undefined;
export type Nullable<ValueType> = FalseAbleVal<ValueType>;
export type NullableString = FalseAbleVal<string>;
export type NullItemArray<ItemType> = Array<FalseAbleVal<ItemType>>;
export type NullItemNullArray<ItemType> = Array<FalseAbleVal<ItemType>> | null | undefined;
export type ArrOrSing<ItemType> = ItemType | Array<ItemType>;
export type ArrNullOrSing<ItemType> = ArrOrSing<ItemType> | null | undefined;
export type StringArrOrSingNull = ArrNullOrSing<NullableString>;
export type AttrDict = Record<string, StringArrOrSingNull>;
export type DataDict = Record<string, any>;

export type FalsyAble<ItemType> = ItemType | null | undefined;
export type FalsyString = FalsyAble<string>;
export type FalsyStringPromise = Promise<FalsyString>;

//export type Nullable<ItemType> = ItemType | null | undefined;
//export type NullableString = Nullable<string>;
export type SingleOrArray<ItemType> = Array<ItemType> | ItemType;
export type ItemArrayOrNull<ItemType> = Nullable<Array<ItemType> | ItemType>;

export type ArrayAndNull<ItemType> = Array<Nullable<ItemType>>;
export type NullableArray<ItemType> = Nullable<Array<Nullable<ItemType>>>;