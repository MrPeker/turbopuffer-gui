import React from 'react';
import CreatableSelect from 'react-select/creatable';
import { components } from 'react-select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseValueForFieldType } from '@/renderer/utils/filterTypeConversion';

interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectInputProps {
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
  fieldType?: string; // Field type for proper parsing of manually entered values
}

const MultiValueRemove = (props: any) => {
  return (
    <components.MultiValueRemove {...props}>
      <X className="h-3 w-3" />
    </components.MultiValueRemove>
  );
};

export const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select values...",
  disabled = false,
  className,
  allowCreate = true,
  fieldType,
}) => {
  const selectedOptions = value.map(v => ({
    value: v,
    label: String(v)
  }));

  const handleChange = (newValue: any) => {
    const values = newValue ? newValue.map((opt: Option) => {
      // If this is a newly created value (string) and we have a field type,
      // parse it to the appropriate type
      if (typeof opt.value === 'string' && fieldType && allowCreate) {
        return parseValueForFieldType(opt.value, fieldType);
      }
      return opt.value;
    }) : [];
    onChange(values);
  };

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '36px',
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring) / 0.2)' : 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      '&:hover': {
        borderColor: 'hsl(var(--muted-foreground))'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      zIndex: 9999
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'hsl(var(--accent))' 
        : state.isFocused 
        ? 'hsl(var(--accent) / 0.5)' 
        : 'transparent',
      color: 'hsl(var(--foreground))',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'hsl(var(--accent))'
      }
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--secondary))',
      borderRadius: '0.25rem',
      margin: '2px'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: 'hsl(var(--secondary-foreground))',
      fontSize: '0.75rem',
      padding: '1px 4px',
      paddingLeft: '6px'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: 'hsl(var(--secondary-foreground))',
      paddingLeft: '2px',
      paddingRight: '2px',
      '&:hover': {
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        color: 'hsl(var(--destructive))'
      }
    }),
    input: (base: any) => ({
      ...base,
      color: 'hsl(var(--foreground))'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))'
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
      padding: '4px',
      '&:hover': {
        color: 'hsl(var(--foreground))'
      }
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
      padding: '4px',
      '&:hover': {
        color: 'hsl(var(--foreground))'
      }
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '2px 8px'
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '36px'
    })
  };

  return (
    <CreatableSelect
      isMulti
      value={selectedOptions}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isDisabled={disabled}
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      styles={customStyles}
      components={{ MultiValueRemove }}
      isClearable
      isSearchable
      closeMenuOnSelect={false}
      formatCreateLabel={(inputValue: string) => `Add "${inputValue}"`}
      menuPortalTarget={document.body}
      menuPosition="fixed"
    />
  );
};