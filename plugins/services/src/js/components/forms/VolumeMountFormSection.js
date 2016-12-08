import React, {Component} from 'react';
import Objektiv from 'objektiv';

import FieldError from '../../../../../../src/js/components/form/FieldError';
import FieldInput from '../../../../../../src/js/components/form/FieldInput';
import FieldLabel from '../../../../../../src/js/components/form/FieldLabel';
import FormGroup from '../../../../../../src/js/components/form/FormGroup';
import Icon from '../../../../../../src/js/components/Icon';
import {FormReducer as volumeMounts} from '../../reducers/serviceForm/VolumeMounts';

const errorsLens = Objektiv.attr('container', {}).attr('volumes', []);

class VolumesFormSection extends Component {

  getContainerMounts(containers, volumeMountIndex) {
    const {volumeMounts} = this.props.data;

    return containers.map((container, containerIndex) => {
      return (
        <div className="flex row" key={containerIndex}>
          <FormGroup
            className="column-9"
            required={false}>
            <FieldLabel>{container.name}</FieldLabel>
            <FieldInput
              name={`volumeMounts.${volumeMountIndex}.mountPath.${containerIndex}`}
              type="text"
              value={volumeMounts[volumeMountIndex].mountPath[containerIndex]}/>
          </FormGroup>
        </div>
      );
    });
  }

  /**
   * getExternalVolumesLines
   *
   * @param  {Object} data
   * @param  {Number} offset as we have two independent sections that are 0
   *   based we need to add an offset to the second one
   * @return {Array} elements
   */
  getVolumesMountLines(data, offset) {
    const {containers} = this.props.data;
    return data.map((volumes, key) => {
      const nameError = errorsLens
        .at(key + offset, {})
        .attr('volumes', {})
        .get(this.props.errors)
        .name;

      return (
        <div key={key} className="panel pod-short">
          <div className="pod-narrow pod-short">
            <div className="flex row">
              <FormGroup
                className="column-6"
                required={false}
                showError={Boolean(nameError)}>
                <FieldLabel>Name</FieldLabel>
                <FieldInput
                  name={`volumeMounts.${key}.name`}
                  type="text"
                  value={volumes.name}/>
                <FieldError>{nameError}</FieldError>
              </FormGroup>

              <div className="form-remove">
                <a className="button button-primary-link"
                  onClick={this.props.onRemoveItem.bind(this,
                    {value: key, path: 'volumeMounts'})}>
                  <Icon id="close" color="grey" size="tiny" family="tiny"/>
                </a>
              </div>
            </div>
            {this.getContainerMounts(containers, key)}
          </div>
        </div>
      );
    });
  }

  render() {
    let {data} = this.props;

    if (data.containers && data.containers.length === 0) {
      return null;
    }

    return (
      <div className="form flush-bottom">
        <h2 className="flush-top short-bottom">
          Ephermal Volumes
        </h2>
        <p>
          Set up volumes variables for each task your service launches.
        </p>
        {this.getVolumesMountLines(data.volumeMounts, data.volumeMounts)}
        <div>
          <a
            className="button button-primary-link button-flush"
            onClick={this.props.onAddItem.bind(this,
              {value: data.volumeMounts.length, path: 'volumeMounts'})}>
            + Add Ephermal Volume
          </a>
        </div>
      </div>
    );
  }
}

VolumesFormSection.defaultProps = {
  data: {},
  errors: {},
  onAddItem() {},
  onRemoveItem() {}
};

VolumesFormSection.propTypes = {
  data: React.PropTypes.object,
  errors: React.PropTypes.object,
  onAddItem: React.PropTypes.func,
  onRemoveItem: React.PropTypes.func
};

VolumesFormSection.configReducers = {
  volumeMounts
};

module.exports = VolumesFormSection;