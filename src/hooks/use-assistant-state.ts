import { useCallback, useEffect, useState } from "react";
import { readAssistantState, updateAssistantState } from "@/lib/assistantState";

export function useAssistantState() {
  const [state, setState] = useState(readAssistantState());

  useEffect(() => {
    const handleStorage = () => setState(readAssistantState());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const update = useCallback(
    (updater: Parameters<typeof updateAssistantState>[0]) => {
      const next = updateAssistantState(updater);
      setState(next);
      return next;
    },
    []
  );

  const refresh = useCallback(() => {
    setState(readAssistantState());
  }, []);

  return { state, update, refresh };
}
