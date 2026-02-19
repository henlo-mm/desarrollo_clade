import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import * as projectsApi from '../../api/projects';

const statusOptions = [
  { label: 'Activo', value: 'activo' },
  { label: 'Pausado', value: 'pausado' },
  { label: 'Completado', value: 'completado' },
];

const ProjectFormDialog = ({ visible, project, onHide, onSave }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    deadline: null,
    status: 'activo',
  });

  useEffect(() => {
    if (visible) {
      if (project) {
        setForm({
          name: project.name || '',
          description: project.description || '',
          deadline: project.deadline ? new Date(project.deadline + 'T00:00:00') : null,
          status: project.status || 'activo',
        });
      } else {
        setForm({ name: '', description: '', deadline: null, status: 'activo' });
      }
    }
  }, [visible, project]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'El nombre del proyecto es requerido' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? form.deadline.toISOString().split('T')[0] : null,
      };

      if (project) {
        await projectsApi.updateProject(project.id, payload);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proyecto actualizado correctamente' });
      } else {
        await projectsApi.createProject(payload);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Proyecto creado correctamente' });
      }
      onSave();
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" text onClick={onHide} disabled={loading} />
      <Button
        label={project ? 'Actualizar' : 'Crear proyecto'}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-folder" style={{ color: '#818cf8' }}></i>
            <span>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</span>
          </div>
        }
        visible={visible}
        style={{ width: '520px' }}
        onHide={onHide}
        footer={footer}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-4 pt-2">
          <div>
            <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
              Nombre <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <InputText
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full"
              placeholder="Ej: Sistema de autenticación OAuth"
              autoFocus
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
              Descripción
            </label>
            <InputTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full"
              rows={3}
              placeholder="Descripción del proyecto, objetivos, contexto..."
              autoResize
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
              Fecha límite
            </label>
            <Calendar
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.value })}
              className="w-full"
              dateFormat="dd/mm/yy"
              placeholder="Selecciona una fecha"
              showIcon
              locale="es"
              minDate={new Date()}
            />
          </div>

          {project && (
            <div>
              <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                Estado
              </label>
              <Dropdown
                value={form.status}
                options={statusOptions}
                onChange={(e) => setForm({ ...form, status: e.value })}
                className="w-full"
              />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default ProjectFormDialog;
