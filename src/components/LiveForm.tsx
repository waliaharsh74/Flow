import { FileElement, FormElement, FormSchema, FormValues, RadioElement } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { workFlowApi } from "@/utils/api";
import { useParams } from "react-router";
import { Button } from "../components/ui/button";



const LiveForm: React.FC = () => {
    const [values, setValues] = useState<FormValues>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [msg, setMsg] = useState('');
    const [submittedValues, setSubmittedValues] = useState<FormValues | null>(null);
    const { workflowId } = useParams();

    const isRadioElement = (element: FormElement): element is RadioElement => element.type === 'radio';
    const isFileElement = (element: FormElement): element is FileElement => element.type === 'file';
    const generateId = (): string => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'id-' + Math.random().toString(36).substr(2, 9);
    };
    const SAMPLE_FORM: FormSchema = {
        title: "Contact Form",
        description: "Please fill out this form to get in touch with us.",
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
    const [schema, setSchema] = useState<FormSchema>()
    const fetchData = useCallback(async () => {
        const res = await workFlowApi.getForm(`${workflowId}`

        )
        if (res?.isLive) setSchema(res?.data)
        setIsLive(res?.isLive)
        setLoading(false)
        setMsg(res?.msg)

    }, [schema,workflowId])


    useEffect(() => {
        try {

            fetchData()

        } catch (error) {
            setIsLive(false)
            setLoading(false)
        }

    }, [])

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
    if (loading) return (
        <div>
            Loading...
        </div>
    )
    if (!isLive) return (
        <div>
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">

                    <h3 className="text-lg font-medium text-gray-900 mb-2">Oops!</h3>
                    <p className="text-gray-600 mb-6">{msg || "No form"}</p>
                    <Button onClick={() => window.location.href = '/'
                    }>
                        Back to Home
                    </Button>

                </div>
            </div>

        </div>
    )
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg p-8 border border-border">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{schema?.title}</h2>
                    {schema.description && (
                        <p className="text-muted-foreground">{schema?.description}</p>
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
export default LiveForm