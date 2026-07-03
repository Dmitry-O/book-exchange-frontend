import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { DemoPrivacyNotice } from "./DemoPrivacyNotice";
import { RefreshIcon, TrashIcon } from "./Icons";
import { BookCover, UserAvatar } from "./Media";

const cropPresets = {
  book: {
    previewWidth: 280,
    previewHeight: 420,
    outputWidth: 1200,
    outputHeight: 1800
  },
  user: {
    previewWidth: 260,
    previewHeight: 260,
    outputWidth: 720,
    outputHeight: 720
  }
};

export function ImageUploadField({
  entityName,
  error,
  helperText,
  kind = "book",
  label,
  message,
  onChange,
  onRemove,
  onSelectionPendingChange,
  photoBase64,
  photoUrl,
  removePending = false
}) {
  const { locale } = useLocale();
  const text = imageUploadText[locale] ?? imageUploadText.en;
  const [cropState, setCropState] = useState(null);
  const [selectedPreviewSource, setSelectedPreviewSource] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [applyPending, setApplyPending] = useState(false);
  const dragRef = useRef(null);
  const previewPreset = cropPresets[kind];
  const previewSource = resolvePreviewSource(photoBase64, photoUrl);
  const displayPreviewSource = cropState?.source || selectedPreviewSource || previewSource;
  const hasPendingSelection = Boolean(cropState);
  const hasPreview = Boolean(displayPreviewSource);
  const hasSavedPhoto = Boolean(photoUrl);
  const hasPendingUpload = typeof photoBase64 === "string" && photoBase64.length > 0;
  const canRenderRemoveAction = hasPendingUpload || (hasSavedPhoto && typeof onRemove === "function");
  const canRemove = hasPendingUpload || (hasSavedPhoto && typeof onRemove === "function");

  const previewMetrics = useMemo(() => {
    if (!cropState) {
      return null;
    }

    return getCropMetrics(
      cropState.width,
      cropState.height,
      previewPreset.previewWidth,
      previewPreset.previewHeight,
      cropState.zoom,
      cropState.offsetXPercent,
      cropState.offsetYPercent
    );
  }, [cropState, previewPreset.previewHeight, previewPreset.previewWidth]);

  useEffect(() => {
    if (!cropState || !previewMetrics) {
      return;
    }

    if (
      previewMetrics.clampedOffsetXPercent === cropState.offsetXPercent &&
      previewMetrics.clampedOffsetYPercent === cropState.offsetYPercent
    ) {
      return;
    }

    setCropState((current) =>
      current
        ? {
            ...current,
            offsetXPercent: previewMetrics.clampedOffsetXPercent,
            offsetYPercent: previewMetrics.clampedOffsetYPercent
          }
        : current
    );
  }, [cropState, previewMetrics]);

  useEffect(() => {
    if (cropState) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
    setApplyPending(false);
  }, [cropState]);

  useEffect(() => {
    if (typeof onSelectionPendingChange !== "function") {
      return undefined;
    }

    onSelectionPendingChange(hasPendingSelection);

    return () => {
      onSelectionPendingChange(false);
    };
  }, [hasPendingSelection, onSelectionPendingChange]);

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const source = await readFileAsDataUrl(file);
    const meta = await readImageMeta(source);

    setSelectedPreviewSource(source);
    setCropState({
      source,
      fileName: file.name,
      width: meta.width,
      height: meta.height,
      zoom: 1,
      offsetXPercent: 0,
      offsetYPercent: 0
    });
  }

  async function handleApplyCrop() {
    if (!cropState) {
      return;
    }

    setApplyPending(true);

    try {
      const croppedBase64 = await cropImage(cropState, previewPreset);
      await Promise.resolve(onChange(croppedBase64));
      setSelectedPreviewSource(croppedBase64);
    } catch {
      // Caller-owned error state is rendered outside this modal.
    } finally {
      setApplyPending(false);
      setCropState(null);
    }
  }

  function handleZoomStep(direction) {
    setCropState((current) =>
      current
        ? {
            ...current,
            zoom: clamp(Number((current.zoom + direction * 0.15).toFixed(2)), 1, 3)
          }
        : current
    );
  }

  async function handleRemoveClick() {
    setSelectedPreviewSource("");

    if (hasPendingUpload) {
      onChange(null);
      return;
    }

    if (typeof onRemove === "function") {
      await onRemove();
    }
  }

  function handlePointerDown(event) {
    if (!cropState || !previewMetrics) {
      return;
    }

    event.preventDefault();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetXPercent: cropState.offsetXPercent,
      startOffsetYPercent: cropState.offsetYPercent,
      maxOffsetX: previewMetrics.maxOffsetX,
      maxOffsetY: previewMetrics.maxOffsetY
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event) {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const nextOffsetXPercent =
      dragState.maxOffsetX > 0
        ? dragState.startOffsetXPercent + (deltaX / dragState.maxOffsetX) * 100
        : 0;
    const nextOffsetYPercent =
      dragState.maxOffsetY > 0
        ? dragState.startOffsetYPercent + (deltaY / dragState.maxOffsetY) * 100
        : 0;

    setCropState((current) =>
      current
        ? {
            ...current,
            offsetXPercent: clamp(nextOffsetXPercent, -100, 100),
            offsetYPercent: clamp(nextOffsetYPercent, -100, 100)
          }
        : current
    );
  }

  function handlePointerUp(event) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function closeCropModal() {
    setSelectedPreviewSource("");
    setCropState(null);
  }

  const helperCopy =
    helperText === undefined
      ? kind === "book"
        ? text.bookHelper
        : text.userHelper
      : helperText;

  return (
    <>
      <label className="field">
        <span>{label}</span>
        {kind === "book" ? (
          <div className="image-field-shell image-field-shell-book">
            <div className="image-upload-book-top">
              <div className="image-upload-book-preview-shell">
                <label
                  className={
                    hasPreview
                      ? "image-preview-trigger image-preview-trigger-book"
                      : "image-preview-trigger image-preview-trigger-book image-preview-trigger-empty"
                  }
                >
                  <BookCover
                    className="image-upload-book-cover"
                    key={displayPreviewSource || "empty-book-preview"}
                    photoUrl={displayPreviewSource}
                    size="upload"
                    title={entityName}
                  />
                  {!hasPreview ? (
                    <span className="image-preview-empty-cta">{text.addPhotoCta}</span>
                  ) : null}
                  <input accept="image/*" className="image-preview-file-input" onChange={handleFileSelection} type="file" />
                </label>

                <div className="image-upload-book-actions image-upload-book-actions-float">
                  {hasPreview ? (
                    <label
                      aria-label={text.replacePhoto}
                      className="icon-button image-upload-icon-button image-upload-trigger"
                      title={text.replacePhoto}
                    >
                      <RefreshIcon />
                      <input accept="image/*" onChange={handleFileSelection} type="file" />
                    </label>
                  ) : null}
                  {canRenderRemoveAction ? (
                    <button
                      aria-label={hasPendingUpload ? text.discardSelectedPhoto : text.deleteSavedPhoto}
                      className="icon-button icon-button-danger image-upload-icon-button"
                      disabled={!canRemove || removePending}
                      onClick={() => void handleRemoveClick()}
                      title={hasPendingUpload ? text.discardSelectedPhoto : text.deleteSavedPhoto}
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  ) : null}
                </div>
              </div>

              <DemoPrivacyNotice compact className="image-upload-demo-notice" />

              {helperCopy ? <p className="field-hint">{helperCopy}</p> : null}

              {hasPendingUpload ? (
                <p className="inline-message inline-message-success">
                  {text.newImageSelected}
                </p>
              ) : null}
              {message ? <p className="inline-message inline-message-success">{message}</p> : null}
              {error ? <p className="inline-message inline-message-error">{error}</p> : null}
            </div>
          </div>
        ) : (
          <div className="image-field-shell image-field-shell-user">
            <div className="image-upload-user-top">
              <label
                className={
                  hasPreview
                    ? "image-preview-trigger image-preview-trigger-user"
                    : "image-preview-trigger image-preview-trigger-user image-preview-trigger-empty"
                }
              >
                <div className="image-upload-user-avatar">
                  <UserAvatar
                    className="image-upload-user-avatar-media"
                    key={displayPreviewSource || "empty-user-preview"}
                    name={entityName}
                    photoUrl={displayPreviewSource}
                    size="xl"
                  />
                </div>
                {!hasPreview ? <span className="image-preview-empty-cta">{text.addPhoto}</span> : null}
                <input accept="image/*" className="image-preview-file-input" onChange={handleFileSelection} type="file" />
              </label>

              <div className="image-upload-book-actions image-upload-user-actions">
                {hasPreview ? (
                  <label
                    aria-label={text.replacePhoto}
                    className="icon-button image-upload-icon-button image-upload-trigger"
                    title={text.replacePhoto}
                  >
                    <RefreshIcon />
                    <input accept="image/*" onChange={handleFileSelection} type="file" />
                  </label>
                ) : null}
                {canRenderRemoveAction ? (
                  <button
                    aria-label={hasPendingUpload ? text.discardSelectedPhoto : text.deleteSavedPhoto}
                    className="icon-button icon-button-danger image-upload-icon-button"
                    disabled={!canRemove || removePending}
                    onClick={() => void handleRemoveClick()}
                    title={hasPendingUpload ? text.discardSelectedPhoto : text.deleteSavedPhoto}
                    type="button"
                  >
                    <TrashIcon />
                  </button>
                ) : null}
              </div>

              <DemoPrivacyNotice compact className="image-upload-demo-notice" />

              {helperCopy ? <p className="field-hint">{helperCopy}</p> : null}

              {hasPendingUpload ? (
                <p className="inline-message inline-message-success">
                  {text.newImageSelected}
                </p>
              ) : null}
              {message ? <p className="inline-message inline-message-success">{message}</p> : null}
              {error ? <p className="inline-message inline-message-error">{error}</p> : null}
            </div>
          </div>
        )}
      </label>

      {cropState && previewMetrics ? (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCropModal();
            }
          }}
          role="presentation"
        >
          <section aria-modal="true" className="modal-panel" role="dialog">
            <div className="row-between">
              <div>
                <span className="eyebrow">{text.photoCrop}</span>
                <h2>{cropState.fileName}</h2>
              </div>
              <button className="modal-close" onClick={closeCropModal} type="button">
                {text.close}
              </button>
            </div>

            <div className="image-crop-grid">
              <div
                className={
                  kind === "user"
                    ? `image-crop-preview image-crop-preview-avatar${
                        isDragging ? " image-crop-preview-dragging" : ""
                      }`
                    : `image-crop-preview image-crop-preview-book${
                        isDragging ? " image-crop-preview-dragging" : ""
                      }`
                }
                onPointerCancel={handlePointerUp}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  width: `${previewPreset.previewWidth}px`,
                  height: `${previewPreset.previewHeight}px`
                }}
              >
                <img
                  alt="Crop preview"
                  className="image-crop-preview-image"
                  src={cropState.source}
                  style={{
                    width: `${previewMetrics.drawWidth}px`,
                    height: `${previewMetrics.drawHeight}px`,
                    left: `${previewMetrics.drawX}px`,
                    top: `${previewMetrics.drawY}px`
                  }}
                />
                <div className="image-crop-overlay" />
              </div>

              <div className="content-stack">
                <p className="field-hint">
                  {kind === "user"
                    ? text.userCropHint
                    : text.bookCropHint}
                </p>

                {kind === "user" ? (
                  <div className="field">
                    <span>{text.zoom}</span>
                    <div className="zoom-stepper">
                      <button
                        className="button button-secondary"
                        disabled={cropState.zoom <= 1}
                        onClick={() => handleZoomStep(-1)}
                        type="button"
                      >
                        -
                      </button>
                      <strong>{Math.round(cropState.zoom * 100)}%</strong>
                      <button
                        className="button button-secondary"
                        disabled={cropState.zoom >= 3}
                        onClick={() => handleZoomStep(1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null}

                <p className="field-hint">{text.dragTip}</p>

                <div className="card-actions">
                  <button className="button" disabled={applyPending} onClick={() => void handleApplyCrop()} type="button">
                    {applyPending
                      ? kind === "user"
                        ? text.uploading
                        : text.applying
                      : kind === "user"
                        ? text.uploadPhoto
                        : text.applyCrop}
                  </button>
                  <button
                    className="button button-secondary"
                    disabled={applyPending}
                    onClick={closeCropModal}
                    type="button"
                  >
                    {text.cancel}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function resolvePreviewSource(photoBase64, photoUrl) {
  if (typeof photoBase64 === "string" && photoBase64.length > 0) {
    return photoBase64;
  }

  return photoUrl || "";
}

function getCropMetrics(
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  zoom,
  offsetXPercent,
  offsetYPercent
) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * zoom;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const maxOffsetX = Math.max(0, (drawWidth - targetWidth) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - targetHeight) / 2);
  const clampedOffsetXPercent = clamp(offsetXPercent, maxOffsetX > 0 ? -100 : 0, maxOffsetX > 0 ? 100 : 0);
  const clampedOffsetYPercent = clamp(offsetYPercent, maxOffsetY > 0 ? -100 : 0, maxOffsetY > 0 ? 100 : 0);
  const drawX = (targetWidth - drawWidth) / 2 + maxOffsetX * (clampedOffsetXPercent / 100);
  const drawY = (targetHeight - drawHeight) / 2 + maxOffsetY * (clampedOffsetYPercent / 100);

  return {
    drawWidth,
    drawHeight,
    drawX,
    drawY,
    maxOffsetX,
    maxOffsetY,
    clampedOffsetXPercent,
    clampedOffsetYPercent
  };
}

async function cropImage(cropState, preset) {
  const image = await readImageElement(cropState.source);
  const metrics = getCropMetrics(
    image.width,
    image.height,
    preset.outputWidth,
    preset.outputHeight,
    cropState.zoom,
    cropState.offsetXPercent,
    cropState.offsetYPercent
  );

  const canvas = document.createElement("canvas");
  canvas.width = preset.outputWidth;
  canvas.height = preset.outputHeight;

  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#f3ede3";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, metrics.drawX, metrics.drawY, metrics.drawWidth, metrics.drawHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

async function readImageMeta(source) {
  const image = await readImageElement(source);

  return {
    width: image.width,
    height: image.height
  };
}

async function readImageElement(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Selected image could not be loaded."));
    image.src = source;
  });
}

const imageUploadText = {
  en: {
    addPhoto: "Add photo",
    addPhotoCta: "+ Add photo",
    applying: "Applying...",
    applyCrop: "Apply crop",
    bookCropHint:
      "Drag the image inside the preview to position the visible area. The same crop is used for the uploaded base64 image.",
    bookHelper: "A book with its own photo looks more noticeable and trustworthy to other readers.",
    cancel: "Cancel",
    close: "Close",
    deleteSavedPhoto: "Delete saved photo",
    deletingPhoto: "Deleting photo...",
    discardSelectedPhoto: "Discard selected photo",
    dragTip: "Tip: drag with mouse or finger to move the photo.",
    newImageSelected: "New image selected. Save the form to upload it.",
    photoCrop: "Photo crop",
    replacePhoto: "Replace photo",
    uploadPhoto: "Upload photo",
    uploading: "Uploading...",
    userCropHint:
      "Use zoom for framing, then drag the image inside the preview to position it. The same crop is used for the uploaded base64 image.",
    userHelper:
      "Choose an image, adjust the crop, and the form will send the resulting base64 payload.",
    zoom: "Zoom"
  },
  de: {
    addPhoto: "Foto hinzufügen",
    addPhotoCta: "+ Foto hinzufügen",
    applying: "Wird angewendet...",
    applyCrop: "Zuschnitt anwenden",
    bookCropHint:
      "Ziehe das Bild im Vorschaufenster, um den sichtbaren Bereich zu positionieren. Derselbe Zuschnitt wird für das hochgeladene Base64-Bild verwendet.",
    bookHelper: "Ein Buch mit eigenem Foto fällt anderen Leserinnen und Lesern besser auf und wirkt vertrauenswürdiger.",
    cancel: "Abbrechen",
    close: "Schließen",
    deleteSavedPhoto: "Gespeichertes Foto löschen",
    deletingPhoto: "Foto wird gelöscht...",
    discardSelectedPhoto: "Ausgewähltes Foto verwerfen",
    dragTip: "Tipp: Ziehe das Foto mit Maus oder Finger.",
    newImageSelected: "Neues Bild ausgewählt. Speichere das Formular, um es hochzuladen.",
    photoCrop: "Foto zuschneiden",
    replacePhoto: "Foto ersetzen",
    uploadPhoto: "Foto hochladen",
    uploading: "Wird hochgeladen...",
    userCropHint:
      "Nutze den Zoom für den Bildausschnitt und ziehe das Bild in der Vorschau an die richtige Position. Derselbe Zuschnitt wird für das hochgeladene Base64-Bild verwendet.",
    userHelper:
      "Wähle ein Bild aus, passe den Zuschnitt an und das Formular sendet daraus den Base64-Upload.",
    zoom: "Zoom"
  },
  ru: {
    addPhoto: "Добавить фото",
    addPhotoCta: "+ Добавить фото",
    applying: "Применение...",
    applyCrop: "Применить обрезку",
    bookCropHint:
      "Перетащите изображение внутри превью, чтобы выбрать видимую область. Та же обрезка будет использована для загружаемого base64-изображения.",
    bookHelper: "Книга с фото заметнее для других пользователей и выглядит привлекательнее в каталоге.",
    cancel: "Отмена",
    close: "Закрыть",
    deleteSavedPhoto: "Удалить сохранённое фото",
    deletingPhoto: "Удаление фото...",
    discardSelectedPhoto: "Убрать выбранное фото",
    dragTip: "Подсказка: перетаскивайте фото мышкой или пальцем.",
    newImageSelected: "Новое изображение выбрано. Сохраните форму, чтобы загрузить его.",
    photoCrop: "Обрезка фото",
    replacePhoto: "Заменить фото",
    uploadPhoto: "Загрузить фото",
    uploading: "Загрузка...",
    userCropHint:
      "Используйте зум для кадрирования, затем перетащите изображение внутри превью. Та же обрезка будет использована для загружаемого base64-изображения.",
    userHelper:
      "Выберите изображение, настройте обрезку, и форма отправит итоговый base64 payload.",
    zoom: "Зум"
  }
};
