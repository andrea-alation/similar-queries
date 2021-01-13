import React from 'react';
import ReactJson from 'react-json-view';

const MetricRow = ({metric}) => {
  return (
    <tr>
      <td><a href={metric.fullURL} target="_blank">{metric.url}</a></td>
      <td>
        <ReactJson
          src={metric}
          iconStyle='triangle'
          displayDataTypes={false}
           />
      </td>
    </tr>
  )
};

class MetricsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: ''
    };
    this.handleFilter = this.handleFilter.bind(this);
  }

  handleFilter(event) {
    this.setState({filter: event.target.value});
  }

  render() {
    const {metrics} = this.props;
    const {filter} = this.state;
    if (!metrics) return null;

    let filteredMetrics = metrics;
    if (filter.length) {
      filteredMetrics = metrics.filter((metric) => {
        return (
          metric.indexOf(filter) > -1 &&
          !(hideAjaxLoad && metric.indexOf('ajaxload.') > -1) &&
          !(hidePageLoad && metric.indexOf('pageload.') > -1)
        );
      });
    }

    return (
      <div>
        <table className='table'>
          <thead>
            <tr>
              <th>Similar Query</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.map((metric) => <MetricRow metric={metric} />)}
          </tbody>
        </table>
      </div>
    )
  }
}

export default MetricsTable;
