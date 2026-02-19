import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import ProjectFormDialog from '../components/Projects/ProjectFormDialog';
import * as projectsApi from '../api/projects';

const statusConfig = {
  activo: { label: 'Activo', severity: 'success' },
  completado: { label: 'Completado', severity: 'info' },
  pausado: { label: 'Pausado', severity: 'warning' },
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogVisible(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation();
    setSelectedProject(project);
    setDialogVisible(true);
  };

  const handleDelete = (project, e) => {
    e.stopPropagation();
    confirmDialog({
      message: `¿Eliminar el proyecto "${project.name}"? Esta acción también eliminará todas sus tareas y subtareas.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await projectsApi.deleteProject(project.id);
          toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proyecto eliminado' });
          fetchProjects();
        } catch (error) {
          toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
        }
      },
    });
  };

  const getTaskStats = (tasks = []) => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'terminada').length;
    const inProgress = tasks.filter(t => t.status === 'en_progreso').length;
    return { total, done, inProgress };
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline + 'T23:59:59') < new Date();
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.75rem', fontWeight: 700 }}>
            Proyectos
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {projects.length} proyecto{projects.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex gap-2 align-items-center">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyectos..."
              style={{ width: '220px' }}
            />
          </span>
          <Button label="Nuevo Proyecto" icon="pi pi-plus" onClick={handleCreate} />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '1rem' }}>
          <i className="pi pi-folder-open" style={{ fontSize: '4rem', color: '#334155' }}></i>
          {search ? (
            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
              No se encontraron proyectos para "{search}"
            </p>
          ) : (
            <>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                No hay proyectos todavía. Crea tu primer proyecto.
              </p>
              <Button label="Crear Proyecto" icon="pi pi-plus" onClick={handleCreate} />
            </>
          )}
        </div>
      ) : (
        <div className="grid">
          {filteredProjects.map((project) => {
            const { total, done, inProgress } = getTaskStats(project.tasks);
            const overdue = isOverdue(project.deadline);
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={project.id} className="col-12 md:col-6 lg:col-4">
                <div
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(129,140,248,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Project name and status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 600, flex: 1, lineHeight: 1.3 }}>
                      {project.name}
                    </h3>
                    <Tag
                      value={statusConfig[project.status]?.label || project.status}
                      severity={statusConfig[project.status]?.severity}
                      style={{ flexShrink: 0 }}
                    />
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p style={{
                      margin: 0,
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {project.description}
                    </p>
                  )}

                  {/* Deadline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i
                      className="pi pi-calendar"
                      style={{ color: overdue ? '#ef4444' : '#64748b', fontSize: '0.8rem' }}
                    ></i>
                    <span style={{ color: overdue ? '#ef4444' : '#64748b', fontSize: '0.825rem' }}>
                      {project.deadline
                        ? new Date(project.deadline + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Sin fecha límite'}
                      {overdue && project.deadline ? ' · Vencido' : ''}
                    </span>
                  </div>

                  {/* Progress */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          <i className="pi pi-list" style={{ marginRight: '3px', fontSize: '0.75rem' }}></i>
                          {total} tarea{total !== 1 ? 's' : ''}
                        </span>
                        {inProgress > 0 && (
                          <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                            <i className="pi pi-sync" style={{ marginRight: '3px', fontSize: '0.75rem' }}></i>
                            {inProgress} en progreso
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div style={{ backgroundColor: '#334155', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: progress === 100 ? '#10b981' : '#818cf8',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      text
                      severity="secondary"
                      onClick={(e) => handleEdit(project, e)}
                      tooltip="Editar proyecto"
                      tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                      icon="pi pi-trash"
                      size="small"
                      text
                      severity="danger"
                      onClick={(e) => handleDelete(project, e)}
                      tooltip="Eliminar proyecto"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormDialog
        visible={dialogVisible}
        project={selectedProject}
        onHide={() => setDialogVisible(false)}
        onSave={() => { setDialogVisible(false); fetchProjects(); }}
      />
    </div>
  );
};

export default ProjectsPage;
