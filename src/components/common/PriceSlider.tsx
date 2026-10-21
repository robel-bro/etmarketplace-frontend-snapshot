import { Range } from 'react-range';

interface PriceSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (values: [number, number]) => void;
  // any other props (e.g., className, etc.) will be spread
}

const PriceSlider = ({ min, max, value, onChange, ...props }: PriceSliderProps) => {
  // Extract key if present to avoid spreading it into the root element
  const { key, ...rest } = props;

  // Ensure min is less than max
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);

  // Ensure value array is valid
  const safeValue: [number, number] = [
    Math.min(Math.max(value[0], safeMin), safeMax),
    Math.min(Math.max(value[1], safeMin), safeMax),
  ];

  return (
    <Range
      step={10}
      min={safeMin}
      max={safeMax}
      values={safeValue}
      onChange={onChange}
      renderTrack={({ props, children }) => (
        <div
          {...props}
          style={{
            ...props.style,
            height: '4px',
            width: '100%',
            backgroundColor: '#e5e7eb',
          }}
        >
          {children}
        </div>
      )}
      renderThumb={({ props }) => (
        <div
          {...props}
          style={{
            ...props.style,
            height: '16px',
            width: '16px',
            backgroundColor: '#0284c7',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      )}
      {...rest}
    />
  );
};

export default PriceSlider;