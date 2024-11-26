import React from 'react';
import { ControlValues } from './types';

interface ControlsProps {
  values: ControlValues;
  onChange: (values: ControlValues) => void;
}

export const Controls: React.FC<ControlsProps> = ({ values, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...values,
      [name]: parseFloat(value)
    });
  };

  return (
    <div className="controls">
      <div className="control-group">
        <label>B:</label>
        <input
          type="range"
          name="brightness"
          min="-1"
          max="1"
          step="0.01"
          value={values.brightness}
          onChange={handleChange}
        />
        <span className="control-value">{values.brightness}</span>
      </div>

      <div className="control-group">
        <label>E:</label>
        <input
          type="range"
          name="exposure"
          min="0"
          max="2"
          step="0.01"
          value={values.exposure}
          onChange={handleChange}
        />
        <span className="control-value">{values.exposure}</span>
      </div>

      <div className="control-group">
        <label>G:</label>
        <input
          type="range"
          name="gamma"
          min="0.1"
          max="2"
          step="0.01"
          value={values.gamma}
          onChange={handleChange}
        />
        <span className="control-value">{values.gamma}</span>
      </div>
    </div>
  );
};