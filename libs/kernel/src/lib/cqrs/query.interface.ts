// _resultType is a phantom, optional-only marker: it carries TResult through the type system with zero runtime cost and no implementer ever needs to set it.
export interface IQuery<TResult> {
  readonly _resultType?: TResult;
}
