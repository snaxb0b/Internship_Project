import {
  useEffect,
  useState,
} from "react";


const STORAGE_KEY =
  "yolo_prediction_history_v1";

const MAX_HISTORY_ITEMS = 10;


/*
 * อ่านประวัติที่เคยเก็บไว้ใน localStorage
 *
 * ใช้เป็น lazy initializer ของ useState
 * จึงอ่านเพียงตอน Component เริ่มต้น
 */
function loadStoredHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    /*
     * กรองข้อมูลที่โครงสร้างผิดออก
     * ป้องกันกรณี localStorage เสีย
     * หรือมีข้อมูลเก่าที่ไม่ตรงรูปแบบ
     */
    return parsedValue
      .filter((item) => {
        return (
          item &&
          typeof item.id === "string" &&
          typeof item.createdAt === "string" &&
          item.result
        );
      })
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (error) {
    console.warn(
      "Cannot read prediction history:",
      error
    );

    return [];
  }
}


/*
 * สร้าง ID ไม่ซ้ำสำหรับแต่ละรายการ
 *
 * ใช้ crypto.randomUUID() ก่อน
 * และมี fallback สำหรับ Environment
 * ที่ไม่รองรับ
 */
function createHistoryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    `${Date.now()}-` +
    `${Math.random()
      .toString(16)
      .slice(2)}`
  );
}


export function usePredictionHistory() {
  const [history, setHistory] =
    useState(loadStoredHistory);


  /*
   * Effect นี้ใช้ Synchronize React State
   * ไปยังระบบภายนอกคือ localStorage
   *
   * ไม่มี setState อยู่ใน Effect
   * จึงไม่เจอ Error
   * react-hooks/set-state-in-effect
   */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.warn(
        "Cannot save prediction history:",
        error
      );
    }
  }, [history]);


  function addPrediction({
    result,
    sourceFile,
    modelName,
  }) {
    const historyItem = {
      id: createHistoryId(),

      createdAt:
        new Date().toISOString(),

      sourceFilename:
        sourceFile?.name ??
        result.filename ??
        "Unknown image",

      sourceFileSize:
        sourceFile?.size ?? null,

      modelId:
        result.model_id,

      modelName:
        modelName ?? result.model_id,

      confidenceThreshold:
        result.confidence_threshold,

      objectCount:
        result.object_count,

      /*
       * เก็บ Response ทั้งชุด
       * เพื่อให้สามารถเปิดผลเก่า
       * ใน PredictionResult ได้ทันที
       */
      result,
    };

    setHistory(
      (currentHistory) => {
        const nextHistory = [
          historyItem,
          ...currentHistory,
        ];

        return nextHistory.slice(
          0,
          MAX_HISTORY_ITEMS
        );
      }
    );

    /*
     * คืนรายการใหม่ให้ App.jsx
     * ใช้ตั้ง selectedHistoryId
     */
    return historyItem;
  }


  function removePrediction(historyId) {
    setHistory(
      (currentHistory) =>
        currentHistory.filter(
          (item) =>
            item.id !== historyId
        )
    );
  }


  function clearHistory() {
    setHistory([]);
  }


  return {
    history,
    addPrediction,
    removePrediction,
    clearHistory,
  };
}