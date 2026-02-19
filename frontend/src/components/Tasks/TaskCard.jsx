import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const priorityConfig = {
  alta: { label: 'Alta', severity: 'danger', icon: 'pi-arrow-up' },
  media: { label: 'Media', severity: 'warning', icon: 'pi-minus' },
  baja: { label: 'Baja', severity: 'success', icon: 'pi-arrow-down' },
};

const TaskCard = ({ task, onEdit, onDelete, onClick }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.media;
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#818cf8';
        e.currentTarget.style.backgroundColor = '#111827';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.backgroundColor = '#0f172a';
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{
          color: '#e2e8f0',
          fontSize: '0.875rem',
          fontWeight: 500,
          flex: 1,
          lineHeight: '1.4',
        }}>
          {task.title}
        </span>
        <div
          style={{ display: 'flex', gap: '2px', marginLeft: '0.5rem', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <Button
            icon="pi pi-pencil"
            size="small"
            text
            rounded
            severity="secondary"
            onClick={onEdit}
            style={{ width: '1.6rem', height: '1.6rem' }}
            tooltip="Editar"
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            icon="pi pi-trash"
            size="small"
            text
            rounded
            severity="danger"
            onClick={onDelete}
            style={{ width: '1.6rem', height: '1.6rem' }}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          margin: '0 0 0.625rem',
          color: '#64748b',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Subtasks progress */}
      {subtaskCount > 0 && (
        <div style={{ marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Subtareas</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{completedSubtasks}/{subtaskCount}</span>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${(completedSubtasks / subtaskCount) * 100}%`,
              height: '100%',
              backgroundColor: '#818cf8',
              borderRadius: '3px',
              transition: 'width 0.3s',
            }}></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <Tag
          value={priority.label}
          severity={priority.severity}
          icon={`pi ${priority.icon}`}
          style={{ fontSize: '0.7rem', padding: '2px 6px' }}
        />
        {parseFloat(task.estimated_hours) > 0 && (
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
            <i className="pi pi-clock" style={{ marginRight: '3px', fontSize: '0.7rem' }}></i>
            {task.estimated_hours}h
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
