// Utility functions for drag-and-drop operations and error handling

/**
 * Logger utility for drag operations with different levels
 */
export const dragLogger = {
  warn: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Drag-Drop] ${message}`, data);
    }
  },
  error: (message, error) => {
    console.error(`[Drag-Drop] ${message}`, error);
  },
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Drag-Drop Debug] ${message}`, data);
    }
  }
};

/**
 * Validates drag event structure
 */
export const validateDragEvent = (event) => {
  if (!event || typeof event !== 'object') {
    dragLogger.warn('Invalid drag event format', event);
    return false;
  }

  const { active, over } = event;
  
  if (!active || !active.id) {
    dragLogger.warn('Drag event missing active element', event);
    return false;
  }

  if (!over || !over.id) {
    dragLogger.warn('Drag event missing over element', event);
    return false;
  }

  return true;
};

/**
 * Validates step object structure
 */
export const validateStep = (step, index = null) => {
  if (!step || typeof step !== 'object') {
    dragLogger.warn(`Invalid step object${index !== null ? ` at index ${index}` : ''}`, step);
    return false;
  }

  // Title can be undefined (for new steps) but if present, should be string
  if (step.title !== undefined && typeof step.title !== 'string') {
    dragLogger.warn(`Invalid step title${index !== null ? ` at index ${index}` : ''}`, step.title);
    return false;
  }

  // Order should be a number if present
  if (step.order !== undefined && (typeof step.order !== 'number' || step.order < 1)) {
    dragLogger.warn(`Invalid step order${index !== null ? ` at index ${index}` : ''}`, step.order);
    return false;
  }

  return true;
};

/**
 * Validates and sanitizes steps array
 */
export const validateStepsArray = (steps) => {
  if (!Array.isArray(steps)) {
    dragLogger.warn('Steps must be an array', steps);
    return [];
  }

  return steps.filter((step, index) => validateStep(step, index));
};

/**
 * Generates stable fallback ID for steps without IDs
 */
export const generateStepId = (step, index) => {
  if (step.id) return step.id;
  
  // Create stable ID based on index and title
  const titlePart = step.title?.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') || 'untitled';
  return `fallback-${index}-${titlePart}`;
};

/**
 * Safe execution wrapper for drag operations
 */
export const safeExecute = (operation, errorMessage, fallbackValue = null) => {
  try {
    return operation();
  } catch (error) {
    dragLogger.error(errorMessage, error);
    return fallbackValue;
  }
};

/**
 * Debounce utility for rapid drag operations
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};