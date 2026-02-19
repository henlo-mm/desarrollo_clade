import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BreadCrumb } from 'primereact/breadcrumb';
import TaskCard from '../components/Tasks/TaskCard';
import TaskFormDialog from '../components/Tasks/TaskFormDialog';
import * as projectsApi from '../api/projects';
import * as tasksApi from '../api/tasks';

const COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: '#64748b', icon: 'pi-inbox' },
  { key: 'en_progreso', label: 'En Progreso', color: '#f59e0b', icon: 'pi-sync' },
  { key: 'testing', label: 'Testing', color: '#8b5cf6', icon: 'pi-search' },
  { key: 'terminada', label: 'Terminada', color: '#10b981', icon: 'pi-check-circle' },
];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogVisible, setTaskDialogVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('backlog');

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectData = await projectsApi.getProject(id);
      setProject(projectData);
      setTasks(projectData.tasks || []);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateTask = (status = 'backlog') => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setTaskDialogVisible(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskDialogVisible(true);
  };

  const handleDeleteTask = (task) => {
    confirmDialog({
      message: `¿Eliminar la tarea "${task.title}"? También se eliminarán sus subtareas.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await tasksApi.deleteTask(id, task.id);
          toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tarea eliminada' });
          setTasks(prev => prev.filter(t => t.id !== task.id));
        } catch (error) {
          toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
        }
      },
    });
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksApi.updateTask(id, task.id, { ...task, status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!project) return null;

  const breadcrumbItems = [
    { label: project.name },
  ];
  const breadcrumbHome = { icon: 'pi pi-home', command: () => navigate('/') };

  const isOverdue = project.deadline && new Date(project.deadline + 'T23:59:59') < new Date();
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'terminada').length;

  return (
    <div className="page-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <BreadCrumb
        model={breadcrumbItems}
        home={breadcrumbHome}
        style={{ background: 'transparent', border: 'none', padding: '0 0 1rem', marginBottom: '0.5rem' }}
      />

      {/* Project header */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>
              {project.name}
            </h1>
          </div>

          {project.description && (
            <p style={{ margin: '0 0 0.75rem', color: '#94a3b8', lineHeight: 1.5, fontSize: '0.9rem' }}>
              {project.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {project.deadline && (
              <span style={{ color: isOverdue ? '#ef4444' : '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="pi pi-calendar" style={{ fontSize: '0.8rem' }}></i>
                {new Date(project.deadline + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {isOverdue ? ' · Vencido' : ''}
              </span>
            )}
            <span style={{ color: '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="pi pi-check-circle" style={{ fontSize: '0.8rem' }}></i>
              {doneTasks}/{totalTasks} tareas completadas
            </span>
            {totalTasks > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '200px' }}>
                <div style={{ flex: 1, backgroundColor: '#334155', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: doneTasks === totalTasks && totalTasks > 0 ? '#10b981' : '#818cf8',
                    borderRadius: '4px',
                    transition: 'width 0.4s',
                  }}></div>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.8rem', minWidth: '30px' }}>
                  {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          label="Nueva Tarea"
          icon="pi pi-plus"
          onClick={() => handleCreateTask('backlog')}
        />
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '1rem',
                minHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: col.color,
                    flexShrink: 0,
                  }}></div>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{col.label}</span>
                </div>
                <span style={{
                  backgroundColor: '#334155',
                  color: '#94a3b8',
                  borderRadius: '12px',
                  padding: '1px 8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columns={COLUMNS}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                    onStatusChange={(status) => handleStatusChange(task, status)}
                    onClick={() => navigate(`/projects/${id}/tasks/${task.id}`)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#334155', flex: 1 }}>
                    <i className={`pi ${col.icon}`} style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}></i>
                    <span style={{ fontSize: '0.8rem' }}>Sin tareas</span>
                  </div>
                )}
              </div>

              {/* Add task button */}
              <Button
                label="Agregar tarea"
                icon="pi pi-plus"
                text
                size="small"
                severity="secondary"
                onClick={() => handleCreateTask(col.key)}
                style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
              />
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        visible={taskDialogVisible}
        task={selectedTask}
        projectId={id}
        defaultStatus={defaultStatus}
        onHide={() => setTaskDialogVisible(false)}
        onSave={() => { setTaskDialogVisible(false); fetchData(); }}
      />
    </div>
  );
};

export default ProjectDetailPage;
