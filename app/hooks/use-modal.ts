import { useState } from "react";

interface ModalState<T = any> {
  open: boolean;
  key?: string;
  data?: T;
}

export function useModal<T = any>(initial?: Partial<ModalState<T>>) {
  return useState<ModalState<T>>({
    open: false,
    key: undefined,
    data: undefined,
    ...initial,
  });
}
