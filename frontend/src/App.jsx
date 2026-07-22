import { useState } from "react";

import {
  predictUploadedImage,
} from "./api/yoloApi";

import AppHeader from "./components/AppHeader";
import PredictionForm from "./components/PredictionForm";
import PredictionHistory from "./components/PredictionHistory";
import PredictionResult from "./components/PredictionResult";
import YoloBottomBar from "./components/AboutYolo";

import {
  useApiHealth,
} from "./hooks/useApiHealth";

import {
  useImagePreview,
} from "./hooks/useImagePreview";

import {
  usePredictionHistory,
} from "./hooks/usePredictionHistory";

import {
  useYoloModels,
} from "./hooks/useYoloModels";

import {
  hasValidationErrors,
  validateImageFile,
  validatePredictionInput,
} from "./utils/validation";

import "./App.css";


function scrollToResultPanel() {
  window.requestAnimationFrame(() => {
    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    document
      .getElementById("result")
      ?.scrollIntoView({
        behavior: prefersReducedMotion
          ? "auto"
          : "smooth",
        block: "start",
      });
  });
}


function App() {
  const {
    status: apiStatus,
    error: apiError,
    retryHealthCheck,
  } = useApiHealth();

  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    reloadModels,
  } = useYoloModels();

  const {
    history,
    addPrediction,
    removePrediction,
    clearHistory,
  } = usePredictionHistory();


  const [modelId, setModelId] =
    useState("");

  const [confidence, setConfidence] =
    useState("0.25");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [
    predictionResult,
    setPredictionResult,
  ] = useState(null);

  const [
    predictionError,
    setPredictionError,
  ] = useState("");

  const [predicting, setPredicting] =
    useState(false);

  const [
    selectedHistoryId,
    setSelectedHistoryId,
  ] = useState("");


  const {
    previewUrl,
    updatePreview,
  } = useImagePreview();


  const modelIdIsAvailable =
    models.some(
      (model) => model.id === modelId
    );

  const resolvedModelId =
    modelIdIsAvailable
      ? modelId
      : models[0]?.id ?? "";


  function resetPrediction() {
    setPredictionResult(null);
    setPredictionError("");
    setSelectedHistoryId("");
  }


  function handleModelChange(
    nextModelId
  ) {
    setModelId(nextModelId);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        modelId: "",
      })
    );

    resetPrediction();
  }


  function handleConfidenceChange(
    nextConfidence
  ) {
    setConfidence(nextConfidence);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        confidence: "",
      })
    );

    resetPrediction();
  }


  function handleFileChange(nextFile) {
    /*
     * User กด Remove
     * หรือ Reset ไฟล์
     */
    if (!nextFile) {
      setSelectedFile(null);
      updatePreview(null);

      setFieldErrors(
        (currentErrors) => ({
          ...currentErrors,
          file: "",
        })
      );

      resetPrediction();
      return;
    }

    /*
     * ตรวจไฟล์ทันที
     */
    const fileError =
      validateImageFile(nextFile);

    if (fileError) {
      setSelectedFile(null);
      updatePreview(null);

      setFieldErrors(
        (currentErrors) => ({
          ...currentErrors,
          file: fileError,
        })
      );

      resetPrediction();
      return;
    }

    setSelectedFile(nextFile);
    updatePreview(nextFile);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        file: "",
      })
    );

    resetPrediction();
  }


  function handleReset() {
    setConfidence("0.25");
    setSelectedFile(null);

    updatePreview(null);

    setFieldErrors({});
    setPredictionResult(null);
    setPredictionError("");
    setSelectedHistoryId("");
  }


  async function handlePrediction() {
    const validationErrors =
      validatePredictionInput({
        modelId: resolvedModelId,
        confidence,
        file: selectedFile,
      });

    setFieldErrors(validationErrors);
    setPredictionError("");

    if (
      hasValidationErrors(
        validationErrors
      )
    ) {
      return;
    }

    setPredicting(true);
    setPredictionResult(null);
    setSelectedHistoryId("");

    try {
      const result =
        await predictUploadedImage({
          modelId: resolvedModelId,
          confidence: Number(confidence),
          file: selectedFile,
        });

      setPredictionResult(result);
      scrollToResultPanel();

      const selectedModel =
        models.find(
          (model) =>
            model.id === resolvedModelId
        );

      const newHistoryItem =
        addPrediction({
          result,
          sourceFile: selectedFile,
          modelName:
            selectedModel?.name ??
            resolvedModelId,
        });

      setSelectedHistoryId(
        newHistoryItem.id
      );
    } catch (error) {
      setPredictionError(
        error.message ||
          "Prediction request failed"
      );
    } finally {
      setPredicting(false);
    }
  }


  /*
   * เปิดผลลัพธ์เก่าจาก History
   *
   * ไม่สามารถนำไฟล์เดิมกลับเข้า
   * <input type="file"> อัตโนมัติได้
   * ดังนั้นเปลี่ยนเฉพาะ Result Panel
   */
  function handleSelectHistory(item) {
    setPredictionResult(item.result);
    setSelectedHistoryId(item.id);
    setPredictionError("");
    scrollToResultPanel();
  }


  function handleRemoveHistory(
    historyId
  ) {
    removePrediction(historyId);

    /*
     * ถ้ากำลังเปิดรายการที่ถูกลบ
     * ให้ล้าง Result Panel ด้วย
     */
    if (
      selectedHistoryId === historyId
    ) {
      setSelectedHistoryId("");
      setPredictionResult(null);
    }
  }


  function handleClearHistory() {
    clearHistory();
    setSelectedHistoryId("");
    setPredictionResult(null);
  }


  return (
    <div className="app-shell">
      <AppHeader
        apiStatus={apiStatus}
        apiError={apiError}
        onRetryApi={retryHealthCheck}
      />

      <YoloBottomBar />

      <main className="main-content">
        <PredictionForm
          models={models}
          modelsLoading={modelsLoading}
          modelsError={modelsError}
          onReloadModels={reloadModels}

          modelId={resolvedModelId}
          onModelChange={
            handleModelChange
          }

          confidence={confidence}
          onConfidenceChange={
            handleConfidenceChange
          }

          selectedFile={selectedFile}
          onFileChange={
            handleFileChange
          }

          previewUrl={previewUrl}
          fieldErrors={fieldErrors}

          predictionError={
            predictionError
          }

          predicting={predicting}

          onSubmit={handlePrediction}
          onReset={handleReset}
        />

        <div className="workflow-output">
          <PredictionResult
            key={
              selectedHistoryId ||
              predictionResult?.result_image_url ||
              (predicting
                ? "prediction-loading"
                : "prediction-empty")
            }
            result={predictionResult}
            predicting={predicting}
          />

          <PredictionHistory
            items={history}
            selectedId={
              selectedHistoryId
            }
            onSelect={
              handleSelectHistory
            }
            onRemove={
              handleRemoveHistory
            }
            onClear={
              handleClearHistory
            }
          />

        </div>
      </main>
    </div>
  );
}


export default App;
