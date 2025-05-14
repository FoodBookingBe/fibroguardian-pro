import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Record<string, string>; // Errors object
}

export function useForm<T extends Record<string, any>>({ 
  initialValues, 
  onSubmit, 
  validate 
}: FormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset het formulier
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Zet een specifieke veldwaarde
  const setFieldValue = useCallback((name: keyof T, value: any) => { // Use keyof T for name
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Handle input change
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type; // More robust type access
    
    let parsedValue: any = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value); // Allow empty string for optional numbers
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    // Date type is already a string, no special parsing needed here for `value`
    
    setValues(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Optional: validate on change if field has been touched
    if (touched[name] && validate) {
        const validationErrors = validate({...values, [name]: parsedValue});
        setErrors(prevErrors => ({...prevErrors, [name]: validationErrors[name]}));
    }

  }, [touched, validate, values]); // Added values to dependency array for validate on change
  
  // Markeer een veld als aangeraakt en valideer
  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    if (validate) {
      const validationErrors = validate(values); // Validate with current values
      setErrors(prevErrors => ({...prevErrors, [name]: validationErrors[name]}));
    }
  }, [validate, values]);
  
  // Handle submit
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Set submitting true at the start
    
    const allTouched = Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    let formIsValid = true;
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      formIsValid = Object.keys(validationErrors).length === 0;
    }
    
    if (formIsValid) {
      try {
        await onSubmit(values);
        // Optionally reset form on successful submit, or handle in onSubmit callback
        // resetForm(); 
      } catch (error) {
        console.error('Form submission error:', error);
        // Potentially set a global form error here
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false); // Also set to false if validation fails
    }
  }, [values, validate, onSubmit, initialValues]); // Added initialValues to dep array for allTouched
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    setErrors // Expose setErrors if manual error setting is needed
  };
}