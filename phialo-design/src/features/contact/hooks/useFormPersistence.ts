import { useEffect, useCallback, useRef } from 'react';

interface UseFormPersistenceOptions {
  storageKey: string;
  excludeFields?: string[];
  clearOnSuccess?: boolean;
}

export function useFormPersistence<T extends Record<string, any>>(
  formData: T,
  setFormData: (data: T) => void,
  options: UseFormPersistenceOptions
) {
  const { storageKey, excludeFields = [] } = options;
  const isInitialMount = useRef(true);
  const hasLoadedData = useRef(false);

  // Load persisted data on mount
  useEffect(() => {
    // Only run on client side and on initial mount
    if (typeof window === 'undefined') return;
    
    // Prevent loading data multiple times
    if (hasLoadedData.current) return;
    
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Only restore fields that aren't excluded
        const restoredData = { ...formData };
        let hasChanges = false;
        
        Object.keys(parsedData).forEach((key) => {
          if (!excludeFields.includes(key) && key in formData && parsedData[key]) {
            (restoredData as any)[key] = parsedData[key];
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          setFormData(restoredData);
          hasLoadedData.current = true;
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }
  }, []); // Only run on mount

  // Save data whenever it changes (but not on initial mount)
  useEffect(() => {
    // Skip saving on initial mount to prevent overwriting loaded data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      // Filter out excluded fields before saving
      const dataToSave = { ...formData };
      excludeFields.forEach((field) => {
        delete dataToSave[field];
      });
      
      // Only save if there's actual data to save
      const hasContent = Object.values(dataToSave).some(value => 
        value !== '' && value !== null && value !== undefined
      );
      
      if (hasContent) {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.warn('Failed to persist form data:', error);
    }
  }, [formData, storageKey, excludeFields]);

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear persisted form data:', error);
    }
  }, [storageKey]);

  return { clearPersistedData };
}