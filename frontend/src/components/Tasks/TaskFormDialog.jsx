import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import * as tasksApi from '../../api/tasks';

const priorityOptions = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
];

const statusOptions = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'En Progreso', value: 'en_progreso' },
  { label: 'Testing', value: 'testing' },
  { label: 'Terminada', value: 'terminada' },
];

const TaskFormDialog = ({ visible, task, projectId, defaultStatus = 'backlog', onHide, onSave }) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'backlog',
    estimated_hours: 0,
  });

  useEffect(() => {
    if (visible) {
      if (task) {
        setForm({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'media',
          status: task.status || 'backlog',
          estimated_hours: parseFloat(task.estimated_hours) || 0,
        });
      } else {
        setForm({ title: '', description: '', priority: 'media', status: defaultStatus, estimated_hours: 0 });
      }
    }
  }, [visible, task, defaultStatus]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'El título de la tarea es requerido' });
      return;
    }

    setLoading(true);
    try {
      if (task) {
        await tasksApi.updateTask(projectId, task.id, form);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tarea actualizada correctamente' });
      } else {
        await tasksApi.createTask(projectId, form);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Tarea creada correctamente' });
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
        label={task ? 'Actualizar' : 'Crear tarea'}
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
            <i className="pi pi-check-square" style={{ color: '#818cf8' }}></i>
            <span>{task ? 'Editar Tarea' : 'Nueva Tarea'}</span>
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
              Título <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <InputText
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full"
              placeholder="Ej: Implementar endpoint de autenticación"
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
              placeholder="Detalla qué hay que hacer, criterios de aceptación, notas..."
              autoResize
            />
          </div>

          <div className="grid">
            <div className="col-6">
              <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                Prioridad
              </label>
              <Dropdown
                value={form.priority}
                options={priorityOptions}
                onChange={(e) => setForm({ ...form, priority: e.value })}
                className="w-full"
              />
            </div>
            <div className="col-6">
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
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
              Estimación de horas
            </label>
            <InputNumber
              value={form.estimated_hours}
              onValueChange={(e) => setForm({ ...form, estimated_hours: e.value || 0 })}
              className="w-full"
              min={0}
              max={999}
              step={0.5}
              minFractionDigits={0}
              maxFractionDigits={1}
              suffix=" h"
              placeholder="0 h"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default TaskFormDialog;
