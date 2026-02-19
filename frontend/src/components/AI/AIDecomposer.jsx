import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Divider } from 'primereact/divider';
import * as aiApi from '../../api/ai';
import * as subtasksApi from '../../api/subtasks';

const priorityOptions = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
];

const priorityConfig = {
  alta: { label: 'Alta', severity: 'danger' },
  media: { label: 'Media', severity: 'warning' },
  baja: { label: 'Baja', severity: 'success' },
};

const AIDecomposer = ({ visible, taskTitle, taskDescription, projectId, taskId, onHide, onSave }) => {
  const toast = useRef(null);
  const [step, setStep] = useState('input');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subtasks, setSubtasks] = useState([]);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Describe la funcionalidad a descomponer' });
      return;
    }

    setLoading(true);
    try {
      const context = [taskTitle, taskDescription].filter(Boolean).join('. ');
      const result = await aiApi.decomposeTask(description, context);
      setSubtasks(result.subtasks.map((s, i) => ({ ...s, _key: `new-${Date.now()}-${i}` })));
      setStep('review');
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error de IA', detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubtaskChange = (index, field, value) => {
    setSubtasks(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSubtask = () => {
    setSubtasks(prev => [...prev, {
      _key: `new-${Date.now()}`,
      title: '',
      description: '',
      priority: 'media',
      estimated_hours: 1,
    }]);
  };

  const handleSave = async () => {
    const invalid = subtasks.find(s => !s.title.trim());
    if (invalid) {
      toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Todas las subtareas deben tener un título' });
      return;
    }
    if (subtasks.length === 0) {
      toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Agrega al menos una subtarea' });
      return;
    }

    setSaving(true);
    try {
      await subtasksApi.createBulkSubtasks(projectId, taskId, subtasks);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `${subtasks.length} subtarea${subtasks.length !== 1 ? 's' : ''} guardada${subtasks.length !== 1 ? 's' : ''}`,
      });
      handleClose();
      onSave();
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setDescription('');
    setSubtasks([]);
    onHide();
  };

  const totalHours = subtasks.reduce((acc, s) => acc + (parseFloat(s.estimated_hours) || 0), 0);

  const footer = step === 'input' ? (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" text onClick={handleClose} disabled={loading} />
      <Button
        label="Analizar con IA"
        icon="pi pi-sparkles"
        onClick={handleAnalyze}
        loading={loading}
        disabled={!description.trim()}
      />
    </div>
  ) : (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
          <i className="pi pi-list" style={{ marginRight: '4px' }}></i>
          {subtasks.length} subtarea{subtasks.length !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
          <i className="pi pi-clock" style={{ marginRight: '4px' }}></i>
          {totalHours.toFixed(1)}h estimadas
        </span>
      </div>
      <div className="flex gap-2">
        <Button label="Volver" icon="pi pi-arrow-left" text onClick={() => setStep('input')} disabled={saving} />
        <Button label="+ Subtarea" severity="secondary" size="small" onClick={handleAddSubtask} disabled={saving} />
        <Button
          label={`Guardar ${subtasks.length} subtarea${subtasks.length !== 1 ? 's' : ''}`}
          icon="pi pi-save"
          onClick={handleSave}
          loading={saving}
          disabled={subtasks.length === 0}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-sparkles" style={{ color: '#818cf8' }}></i>
            <span>Descomposición con IA</span>
            {step === 'review' && (
              <Tag value={`${subtasks.length} subtareas`} severity="info" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }} />
            )}
          </div>
        }
        visible={visible}
        style={{ width: '720px', maxWidth: '95vw' }}
        onHide={handleClose}
        footer={footer}
        modal
        draggable={false}
        resizable={false}
        maximizable
      >
        {step === 'input' ? (
          <div className="flex flex-column gap-4 pt-2">
            {/* Info box */}
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              padding: '0.875rem 1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}>
              <i className="pi pi-info-circle" style={{ color: '#60a5fa', fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}></i>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Describe en lenguaje natural la funcionalidad o tarea compleja. La IA la descompondrá en subtareas con estimaciones de tiempo y prioridades sugeridas.
              </p>
            </div>

            {/* Task context */}
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>
                Tarea actual
              </label>
              <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.9rem' }}>{taskTitle}</span>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* Description input */}
            <div>
              <label className="block mb-2" style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                Describe la funcionalidad a descomponer <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <InputTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
                rows={7}
                placeholder="Ej: Implementar un sistema completo de autenticación con JWT que incluya registro de usuarios, login, logout, refresh de tokens, recuperación de contraseña por email, y protección de rutas tanto en el backend (Express.js) como en el frontend (React). Debe incluir validaciones, manejo de errores y tests unitarios..."
                autoResize
              />
            </div>

            {loading && (
              <div>
                <p style={{ color: '#818cf8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }}></i>
                  Analizando y generando subtareas...
                </p>
                <ProgressBar mode="indeterminate" style={{ height: '4px' }} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-column gap-3 pt-2">
            {/* Summary */}
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
            }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                La IA sugirió <strong style={{ color: '#818cf8' }}>{subtasks.length} subtareas</strong>.
                Puedes editar títulos, descripciones, prioridades y estimaciones. Agrega o elimina subtareas antes de guardar.
              </p>
            </div>

            {/* Subtask list */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}
            >
              {subtasks.map((subtask, index) => (
                <div
                  key={subtask._key}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  {/* Subtask header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      SUBTAREA {index + 1}
                    </span>
                    <Button
                      icon="pi pi-trash"
                      size="small"
                      text
                      rounded
                      severity="danger"
                      onClick={() => handleRemoveSubtask(index)}
                      style={{ width: '1.5rem', height: '1.5rem' }}
                      tooltip="Eliminar subtarea"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>

                  <div className="flex flex-column gap-2">
                    {/* Title */}
                    <InputText
                      value={subtask.title}
                      onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                      className="w-full"
                      placeholder="Título de la subtarea"
                    />

                    {/* Description */}
                    <InputTextarea
                      value={subtask.description || ''}
                      onChange={(e) => handleSubtaskChange(index, 'description', e.target.value)}
                      className="w-full"
                      rows={2}
                      placeholder="Descripción (opcional)"
                      autoResize
                    />

                    {/* Priority and hours */}
                    <div className="grid">
                      <div className="col-6">
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>
                          Prioridad
                        </label>
                        <Dropdown
                          value={subtask.priority}
                          options={priorityOptions}
                          onChange={(e) => handleSubtaskChange(index, 'priority', e.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>
                          Horas estimadas
                        </label>
                        <InputNumber
                          value={subtask.estimated_hours}
                          onValueChange={(e) => handleSubtaskChange(index, 'estimated_hours', e.value || 0)}
                          className="w-full"
                          min={0}
                          max={999}
                          step={0.5}
                          minFractionDigits={0}
                          maxFractionDigits={1}
                          suffix=" h"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {subtasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>
                  <i className="pi pi-list" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                  <p style={{ margin: 0 }}>No hay subtareas. Agrega una manualmente.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default AIDecomposer;
