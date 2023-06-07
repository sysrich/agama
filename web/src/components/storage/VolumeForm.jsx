/*
 * Copyright (c) [2023] SUSE LLC
 *
 * All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of version 2 of the GNU General Public License as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, contact SUSE LLC.
 *
 * To contact SUSE LLC about this file by physical or electronic mail, you may
 * find current contact information at www.suse.com.
 */

import React, { useReducer } from "react";

import {
  InputGroup,
  Form, FormGroup, FormSelect, FormSelectOption,
  Radio,
  TextInput,
} from "@patternfly/react-core";

import { If } from '~/components/core';
import { parseSize, splitSize, SIZE_METHODS, SIZE_UNITS } from '~/components/storage/utils';

/**
 * Callback function for notifying a form input change
 *
 * @callback onChangeFn
 * @param {object} an object with the changed input and its new value
 * @return {void}
 */

/**
 * Form control for selecting a size unit
 * @component
 *
 * Based on {@link PF/FormSelect https://www.patternfly.org/v4/components/form-select}
 *
 * @param {object} props @see {@link https://www.patternfly.org/v4/components/form-select#props}
 * @returns {ReactComponent}
 */
const SizeUnitFormSelect = ({ id, value, onChange }) => {
  return (
    <FormSelect id={id} value={value} onChange={onChange}>
      { Object.values(SIZE_UNITS).map(unit => <FormSelectOption key={unit} value={unit} label={unit} />) }
    </FormSelect>
  );
};

/**
 * Widget for rendering the size option content when SIZE_UNITS.AUTO is selected
 * @component
 *
 * @param {object} props
 * @param {object} props.volume - storage volume object
 * @returns {ReactComponent}
 */
const SizeAuto = ({ volume }) => {
  const conditions = [];

  if (volume.snapshotsAffectSizes)
    conditions.push("the configuration of snapshots");

  if (volume.sizeRelevantVolumes && volume.sizeRelevantVolumes.length > 0)
    conditions.push(`the presence of the file system for ${volume.sizeRelevantVolumes.join(", ")}.`);

  const conditionsText = `The final size depends on ${conditions.join(" and ")}`;

  return (
    <>
      <p>Automatically calculated size according to the selected product. {conditionsText}</p>
    </>
  );
};

/**
 * Widget for rendering the size option content when SIZE_UNITS.MANUAL is selected
 * @component
 *
 * @param {object} props
 * @param {object} props.errors - the form errors
 * @param {object} props.formData - the form data
 * @param {onChangeFn} props.onChange - callback for notifying input changes
 *
 * @returns {ReactComponent}
 */
const SizeManual = ({ errors, formData, onChange }) => {
  return (
    <div className="stack">
      <p>
        Exact size for the file system.
      </p>
      <FormGroup
        fieldId="size"
        isRequired
        helperTextInvalid={errors.size}
        validated={errors.size && 'error'}
      >
        <InputGroup className="size-input-group">
          <TextInput
            id="size"
            key="manual-size"
            name="size"
            aria-label="Desired size"
            value={formData.size}
            onChange={(size) => onChange({ size })}
            validated={errors.size && 'error'}
          />
          <SizeUnitFormSelect onChange={(sizeUnit) => onChange({ sizeUnit })} id="sizeUnit" value={formData.sizeUnit || "GiB"} />
        </InputGroup>
      </FormGroup>
    </div>
  );
};

/**
 * Widget for rendering the size option content when SIZE_UNITS.RANGE is selected
 * @component
 *
 * @param {object} props
 * @param {object} props.errors - the form errors
 * @param {object} props.formData - the form data
 * @param {onChangeFn} props.onChange - callback for notifying input changes
 *
 * @returns {ReactComponent}
 */
const SizeRange = ({ errors, formData, onChange }) => {
  return (
    <div className="stack">
      <p>
        Limits for the file system size. The final size will be a value between the given minimum
        and maximum sizes. If no maximum is given, then the file system will be as big as possible.
      </p>
      <div className="split" data-items-alignment="start">
        <FormGroup
          isRequired
          label="Minimum"
          fieldId="minSize"
          className="size-input-group"
          validated={errors.minSize && 'error'}
          helperTextInvalid={errors.minSize}
        >
          <InputGroup>
            <TextInput
              id="minSize"
              name="minSize"
              key="range-min-size"
              aria-label="Minimum desired size"
              value={formData.minSize}
              onChange={(minSize) => onChange({ minSize })}
              validated={errors.minSize && 'error'}
            />
            <SizeUnitFormSelect onChange={(minSizeUnit) => onChange({ minSizeUnit })} id="minSizeUnit" value={formData.minSizeUnit || "GiB"} />
          </InputGroup>
        </FormGroup>
        <FormGroup
          label="Maximum"
          fieldId="maxSize"
          className="size-input-group"
          validated={errors.maxSize && 'error'}
          helperTextInvalid={errors.maxSize}
        >
          <InputGroup>
            <TextInput
              id="maxSize"
              name="maxSize"
              validated={errors.maxSize && 'error'}
              key="range-max-size"
              aria-label="Maximum desired size"
              value={formData.maxSize}
              onChange={(maxSize) => onChange({ maxSize })}

            />
            <SizeUnitFormSelect onChange={(maxSizeUnit) => onChange({ maxSizeUnit })} id="maxSizeUnit" value={formData.maxSizeUnit || formData.minSizeUnit || "GiB"} />
          </InputGroup>
        </FormGroup>
      </div>
    </div>
  );
};

/**
 * Widget for rendering the volume size options
 * @component
 *
 * @param {object} props
 * @param {object} props.errors - the form errors
 * @param {object} props.formData - the form data
 * @param {object} props.volume - the object representing the selected storage volume
 * @param {onChangeFn} props.onChange - callback for notifying input changes
 *
 * @returns {ReactComponent}
 */
const SizeOptions = ({ errors, formData, volume, onChange }) => {
  const { sizeMethod } = formData;
  const sizeWidgetProps = { errors, formData, volume, onChange };

  const sizeOptions = [SIZE_METHODS.MANUAL, SIZE_METHODS.RANGE];

  if (volume.adaptiveSizes) sizeOptions.unshift(SIZE_METHODS.AUTO);

  return (
    <div>
      <div className="split radio-group">
        { sizeOptions.map((value) => {
          const isSelected = sizeMethod === value;

          return (
            <Radio
              id={value}
              key={`size-${value}`}
              label={`${value[0].toUpperCase()}${value.slice(1)}`}
              value={value}
              name="size-option"
              className={isSelected && "selected"}
              isChecked={isSelected}
              onChange={() => onChange({ sizeMethod: value })}
            />
          );
        })}
      </div>

      <div aria-live="polite" className="highlighted-live-region">
        <If condition={sizeMethod === SIZE_METHODS.AUTO} then={<SizeAuto { ...sizeWidgetProps } />} />
        <If condition={sizeMethod === SIZE_METHODS.MANUAL} then={<SizeManual { ...sizeWidgetProps } />} />
        <If condition={sizeMethod === SIZE_METHODS.RANGE} then={<SizeRange {...sizeWidgetProps } />} />
      </div>
    </div>
  );
};

/**
 * Creates a new storage volume object based on given params
 *
 * @param {object} volume - a storage volume
 * @param {object} formData - data used to calculate the volume updates
 * @returns {object} storage volume object
 */
const createUpdatedVolume = (volume, formData) => {
  let updatedAttrs = {};
  const size = parseSize(`${formData.size} ${formData.sizeUnit}`);
  const minSize = parseSize(`${formData.minSize} ${formData.minSizeUnit}`);
  const maxSize = parseSize(`${formData.maxSize} ${formData.maxSizeUnit}`);

  switch (formData.sizeMethod) {
    case SIZE_METHODS.AUTO:
      updatedAttrs = { minSize: undefined, maxSize: undefined, fixedSizeLimits: false };
      break;
    case SIZE_METHODS.MANUAL:
      updatedAttrs = { minSize: size, maxSize: size, fixedSizeLimits: true };
      break;
    case SIZE_METHODS.RANGE:
      updatedAttrs = { minSize, maxSize: formData.maxSize ? maxSize : -1, fixedSizeLimits: true };
      break;
  }

  return { ...volume, ...updatedAttrs };
};

/**
 * Form-related helper for guessing the size method for given volume
 *
 * @param {object} volume - a storage volume object
 * @return {string} corresponding size method
 */
const sizeMethodFor = (volume) => {
  const { adaptiveSizes, fixedSizeLimits, minSize, maxSize } = volume;

  if (adaptiveSizes && !fixedSizeLimits) {
    return SIZE_METHODS.AUTO;
  } else if (minSize !== maxSize) {
    return SIZE_METHODS.RANGE;
  } else {
    return SIZE_METHODS.MANUAL;
  }
};

/**
 * Form-related helper for preparing data based on given volume
 *
 * @param {object} volume - a storage volume object
 * @return {object} an object ready to be used as a "form state"
 */
const prepareFormData = (volume) => {
  const { size: minSize, unit: minSizeUnit } = splitSize(volume.minSize);
  const { size: maxSize, unit: maxSizeUnit } = splitSize(volume.maxSize);

  return {
    size: minSize,
    sizeUnit: minSizeUnit,
    minSize, // : minSize.replace(/\.0+$/, ""),
    minSizeUnit,
    maxSize,
    maxSizeUnit,
    sizeMethod: sizeMethodFor(volume),
    mountPoint: volume.mountPoint
  };
};

/**
 * Initializer function for the React#useReducer used in the {@link VolumesForm}
 *
 * @param {object} volume - a storage volume object
 * @returns {object} a ready to use initial state
 */
const createInitialState = (volume) => {
  return {
    volume,
    formData: prepareFormData(volume),
    errors: {}
  };
};

/**
 * The VolumeForm reducer
 */
const reducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "CHANGE_VOLUME": {
      return createInitialState(payload.volume);
    }

    case "UPDATE_DATA": {
      return {
        ...state,
        formData: {
          ...state.formData,
          ...payload
        }
      };
    }

    case "SET_ERRORS": {
      return { ...state, errors: payload };
    }

    default: {
      return state;
    }
  }
};

/**
 * Form used for adding a new file system from a list of templates
 * @component
 *
 * @param {object} props
 * @param {string} props.id - Form ID
 * @param {object[]} props.templates - Volume templates
 * @param {onSubmitFn} props.onSubmit - Function to use for submitting a new volume
 *
 * @callback onSubmitFn
 * @param {object} volume
 * @return {void}
 */
export default function VolumeForm({ id, volume: currentVolume, templates = [], onSubmit }) {
  const [state, dispatch] = useReducer(reducer, currentVolume || templates[0], createInitialState);

  const changeVolume = (mountPoint) => {
    const volume = templates.find(t => t.mountPoint === mountPoint);
    dispatch({ type: "CHANGE_VOLUME", payload: { volume } });
  };

  const updateData = (data) => dispatch({ type: "UPDATE_DATA", payload: data });

  const validateVolumeSize = (sizeMethod, volume) => {
    const errors = {};
    const { minSize, maxSize } = volume;

    switch (sizeMethod) {
      case SIZE_METHODS.AUTO:
        break;
      case SIZE_METHODS.MANUAL:
        if (!minSize) {
          errors.size = "A size value is required";
        }
        break;
      case SIZE_METHODS.RANGE:
        if (!minSize) {
          errors.minSize = "Minimum size is required";
        }

        if (maxSize !== -1 && maxSize <= minSize) {
          errors.maxSize = "Maximum must be greater than minimum";
        }
        break;
    }

    return errors;
  };

  const submitForm = (e) => {
    e.preventDefault();
    const { volume: originalVolume, formData } = state;
    const volume = createUpdatedVolume(originalVolume, formData);
    const errors = validateVolumeSize(formData.sizeMethod, volume);

    if (Object.keys(errors).length) {
      dispatch({ type: "SET_ERRORS", payload: errors });
    } else {
      onSubmit(volume);
    }
  };

  const volumeOptions = () => {
    const volumes = currentVolume ? [currentVolume] : templates;

    return volumes.map((volume, index) => (
      <FormSelectOption key={index} value={volume.mountPoint} label={volume.mountPoint} />
    ));
  };

  return (
    <Form id={id} onSubmit={submitForm}>
      <FormGroup isRequired label="Mount point" fieldId="mountPoint">
        <FormSelect
          id="mountPoint"
          aria-label="mount point"
          value={state.formData.mountPoint}
          onChange={changeVolume}
          isDisabled={currentVolume !== undefined}
        >
          {volumeOptions()}
        </FormSelect>
      </FormGroup>
      <FormGroup isRequired label="File system type" fieldId="fsType">
        <TextInput
          id="fsType"
          name="fsType"
          aria-label="Fs type"
          value={state.volume.fsType}
          label="File system type"
          isDisabled
        />
      </FormGroup>
      <FormGroup fieldId="size" label="Size" isRequired>
        <SizeOptions
          key="size-options-component"
          { ...state }
          onChange={updateData}
        />
      </FormGroup>
    </Form>
  );
}
