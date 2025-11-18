'use client';

import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDatePickerProps extends Omit<ReactDatePickerProps, 'className'> {
  className?: string;
}

export default function CustomDatePicker({
  className = '',
  ...props
}: CustomDatePickerProps) {
  return (
    <div className="custom-datepicker-wrapper">
      <DatePicker
        {...props}
        className={className}
        calendarClassName="custom-datepicker-calendar"
        popperClassName="custom-datepicker-popper"
        portalId="datepicker-portal"
      />
    </div>
  );
}

