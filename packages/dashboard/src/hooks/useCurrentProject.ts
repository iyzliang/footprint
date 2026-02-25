import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fp_current_project_id';

export function useCurrentProject() {
  const [projectId, setProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const setProjectId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setProjectIdState(id);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== projectId) {
      setProjectIdState(stored);
    }
  }, [projectId]);

  return { projectId, setProjectId };
}
