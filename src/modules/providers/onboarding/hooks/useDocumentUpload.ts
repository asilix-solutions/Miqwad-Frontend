/**
 * @file Local hook for managing document upload state.
 *
 * Tracks a list of `UploadDoc` items, each with simulated upload
 * progress. Uses `useReducer` for predictable state transitions.
 * This is purely local component state — no Redux involved.
 */

import { useCallback, useReducer } from "react";
import type { DocStatus, UploadDoc } from "../types";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "ADD"; payload: UploadDoc }
  | { type: "REMOVE"; id: string }
  | { type: "SET_STATUS"; id: string; status: DocStatus }
  | { type: "SET_PROGRESS"; id: string; progress: number }
  | { type: "SET_FILE"; id: string; fileName: string; sizeMb: number; fileExt: UploadDoc["fileExt"] }
  | { type: "RESET" };

function reducer(state: UploadDoc[], action: Action): UploadDoc[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.payload];
    case "REMOVE":
      return state.filter((d) => d.id !== action.id);
    case "SET_STATUS":
      return state.map((d) =>
        d.id === action.id ? { ...d, status: action.status } : d,
      );
    case "SET_PROGRESS":
      return state.map((d) =>
        d.id === action.id ? { ...d, progress: action.progress } : d,
      );
    case "SET_FILE":
      return state.map((d) =>
        d.id === action.id
          ? { ...d, fileName: action.fileName, sizeMb: action.sizeMb, fileExt: action.fileExt }
          : d,
      );
    case "RESET":
      return [];
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDocumentUpload(initialDocs: UploadDoc[] = []) {
  const [documents, dispatch] = useReducer(reducer, initialDocs);

  const addDocument = useCallback((doc: UploadDoc) => {
    dispatch({ type: "ADD", payload: doc });
  }, []);

  const removeDocument = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const cancelUpload = useCallback((id: string) => {
    dispatch({ type: "SET_STATUS", id, status: "idle" });
    dispatch({ type: "SET_PROGRESS", id, progress: 0 });
  }, []);

  const setProgress = useCallback((id: string, progress: number) => {
    dispatch({ type: "SET_PROGRESS", id, progress });
  }, []);

  const setStatus = useCallback((id: string, status: DocStatus) => {
    dispatch({ type: "SET_STATUS", id, status });
  }, []);

  const setFile = useCallback(
    (id: string, fileName: string, sizeMb: number, fileExt: UploadDoc["fileExt"]) => {
      dispatch({ type: "SET_FILE", id, fileName, sizeMb, fileExt });
    },
    [],
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    documents,
    addDocument,
    removeDocument,
    cancelUpload,
    setProgress,
    setStatus,
    setFile,
    reset,
  } as const;
}
