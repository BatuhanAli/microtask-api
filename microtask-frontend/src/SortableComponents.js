import React, { useMemo, useCallback } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { validateStepsArray, generateStepId, safeExecute, dragLogger } from './dragUtils';

// SortableStepList component that wraps step items with sortable context
export function SortableStepList({ steps = [], onUpdateStep, onRemoveStep }) {
  // Validate and sanitize steps array
  const validSteps = useMemo(() => validateStepsArray(steps), [steps]);
  
  // Generate stable items array for SortableContext - handle steps without IDs
  const items = useMemo(() => {
    return validSteps.map((step, index) => generateStepId(step, index));
  }, [validSteps]);
  
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className="step-list-edit" data-testid="sortable-step-list">
        {validSteps.map((step, index) => (
          <SortableStepItem
            key={step.id || `${index}-${step.title}`}
            step={step}
            index={index}
            onUpdate={onUpdateStep}
            onRemove={onRemoveStep}
          />
        ))}
      </div>
    </SortableContext>
  );
}

// SortableStepItem component with drag handle and existing functionality
export function SortableStepItem({ step, index, onUpdate, onRemove }) {
  // Generate consistent ID for drag operations
  const itemId = useMemo(() => generateStepId(step, index), [step.id, index, step.title]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  // Optimized style calculation - constrain to vertical movement only
  const style = useMemo(() => {
    // Only allow vertical movement by zeroing out x translation
    const constrainedTransform = transform ? {
      ...transform,
      x: 0, // Force horizontal position to 0
    } : null;
    
    return {
      transform: CSS.Transform.toString(constrainedTransform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
  }, [transform, transition, isDragging]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleTitleChange = useCallback((e) => {
    safeExecute(
      () => {
        if (onUpdate && typeof onUpdate === 'function') {
          onUpdate(index, 'title', e.target.value);
        } else {
          dragLogger.warn('onUpdate handler not provided or not a function');
        }
      },
      'Error updating step title'
    );
  }, [onUpdate, index]);

  const handleRemove = useCallback(() => {
    safeExecute(
      () => {
        if (onRemove && typeof onRemove === 'function') {
          onRemove(index);
        } else {
          dragLogger.warn('onRemove handler not provided or not a function');
        }
      },
      'Error removing step'
    );
  }, [onRemove, index]);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="step-edit-item"
      data-dragging={isDragging}
    >
      {/* Drag handle */}
      <span 
        className="drag-handle" 
        {...attributes} 
        {...listeners}
        title="Drag to reorder step"
        aria-label={`Drag to reorder step: ${step.title || 'Untitled'}`}
      >
        ⋮⋮
      </span>
      
      {/* Step input field */}
      <input
        type="text"
        className="step-edit-input"
        value={step.title || ''}
        onChange={handleTitleChange}
        placeholder="Step description..."
        aria-label={`Step ${index + 1} title`}
      />
      
      {/* Remove button */}
      <button
        type="button"
        className="remove-step-btn"
        onClick={handleRemove}
        title="Remove step"
        aria-label={`Remove step: ${step.title || 'Untitled'}`}
      >
        ×
      </button>
    </div>
  );
}