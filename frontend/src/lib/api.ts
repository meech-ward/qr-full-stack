import { hc } from "hono/client";
import { type ApiRoutes } from "@server/app";
import { queryOptions } from "@tanstack/react-query";
import { type CreateQrCode } from "@server/shared-types";
const client = hc<ApiRoutes>("/");

export const api = client.api;

export async function getAllQrCodes() {
  const res = await api.qr.$get();
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}
export const getAllQrCodesQueryOptions = queryOptions({
  queryKey: ["get-all-qr-codes"],
  queryFn: getAllQrCodes,
  staleTime: 1000 * 60 * 5,
});

export async function getQrCodeByID(id: string) {
  const res = await api.qr[":id"].$get({ param: { id: id } });
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}

export const getQrCodeByIDQueryOptions = (id: string) => queryOptions({
  queryKey: ["get-qr-code-by-id", id],
  queryFn: () => getQrCodeByID(id),
  staleTime: 1000 * 60 * 5,
});

export async function createQrCode(value: CreateQrCode) {
  const res = await api.qr.$post({ form: value });
  if (!res.ok) {
    throw new Error("server error");
  }

  const qrFiles = await res.json();
  // if ('error' in qrFiles) {
  //   throw new Error(qrFiles.error);
  // }
  return qrFiles;
}
export type CreateQrCodeResponse = Awaited<ReturnType<typeof createQrCode>>

export async function createQrID({ text }: { text: string }) {
  const res = await api.qr['short-url'].$post({ json: { text: text } });
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}

export async function deleteQrCode({ id }: { id: string }) {
  const res = await api.qr[":id"].$delete({
    param: { id: id },
  });

  if (!res.ok) {
    throw new Error("server error");
  }
}
