import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
}

export function Input({
    label,
    error,
    hint,
    icon,
    className,
    ...props
}: InputProps) {
    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <input className={`${styles.input} ${icon ? styles.withIcon : ''}`} {...props} />
            </div>
            {error && <span className={styles.error}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    );
}
