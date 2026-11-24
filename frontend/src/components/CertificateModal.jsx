import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../utils/categories';
import { getTodayISO } from '../utils/formatDate';
import { MAX_DESCRIPTION_LENGTH, validateCertificateForm } from '../utils/validators';
import { FileDropzone } from './FileDropzone';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Input, Textarea } from './ui/Input';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';

const INITIAL_VALUES = {
  title: '',
  issuer: '',
  category: 'Courses',
  issueDate: '',
  verificationUrl: '',
  description: '',
  isFavorite: false,
};

export function CertificateModal({
  open,
  certificate = null,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(certificate);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [selectedFile, setSelectedFile] = useState(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (certificate) {
      setValues({
        title: certificate.title || '',
        issuer: certificate.issuer || '',
        category: certificate.category || 'Other',
        issueDate: certificate.issueDate || '',
        verificationUrl: certificate.verificationUrl || '',
        description: certificate.description || '',
        isFavorite: Boolean(certificate.isFavorite),
      });
    } else {
      setValues(INITIAL_VALUES);
    }
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setErrors({});
    setSubmitError('');
    setUploadProgress(0);
    setSubmitting(false);
    setDiscardDialogOpen(false);
  }, [open, certificate]);

  const isDirty = useMemo(() => {
    if (!open) return false;
    if (selectedFile || removeExistingFile) return true;
    if (certificate) {
      return (
        values.title !== (certificate.title || '') ||
        values.issuer !== (certificate.issuer || '') ||
        values.category !== (certificate.category || 'Other') ||
        values.issueDate !== (certificate.issueDate || '') ||
        values.verificationUrl !== (certificate.verificationUrl || '') ||
        values.description !== (certificate.description || '') ||
        values.isFavorite !== Boolean(certificate.isFavorite)
      );
    }
    return Boolean(
      values.title.trim() ||
        values.issuer.trim() ||
        values.issueDate ||
        values.verificationUrl.trim() ||
        values.description.trim()
    );
  }, [open, values, selectedFile, removeExistingFile, certificate]);

  const handleRequestClose = () => {
    if (submitting) return;
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };

  const handleFieldChange = (field, nextVal) => {
    setValues((prev) => ({ ...prev, [field]: nextVal }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateCertificateForm(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setUploadProgress(10);

    try {
      await onSave(
        {
          ...values,
          removeExistingFile,
        },
        selectedFile,
        (pct) => setUploadProgress(pct),
        certificate?.id
      );
      onClose();
    } catch (err) {
      setSubmitError(err?.message || 'Unable to save certificate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const existingFile = !removeExistingFile && !selectedFile ? certificate?.file : null;
  const categoryOptions = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

  return (
    <>
      <Modal
        open={open}
        onClose={handleRequestClose}
        title={isEditing ? 'Edit Certificate' : 'Add Certificate'}
        subtitle={
          isEditing
            ? 'Update credential details or manage the attached file.'
            : 'Save a link only, an uploaded file only, or both together.'
        }
        size="lg"
        mobileSheet
        footer={
          <>
            <Button variant="secondary" onClick={handleRequestClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="certificate-form"
              variant="primary"
              loading={submitting}
            >
              {isEditing ? 'Save changes' : 'Save certificate'}
            </Button>
          </>
        }
      >
        <form id="certificate-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <div
              role="alert"
              className="rounded-control bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-semantic-danger"
            >
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Certificate title"
              required
              placeholder="e.g. AWS Solutions Architect Associate"
              value={values.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              error={errors.title}
            />
            <Input
              label="Issuing organization"
              placeholder="Optional (e.g. Coursera, Google)"
              value={values.issuer}
              onChange={(e) => handleFieldChange('issuer', e.target.value)}
              error={errors.issuer}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={values.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              options={categoryOptions}
              error={errors.category}
            />
            <Input
              label="Issue date"
              type="date"
              max={getTodayISO()}
              value={values.issueDate}
              onChange={(e) => handleFieldChange('issueDate', e.target.value)}
              error={errors.issueDate}
            />
          </div>

          <Input
            label="Original certificate URL"
            type="url"
            placeholder="https://coursera.org/verify/..."
            hint="Optional — save a link, a file below, or both."
            value={values.verificationUrl}
            onChange={(e) => handleFieldChange('verificationUrl', e.target.value)}
            error={errors.verificationUrl}
          />

          <Textarea
            label="Description"
            rows={3}
            maxLength={MAX_DESCRIPTION_LENGTH}
            counter={`${values.description.length}/${MAX_DESCRIPTION_LENGTH}`}
            placeholder="Optional notes, skills covered, or credential ID..."
            value={values.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            error={errors.description}
          />

          <div>
            <span className="block text-sm font-medium text-ink-primary mb-1.5">
              Certificate file
            </span>
            <FileDropzone
              file={selectedFile}
              existingFile={existingFile}
              onFileSelect={(nextFile) => {
                setSelectedFile(nextFile);
                setRemoveExistingFile(false);
              }}
              onRemoveFile={() => {
                if (selectedFile) {
                  setSelectedFile(null);
                } else if (existingFile) {
                  setRemoveExistingFile(true);
                }
              }}
              uploading={submitting && Boolean(selectedFile)}
              uploadProgress={uploadProgress}
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={values.isFavorite}
              onChange={(e) => handleFieldChange('isFavorite', e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-blue focus:ring-brand-blue"
            />
            <span className="text-sm text-ink-primary font-medium">Mark as favorite</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={() => {
          setDiscardDialogOpen(false);
          onClose();
        }}
        title="Discard unsaved changes?"
        message="You have unsaved edits in this form. Closing now will discard your changes."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="warning"
      />
    </>
  );
}
