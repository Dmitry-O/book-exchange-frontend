import { useEffect, useMemo, useRef, useState } from "react";
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
  photoBase64,
  photoUrl,
  removePending = false
}) {
  const [cropState, setCropState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [applyPending, setApplyPending] = useState(false);
  const dragRef = useRef(null);
  const previewPreset = cropPresets[kind];
  const previewSource = resolvePreviewSource(photoBase64, photoUrl);
  const hasPreview = Boolean(previewSource);
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

  async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const source = await readFileAsDataUrl(file);
    const meta = await readImageMeta(source);

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

  const helperCopy =
    helperText === undefined
      ? kind === "book"
        ? "A vertical cover image makes the listing look much better in the catalog."
        : "Choose an image, adjust the crop, and the form will send the resulting base64 payload."
      : helperText;

  return (
    <>
      <label className="field">
        <span>{label}</span>
        {kind === "book" ? (
          <div className="image-field-shell image-field-shell-book">
            <div className="image-upload-book-top">
              <label
                className={
                  hasPreview
                    ? "image-preview-trigger image-preview-trigger-book"
                    : "image-preview-trigger image-preview-trigger-book image-preview-trigger-empty"
                }
              >
                <BookCover
                  className="image-upload-book-cover"
                  photoUrl={previewSource}
                  size="upload"
                  title={entityName}
                />
                {!hasPreview ? (
                  <span className="image-preview-empty-cta">+ Add photo</span>
                ) : null}
                <input accept="image/*" className="image-preview-file-input" onChange={handleFileSelection} type="file" />
              </label>

              <div className="image-upload-book-actions">
                {hasPreview ? (
                  <label className="button button-secondary image-upload-trigger">
                    Replace photo
                    <input accept="image/*" onChange={handleFileSelection} type="file" />
                  </label>
                ) : null}
                {canRenderRemoveAction ? (
                  <button
                    className="button button-secondary"
                    disabled={!canRemove || removePending}
                    onClick={() => void handleRemoveClick()}
                    type="button"
                  >
                    {removePending
                      ? "Deleting photo..."
                      : hasPendingUpload
                        ? "Discard selected photo"
                        : "Delete saved photo"}
                  </button>
                ) : null}
              </div>

              {helperCopy ? <p className="field-hint">{helperCopy}</p> : null}

              {hasPendingUpload ? (
                <p className="inline-message inline-message-success">
                  New image selected. Save the form to upload it.
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
                    name={entityName}
                    photoUrl={previewSource}
                    size="xl"
                  />
                </div>
                {!hasPreview ? <span className="image-preview-empty-cta">Add photo</span> : null}
                <input accept="image/*" className="image-preview-file-input" onChange={handleFileSelection} type="file" />
              </label>

              <div className="image-upload-book-actions">
                {hasPreview ? (
                  <label className="button button-secondary image-upload-trigger">
                    Replace photo
                    <input accept="image/*" onChange={handleFileSelection} type="file" />
                  </label>
                ) : null}
                {canRenderRemoveAction ? (
                  <button
                    className="button button-secondary"
                    disabled={!canRemove || removePending}
                    onClick={() => void handleRemoveClick()}
                    type="button"
                  >
                    {removePending
                      ? "Deleting photo..."
                      : hasPendingUpload
                        ? "Discard selected photo"
                        : "Delete saved photo"}
                  </button>
                ) : null}
              </div>

              {helperCopy ? <p className="field-hint">{helperCopy}</p> : null}

              {hasPendingUpload ? (
                <p className="inline-message inline-message-success">
                  New image selected. Save the form to upload it.
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
              setCropState(null);
            }
          }}
          role="presentation"
        >
          <section aria-modal="true" className="modal-panel" role="dialog">
            <div className="row-between">
              <div>
                <span className="eyebrow">Photo crop</span>
                <h2>{cropState.fileName}</h2>
              </div>
              <button className="modal-close" onClick={() => setCropState(null)} type="button">
                Close
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
                    ? "Use zoom for framing, then drag the image inside the preview to position it. The same crop is used for the uploaded base64 image."
                    : "Drag the image inside the preview to position the visible area. The same crop is used for the uploaded base64 image."}
                </p>

                {kind === "user" ? (
                  <div className="field">
                    <span>Zoom</span>
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

                <p className="field-hint">Tip: drag with mouse or finger to move the photo.</p>

                <div className="card-actions">
                  <button className="button" disabled={applyPending} onClick={() => void handleApplyCrop()} type="button">
                    {applyPending ? (kind === "user" ? "Uploading..." : "Applying...") : kind === "user" ? "Upload photo" : "Apply crop"}
                  </button>
                  <button
                    className="button button-secondary"
                    disabled={applyPending}
                    onClick={() => setCropState(null)}
                    type="button"
                  >
                    Cancel
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
