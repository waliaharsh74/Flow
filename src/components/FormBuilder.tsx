import { useWorkflowsStore } from '@/store/worflows';
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from "react-router";
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

import { Button } from './ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { FileElement, FormElement, FormSchema, FormValues, RadioElement, RadioOption } from '@/types';



const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).substr(2, 9);
};

const isRadioElement = (element: FormElement): element is RadioElement => element.type === 'radio';
const isFileElement = (element: FormElement): element is FileElement => element.type === 'file';

const createDefaultElement = (type: FormElement['type']): FormElement => {
    const base = {
        id: generateId(),
        fieldName: `New ${type} field`,
        type,
        required: false,
        placeholder: type === 'radio' || type === 'checkbox' || type === 'file' || type === 'date' ? undefined : 'Enter value...',
    };

    if (type === 'radio') {
        return {
            ...base,
            type: 'radio',
            options: [{ id: generateId(), label: 'Option 1', value: 'option1' }],
        } as RadioElement;
    }

    if (type === 'file') {
        return {
            ...base,
            type: 'file',
            multiple: false,
            accept: '',
        } as FileElement;
    }

    return base as FormElement;
};

const SAMPLE_FORM: FormSchema = {
    formTitle: "Contact Form",
    formDescription: "Please fill out this form to get in touch with us.",
    name: "form",
    elements: [
        {
            id: generateId(),
            fieldName: "Full Name",
            type: "text",
            required: true,
            placeholder: "Enter your full name",
        },
        {
            id: generateId(),
            fieldName: "Email Address",
            type: "text",
            required: true,
            placeholder: "Enter your email",
        },
        {
            id: generateId(),
            fieldName: "How did you hear about us?",
            type: "radio",
            required: true,
            options: [
                { id: generateId(), label: "Search Engine", value: "search" },
                { id: generateId(), label: "Social Media", value: "social" },
                { id: generateId(), label: "Friend Referral", value: "referral" },
            ],
        },
    ],
};

const FormBuilder: React.FC = () => {
    const [mode, setMode] = useState<'builder' | 'preview'>('builder');
    const [importText, setImportText] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [loading, setLoading] = useState(true)
    const [importError, setImportError] = useState('');
    const [searchParams] = useSearchParams();
    const isLive = searchParams.get('live');
    const navigate = useNavigate()



    const { workflows, loadWorkflow, updateWorkflow, isLoading, error, loadWorkflows, } = useWorkflowsStore()
    const { toast } = useToast()
    const hasWorkflows = useMemo(() => workflows.length > 0, [workflows])


    const { workflowId } = useParams();

    const [schema, setSchema] = useState<FormSchema>(SAMPLE_FORM);

    const fetchData = useCallback(async () => {

        const workflowData = workflows.find((w) => w.id === workflowId)
        const formData = (workflowData?.nodes?.find((n) => n.data.kind === 'trigger.form')?.data?.parameters) as FormSchema

        if (formData) {

            setSchema(formData)
        }
        else {
            setSchema(SAMPLE_FORM)
        }
        setLoading(false)
    }, [])

    const fetchWorkflows = useCallback(() => {
        loadWorkflows().then((result) => {
            if (!result.success) {
                toast({
                    title: "Error!",
                    description: result.error || "Unable to load workflows",
                    variant: "destructive",
                })
            }
        })
    }, [workflows])



    useEffect(() => {

        fetchWorkflows()
    }, [])

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (error) {
            toast({
                title: "Error!",
                description: error,
                variant: "destructive",
            })
        }
    }, [error, toast])


    const handleNewForm = useCallback(() => {
        setSchema({
            title: 'Untitled Form',
            description: '',
            elements: [],
            name: "form"
        });
        setMode('builder');
    }, []);

    const handleImport = useCallback(() => {
        try {
            const parsed = JSON.parse(importText);

            if (!parsed.formTitle || !Array.isArray(parsed.elements)) {
                throw new Error('Invalid schema: must have title and elements array');
            }

            for (const element of parsed.elements) {
                if (!element.id || !element.fieldName || !element.type) {
                    throw new Error('Invalid element: missing required fields');
                }
            }

            setSchema(parsed);
            setImportText('');
            setImportError('');
            setShowImportModal(false);
            setMode('builder');
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Invalid JSON');
        }
    }, [importText]);

    const handleSave = useCallback(async () => {
        try {
            const workflowData = loadWorkflow(workflowId);
            if (!workflowData) {
                toast({
                    title: 'Error!',
                    description: 'Workflow not found',
                    variant: 'destructive'
                });
                return;
            }
            console.log(schema)

            const updatednodes = workflowData.nodes.map((node, index) => {
                if (node.data.kind === 'trigger.form') {
                    node.data.parameters = schema
                }
                return node
            })



            const result = await updateWorkflow(workflowId, {

                nodes: updatednodes,

            });
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: 'Form saved successfully'
                });
            } else {
                toast({
                    title: 'Error!',
                    description: result.error || "Can't Save WorkFlow",
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.log(error)
            toast({
                title: 'Error!',
                description: "Can't Save WorkFlow "
            });
        }
    }, [schema])

    const exportJson = JSON.stringify(schema, null, 2);

    return (
        <div className="min-h-screen bg-background">
            {loading ? (
                <div className="text-center py-12 text-gray-600">Loading ...</div>
            ) : !hasWorkflows ? (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto">

                        <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>

                    </div>
                </div>
            ) : (
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className='flex justify-between items-center '>
                            <Button className='mb-8' variant="ghost" size="sm" onClick={() => navigate(`/${workflowId}`)}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                       

                       

                        {(<div className="mb-8 flex flex-wrap gap-3">
                            <button
                                onClick={handleNewForm}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
                            >
                                New Form
                            </button>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
                            >
                                Import Form
                            </button>
                            <button
                                onClick={() => handleSave()}
                                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
                            >
                                Save Form
                            </button>
                            <button
                                onClick={() => setMode(mode === 'builder' ? 'preview' : 'builder')}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                {mode === 'builder' ? 'Preview' : 'Edit'}
                            </button>
                        </div>)}
                    </div>



                    {mode === 'builder' ? (
                        <BuilderPanel schema={schema} setSchema={setSchema} />
                    ) : (
                        <PreviewForm schema={schema} />
                    )}

                    {showImportModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
                                <h3 className="text-lg font-semibold mb-4">Import Form Schema</h3>
                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder="Paste your JSON schema here..."
                                    className="w-full h-40 p-3 border border-input rounded-md resize-none mb-4 bg-background"
                                />
                                {importError && (
                                    <div className="text-destructive text-sm mb-4">{importError}</div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleImport}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        Import
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportText('');
                                            setImportError('');
                                        }}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showExportModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
                                <h3 className="text-lg font-semibold mb-4">Export Form Schema</h3>
                                <textarea
                                    value={exportJson}
                                    readOnly
                                    className="w-full h-40 p-3 border border-input rounded-md resize-none mb-4 bg-muted font-mono text-sm"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(exportJson)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>)}
        </div>
    );
};

const BuilderPanel: React.FC<{
    schema: FormSchema;
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>;
}> = ({ schema, setSchema }) => {
    const [selectedType, setSelectedType] = useState<FormElement['type']>('text');

    const updateSchema = (updates: Partial<FormSchema>) => {
        console.log(schema)

        setSchema(prev => ({ ...prev, ...updates }));
    };

    const addElement = () => {
        const newElement = createDefaultElement(selectedType);
        setSchema(prev => ({
            ...prev,
            elements: [...prev.elements, newElement],
        }));
    };

    const updateElement = (id: string, updates: Partial<FormElement>) => {
        setSchema(prev => ({
            ...prev,
            elements: prev.elements.map(el => {
                if (el.id !== id) return el;

                if (el.type === 'radio' && isRadioElement(el)) {
                    return { ...el, ...updates } as RadioElement;
                } else if (el.type === 'file' && isFileElement(el)) {
                    return { ...el, ...updates } as FileElement;
                } else {
                    return { ...el, ...updates } as FormElement;
                }
            }),
        }));
    };

    const deleteElement = (id: string) => {
        setSchema(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== id),
        }));
    };

    const moveElement = (id: string, direction: 'up' | 'down') => {
        setSchema(prev => {
            const elements = [...prev.elements];
            const index = elements.findIndex(el => el.id === id);
            if (index === -1) return prev;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= elements.length) return prev;

            [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
            return { ...prev, elements };
        });
    };

    const duplicateElement = (id: string) => {
        setSchema(prev => {
            const element = prev.elements.find(el => el.id === id);
            if (!element) return prev;

            let duplicate: FormElement;
            if (element.type === 'radio') {
                duplicate = {
                    ...element,
                    id: generateId(),
                    fieldName: `${element.fieldName} (Copy)`,
                    options: [...element.options],
                } as RadioElement;
            } else if (element.type === 'file') {
                duplicate = {
                    ...element,
                    id: generateId(),
                    fieldName: `${element.fieldName} (Copy)`,
                } as FileElement;
            } else {
                duplicate = {
                    ...element,
                    id: generateId(),
                    fieldName: `${element.fieldName} (Copy)`,
                } as FormElement;
            }

            const index = prev.elements.findIndex(el => el.id === id);
            const newElements = [...prev.elements];
            newElements.splice(index + 1, 0, duplicate);

            return { ...prev, elements: newElements };
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="form-title" className="block text-sm font-medium mb-2">
                                Form Title
                            </label>
                            <input
                                id="form-title"
                                type="text"
                                value={schema.formTitle}
                                onChange={(e) => updateSchema({ formTitle: e.target.value })}
                                className="w-full p-3 border border-input rounded-md bg-background"
                                placeholder="Enter form title..."
                            />
                        </div>
                        <div>
                            <label htmlFor="form-description" className="block text-sm font-medium mb-2">
                                Form Description
                            </label>
                            <textarea
                                id="form-description"
                                value={schema.formDescription || ''}
                                onChange={(e) => updateSchema({ formDescription: e.target.value })}
                                className="w-full p-3 border border-input rounded-md bg-background resize-none"
                                rows={3}
                                placeholder="Enter form description..."
                            />
                        </div>
                    </div>
                </div>

                {/* Add Element */}
                <div className="bg-card rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Add Element</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="element-type" className="block text-sm font-medium mb-2">
                                Element Type
                            </label>
                            <select
                                id="element-type"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as FormElement['type'])}
                                className="w-full p-3 border border-input rounded-md bg-background"
                            >
                                <option value="text">Text Input</option>
                                <option value="password">Password</option>
                                <option value="textarea">Textarea</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="radio">Radio Group</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="file">File Upload</option>
                            </select>
                        </div>
                        <button
                            onClick={addElement}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                        >
                            Add Element
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-card rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Form Elements ({schema?.elements.length})</h3>
                    {schema?.elements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No elements added yet. Add your first element to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schema?.elements.map((element, index) => (
                                <ElementEditor
                                    key={element.id}
                                    element={element}
                                    index={index}
                                    totalElements={schema.elements.length}
                                    onUpdate={(updates) => updateElement(element.id, updates)}
                                    onDelete={() => deleteElement(element.id)}
                                    onMove={(direction) => moveElement(element.id, direction)}
                                    onDuplicate={() => duplicateElement(element.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ElementEditor: React.FC<{
    element: FormElement;
    index: number;
    totalElements: number;
    onUpdate: (updates: Partial<FormElement>) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onDuplicate: () => void;
}> = ({ element, index, totalElements, onUpdate, onDelete, onMove, onDuplicate }) => {
    const addRadioOption = () => {
        if (isRadioElement(element)) {
            const newOption = { id: generateId(), label: `Option ${element.options.length + 1}`, value: `option${element.options.length + 1}` };
            onUpdate({ options: [...element.options, newOption] });
        }
    };

    const updateRadioOption = (optionId: string, updates: Partial<RadioOption>) => {
        if (isRadioElement(element)) {
            onUpdate({
                options: element.options.map(opt => opt.id === optionId ? { ...opt, ...updates } : opt)
            });
        }
    };

    const deleteRadioOption = (optionId: string) => {
        if (isRadioElement(element)) {
            onUpdate({
                options: element.options.filter(opt => opt.id !== optionId)
            });
        }
    };

    return (
        <div className="border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                        {element.type}
                    </span>
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onMove('up')}
                        disabled={index === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Move up"
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => onMove('down')}
                        disabled={index === totalElements - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Move down"
                    >
                        ↓
                    </button>
                    <button
                        onClick={onDuplicate}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Duplicate"
                    >
                        ⧉
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-destructive hover:text-destructive/80"
                        title="Delete"
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Field Name</label>
                    <input
                        type="text"
                        value={element.fieldName}
                        onChange={(e) => onUpdate({ fieldName: e.target.value })}
                        className="w-full p-2 border border-input rounded bg-background text-sm"
                        placeholder="Enter field name..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={element.required || false}
                            onChange={(e) => onUpdate({ required: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Required</span>
                    </label>
                </div>

                {(element.type === 'text' || element.type === 'password' || element.type === 'textarea' || element.type === 'number') && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={element.placeholder || ''}
                            onChange={(e) => onUpdate({ placeholder: e.target.value })}
                            className="w-full p-2 border border-input rounded bg-background text-sm"
                            placeholder="Enter placeholder..."
                        />
                    </div>
                )}

                {isFileElement(element) && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Accept Types</label>
                            <input
                                type="text"
                                value={element.accept || ''}
                                onChange={(e) => onUpdate({ accept: e.target.value })}
                                className="w-full p-2 border border-input rounded bg-background text-sm"
                                placeholder="e.g., image/png,.jpg"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={element.multiple || false}
                                    onChange={(e) => onUpdate({ multiple: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">Multiple files</span>
                            </label>
                        </div>
                    </>
                )}
            </div>

            {isRadioElement(element) && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Options</label>
                        <button
                            onClick={addRadioOption}
                            className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded hover:bg-accent/80"
                        >
                            Add Option
                        </button>
                    </div>
                    <div className="space-y-2">
                        {element.options.map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateRadioOption(option.id, { label: e.target.value })}
                                    className="flex-1 p-2 border border-input rounded bg-background text-sm"
                                    placeholder="Option label"
                                />
                                <input
                                    type="text"
                                    value={option.value}
                                    onChange={(e) => updateRadioOption(option.id, { value: e.target.value })}
                                    className="flex-1 p-2 border border-input rounded bg-background text-sm"
                                    placeholder="Option value"
                                />
                                <button
                                    onClick={() => deleteRadioOption(option.id)}
                                    disabled={element.options.length === 1}
                                    className="p-2 text-destructive hover:text-destructive/80 disabled:opacity-50"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const PreviewForm: React.FC<{ schema: FormSchema }> = ({ schema }) => {
    const [values, setValues] = useState<FormValues>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [submittedValues, setSubmittedValues] = useState<FormValues | null>(null);

    const setValue = (id: string, value: any) => {
        setValues(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        schema.elements.forEach(element => {
            if (element.required) {
                const value = values[element.id];
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    newErrors[element.id] = `${element.fieldName} is required`;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setSubmitted(true);
            setSubmittedValues({ ...values });
        }
    };

    const handleFileChange = (elementId: string, files: FileList | null) => {
        if (!files) {
            setValue(elementId, []);
            return;
        }

        const fileData = Array.from(files).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
        }));

        setValue(elementId, fileData);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg p-8 border border-border">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{schema.formTitle}</h2>
                    {schema.formDescription && (
                        <p className="text-muted-foreground">{schema.formDescription}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {schema.elements.map((element) => (
                        <div key={element.id}>
                            <label className="block text-sm font-medium mb-2">
                                {element.fieldName}
                                {element.required && <span className="text-destructive ml-1">*</span>}
                            </label>

                            {element.type === 'text' && (
                                <input
                                    type="text"
                                    value={values[element.id] || ''}
                                    onChange={(e) => setValue(element.id, e.target.value)}
                                    placeholder={element.placeholder}
                                    className="w-full p-3 border border-input rounded-md bg-background"
                                />
                            )}

                            {element.type === 'password' && (
                                <input
                                    type="password"
                                    value={values[element.id] || ''}
                                    onChange={(e) => setValue(element.id, e.target.value)}
                                    placeholder={element.placeholder}
                                    className="w-full p-3 border border-input rounded-md bg-background"
                                />
                            )}

                            {element.type === 'textarea' && (
                                <textarea
                                    value={values[element.id] || ''}
                                    onChange={(e) => setValue(element.id, e.target.value)}
                                    placeholder={element.placeholder}
                                    className="w-full p-3 border border-input rounded-md bg-background resize-none"
                                    rows={4}
                                />
                            )}

                            {element.type === 'number' && (
                                <input
                                    type="number"
                                    value={values[element.id] || ''}
                                    onChange={(e) => setValue(element.id, e.target.value)}
                                    placeholder={element.placeholder}
                                    className="w-full p-3 border border-input rounded-md bg-background"
                                />
                            )}

                            {element.type === 'date' && (
                                <input
                                    type="date"
                                    value={values[element.id] || ''}
                                    onChange={(e) => setValue(element.id, e.target.value)}
                                    className="w-full p-3 border border-input rounded-md bg-background"
                                />
                            )}

                            {element.type === 'radio' && isRadioElement(element) && (
                                <fieldset className="border border-input rounded-md p-4">
                                    <legend className="sr-only">{element.fieldName}</legend>
                                    <div className="space-y-2">
                                        {element.options.map((option) => (
                                            <label key={option.id} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={element.id}
                                                    value={option.value}
                                                    checked={values[element.id] === option.value}
                                                    onChange={(e) => setValue(element.id, e.target.value)}
                                                    className="text-primary"
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            )}

                            {element.type === 'checkbox' && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={values[element.id] || false}
                                        onChange={(e) => setValue(element.id, e.target.checked)}
                                        className="text-primary"
                                    />
                                    <span>Yes</span>
                                </label>
                            )}

                            {element.type === 'file' && isFileElement(element) && (
                                <input
                                    type="file"
                                    multiple={element.multiple}
                                    accept={element.accept}
                                    onChange={(e) => handleFileChange(element.id, e.target.files)}
                                    className="w-full p-3 border border-input rounded-md bg-background file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover"
                                />
                            )}

                            {errors[element.id] && (
                                <div className="text-destructive text-sm mt-1">{errors[element.id]}</div>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
                    >
                        Submit Form
                    </button>
                </form>

                {submitted && submittedValues && (
                    <div className="mt-8 p-4 bg-success/10 border border-success/20 rounded-lg">
                        <h3 className="font-semibold text-success mb-3">Form Submitted Successfully!</h3>
                        <div className="bg-background p-4 rounded border">
                            <pre className="text-sm overflow-x-auto">{JSON.stringify(submittedValues, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormBuilder;