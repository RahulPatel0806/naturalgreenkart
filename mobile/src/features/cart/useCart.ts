/** Cart data + mutations. The cart summary is the single source of truth. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import type { CartSummary } from '@/types/api';

export function useCart() {
  return useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.get });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const onSuccess = (summary: CartSummary) => qc.setQueryData(queryKeys.cart, summary);

  const add = useMutation({ mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => cartApi.add(productId, quantity), onSuccess });
  const update = useMutation({ mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => cartApi.update(productId, quantity), onSuccess });
  const remove = useMutation({ mutationFn: (productId: string) => cartApi.remove(productId), onSuccess });
  const clear = useMutation({ mutationFn: () => cartApi.clear(), onSuccess });

  return { add, update, remove, clear };
}

/** Convenience: how many of a given product are in the cart right now. */
export function useCartQuantity(productId: string): number {
  const { data } = useCart();
  return data?.items.find((i) => i.productId === productId)?.quantity ?? 0;
}
