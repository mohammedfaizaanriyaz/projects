export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>

      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MeasurementField({
  label,
  value,
  unit,
  units,
  onValue,
  onUnit,
  optional,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {optional && <small> (optional)</small>}
      </span>

      <div className="measurement-input">
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onValue(e.target.value)}
        />

        <select value={unit} onChange={(e) => onUnit(e.target.value)}>
          {units.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export function HeightField({ form, change }) {
  return (
    <label className="field">
      <span>Height</span>

      <div className="height-wrap">
        {form.heightUnit === "ft-in" ? (
          <>
            <input
              type="number"
              placeholder="ft"
              value={form.heightFeet}
              onChange={(e) => change("heightFeet", e.target.value)}
            />

            <input
              type="number"
              placeholder="in"
              value={form.heightInches}
              onChange={(e) => change("heightInches", e.target.value)}
            />
          </>
        ) : (
          <input
            type="number"
            step="0.1"
            value={form.heightValue}
            onChange={(e) => change("heightValue", e.target.value)}
          />
        )}

        <select
          value={form.heightUnit}
          onChange={(e) => change("heightUnit", e.target.value)}
        >
          <option value="cm">cm</option>

          <option value="inch">inch</option>

          <option value="ft-in">ft / in</option>
        </select>
      </div>
    </label>
  );
}

// ============================================================
// MODAL
// ============================================================
