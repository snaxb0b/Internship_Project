import {
  useEffect,
  useRef,
  useState,
} from "react";


export function useImagePreview() {
  const [previewUrl, setPreviewUrl] =
    useState("");

  const currentPreviewUrlRef =
    useRef("");


  function updatePreview(file) {
    const previousPreviewUrl =
      currentPreviewUrlRef.current;

    // ล้าง Object URL ของรูปเดิม
    if (previousPreviewUrl) {
      URL.revokeObjectURL(
        previousPreviewUrl
      );
    }

    // ถ้ามีไฟล์ ให้สร้าง Preview URL ใหม่
    // ถ้าไม่มีไฟล์ ให้ใช้ค่าว่าง
    const nextPreviewUrl = file
      ? URL.createObjectURL(file)
      : "";

    currentPreviewUrlRef.current =
      nextPreviewUrl;

    // เรียกจาก Event Handler ไม่ได้เรียกใน Effect
    setPreviewUrl(nextPreviewUrl);
  }


  // Effect นี้ใช้ Cleanup อย่างเดียว
  // ไม่มีการเรียก setState ภายใน Effect
  useEffect(() => {
    return () => {
      const currentPreviewUrl =
        currentPreviewUrlRef.current;

      if (currentPreviewUrl) {
        URL.revokeObjectURL(
          currentPreviewUrl
        );
      }
    };
  }, []);


  return {
    previewUrl,
    updatePreview,
  };
}