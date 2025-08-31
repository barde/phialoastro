import { useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  storageKey: string;
  excludeFields?: string[];
  clearOnSuccess?: boolean;
}

export function useFormPersistence<T extends Record<string, any>>(
  formData: T,
  setFormData: (data: T) => void,
  options: FormPersistenceOptions
) {
  const { storageKey, excludeFields = [], clearOnSuccess = true } = options;

  // Load persisted data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out excluded fields
        const filtered = Object.keys(parsed).reduce((acc, key) => {
          if (!excludeFields.includes(key)) {
            acc[key] = parsed[key];
          }
          return acc;
        }, {} as T);
        setFormData({ ...formData, ...filtered });
      }
    } catch (err) {
      console.error('Failed to load persisted form data:', err);
    }
  }, []); // Only run on mount

  // Save data whenever it changes
  useEffect(() => {
    try {
      // Filter out excluded fields before saving
      const toSave = Object.keys(formData).reduce((acc, key) => {
        if (!excludeFields.includes(key)) {
          acc[key] = formData[key];
        }
        return acc;
      }, {} as T);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (err) {
      console.error('Failed to persist form data:', err);
    }
  }, [formData, storageKey, excludeFields]);

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Failed to clear persisted form data:', err);
    }
  }, [storageKey]);

  return { clearPersistedData };
}