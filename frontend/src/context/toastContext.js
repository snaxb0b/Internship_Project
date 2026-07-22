import {
  createContext,
  useContext,
} from "react";


export const ToastContext =
  createContext(null);


/*
 * useToast() คืนฟังก์ชัน showToast
 * ถ้าเรียกนอก Provider จะได้ no-op
 * เพื่อไม่ให้แอปพัง
 */
export function useToast() {
  const context =
    useContext(ToastContext);

  return context ?? (() => {});
}
