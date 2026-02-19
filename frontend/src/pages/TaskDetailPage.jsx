import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';
import AIDecomposer from '../components/AI/AIDecomposer';
import TaskFormDialog from '../components/Tasks/TaskFormDialog';
import * as tasksApi from '../api/tasks';
import * as subtasksApi from '../api/subtasks';
import * as projectsApi from '../api/projects';

const priorityConfig = {
  alta: { label: 'Alta', severity: 'danger', icon: 'pi-arrow-up' },
  media: { label: 'Media', severity: 'warning', icon: 'pi-minus' },
  baja: { label: 'Baja', severity: 'success', icon: 'pi-arrow-down' },
};

const statusConfig = {
  backlog: { label: 'Backlog', severity: 'secondary', icon: 'pi-inbox' },
  en_progreso: { label: 'En Progreso', severity: 'warning', icon: 'pi-sync' },
  testing: { label: 'Testing', severity: 'info', icon: 'pi-search' },
  terminada: { label: 'Terminada', severity: 'success', icon: 'pi-check-circle' },
};

const statusOptions = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'En Progreso', value: 'en_progreso' },
  { label: 'Testing', value: 'testing' },
  { label: 'Terminada', value: 'terminada' },
];

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiDialogVisible, setAiDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const [taskData, projectData] = await Promise.all([
        tasksApi.getTask(projectId, taskId),
        projectsApi.getProject(projectId),
      ]);
      setTask(taskData);
      setProject(projectData);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [projectId, taskId]);

  const handleSubtaskToggle = async (subtask) => {
    try {
      const updated = await subtasksApi.updateSubtask(projectId, taskId, subtask.id, {
        ...subtask,
        is_completed: !subtask.is_completed,
      });
      setTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s => s.id === subtask.id ? { ...s, is_completed: !s.is_completed } : s),
      }));
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    }
  };

  const handleDeleteSubtask = (subtask) => {
    confirmDialog({
      message: `¿Eliminar la subtarea "${subtask.title}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await subtasksApi.deleteSubtask(projectId, taskId, subtask.id);
          toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Subtarea eliminada' });
          setTask(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter(s => s.id !== subtask.id),
          }));
        } catch (error) {
          toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
        }
      },
    });
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await tasksApi.updateTask(projectId, taskId, { ...task, status: newStatus });
      setTask(prev => ({ ...prev, status: newStatus }));
      toast.current.show({ severity: 'success', summary: 'Estado actualizado', detail: statusConfig[newStatus]?.label });
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!task) return null;

  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const totalEstimatedHours = task.subtasks?.reduce((acc, s) => acc + parseFloat(s.estimated_hours || 0), 0) || 0;

  const breadcrumbHome = { icon: 'pi pi-home', command: () => navigate('/') };
  const breadcrumbItems = [
    { label: project?.name || 'Proyecto', command: () => navigate(`/projects/${projectId}`) },
    { label: task.title },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <BreadCrumb
        model={breadcrumbItems}
        home={breadcrumbHome}
        style={{ background: 'transparent', border: 'none', padding: '0 0 1rem' }}
      />

      {/* Task header card */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.75rem', color: '#e2e8f0', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.3 }}>
              {task.title}
            </h1>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <Tag
                value={priorityConfig[task.priority]?.label || task.priority}
                severity={priorityConfig[task.priority]?.severity}
                icon={`pi ${priorityConfig[task.priority]?.icon}`}
              />
            </div>

            {task.description && (
              <p style={{ margin: '0 0 1rem', color: '#94a3b8', lineHeight: 1.6, fontSize: '0.9rem' }}>
                {task.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {parseFloat(task.estimated_hours) > 0 && (
                <span style={{ color: '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="pi pi-clock" style={{ fontSize: '0.8rem' }}></i>
                  Estimación: <strong style={{ color: '#94a3b8', marginLeft: '3px' }}>{task.estimated_hours}h</strong>
                </span>
              )}
              {totalSubtasks > 0 && (
                <span style={{ color: '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="pi pi-list" style={{ fontSize: '0.8rem' }}></i>
                  Subtareas: <strong style={{ color: '#94a3b8', marginLeft: '3px' }}>{completedSubtasks}/{totalSubtasks}</strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '160px' }}>
            <Dropdown
              value={task.status}
              options={statusOptions}
              onChange={(e) => handleStatusChange(e.value)}
              disabled={updatingStatus}
              style={{ width: '160px' }}
            />
            <Button
              label="Editar tarea"
              icon="pi pi-pencil"
              size="small"
              text
              severity="secondary"
              onClick={() => setEditDialogVisible(true)}
              style={{ width: '160px' }}
            />
          </div>
        </div>
      </div>

      {/* Subtasks section */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 600 }}>Subtareas</h2>
            {totalSubtasks > 0 && (
              <span style={{
                backgroundColor: '#334155',
                color: '#94a3b8',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}>
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
          <Button
            label="Descomponer con IA"
            icon="pi pi-sparkles"
            severity="secondary"
            size="small"
            onClick={() => setAiDialogVisible(true)}
            style={{ whiteSpace: 'nowrap' }}
          />
        </div>

        {/* Progress bar */}
        {totalSubtasks > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Progreso de subtareas</span>
              <span style={{ color: subtaskProgress === 100 ? '#10b981' : '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
                {subtaskProgress}%
              </span>
            </div>
            <div style={{ backgroundColor: '#334155', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${subtaskProgress}%`,
                height: '100%',
                backgroundColor: subtaskProgress === 100 ? '#10b981' : '#818cf8',
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }}></div>
            </div>
          </div>
        )}

        {task.subtasks?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <i className="pi pi-sparkles" style={{ fontSize: '2.5rem', color: '#334155' }}></i>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              No hay subtareas. Usa la IA para descomponer esta tarea automáticamente.
            </p>
            <Button
              label="Descomponer con IA"
              icon="pi pi-sparkles"
              size="small"
              onClick={() => setAiDialogVisible(true)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {task.subtasks?.map((subtask) => (
              <div
                key={subtask.id}
                style={{
                  backgroundColor: '#0f172a',
                  border: `1px solid ${subtask.is_completed ? '#1e3a2e' : '#334155'}`,
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  transition: 'border-color 0.2s',
                }}
              >
                <Checkbox
                  checked={subtask.is_completed}
                  onChange={() => handleSubtaskToggle(subtask)}
                  style={{ marginTop: '1px', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      color: subtask.is_completed ? '#475569' : '#e2e8f0',
                      textDecoration: subtask.is_completed ? 'line-through' : 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      lineHeight: 1.3,
                      flex: 1,
                    }}>
                      {subtask.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <Tag
                        value={priorityConfig[subtask.priority]?.label || subtask.priority}
                        severity={priorityConfig[subtask.priority]?.severity}
                        style={{ fontSize: '0.7rem' }}
                      />
                      {parseFloat(subtask.estimated_hours) > 0 && (
                        <span style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <i className="pi pi-clock" style={{ fontSize: '0.7rem', marginRight: '2px' }}></i>
                          {subtask.estimated_hours}h
                        </span>
                      )}
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        rounded
                        severity="danger"
                        onClick={() => handleDeleteSubtask(subtask)}
                        style={{ width: '1.5rem', height: '1.5rem' }}
                        tooltip="Eliminar subtarea"
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  </div>
                  {subtask.description && (
                    <p style={{
                      margin: '0.25rem 0 0',
                      color: subtask.is_completed ? '#334155' : '#64748b',
                      fontSize: '0.825rem',
                      lineHeight: 1.4,
                    }}>
                      {subtask.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            {totalSubtasks > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1.5rem',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #1e293b',
              }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Horas estimadas (subtareas):
                  <strong style={{ color: '#94a3b8', marginLeft: '4px' }}>{totalEstimatedHours.toFixed(1)}h</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <AIDecomposer
        visible={aiDialogVisible}
        taskTitle={task.title}
        taskDescription={task.description}
        projectId={projectId}
        taskId={taskId}
        onHide={() => setAiDialogVisible(false)}
        onSave={fetchTask}
      />

      <TaskFormDialog
        visible={editDialogVisible}
        task={task}
        projectId={projectId}
        onHide={() => setEditDialogVisible(false)}
        onSave={() => { setEditDialogVisible(false); fetchTask(); }}
      />
    </div>
  );
};

export default TaskDetailPage;
