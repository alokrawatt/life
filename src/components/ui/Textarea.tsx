import React from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Textarea({
    label,
    error,
    hint,
    className,
    ...props
}: TextareaProps) {
    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            {label && <label className={styles.label}>{label}</label>}
            <textarea
                className={`${styles.textarea} ${error ? styles.hasError : ''}`}
                {...props}
            />
            {error && <span className={styles.error}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    );
}
