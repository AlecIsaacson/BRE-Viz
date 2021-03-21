import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';
import dayjs from 'dayjs'

export default class StackedBarVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    /**
     * A fill color to override the default fill color. This is an example of
     * a custom chart configuration.
     */
    fill: PropTypes.string,

    /**
     * A stroke color to override the default stroke color. This is an example of
     * a custom chart configuration.
     */
    stroke: PropTypes.string,
    /**
     * An array of objects consisting of a nrql `query` and `accountId`.
     * This should be a standard prop for any NRQL based visualizations.
     */
    nrqlQueries: PropTypes.arrayOf(
      PropTypes.shape({
        accountId: PropTypes.number,
        query: PropTypes.string,
      })
    ),
  };

  // This helper transforms non-timeseries data to the format recharts bar component is expecting.
  transformData = (rawData) => {
    const transformedData = rawData.map((entry) => {
        return {
          name: entry.metadata.name,
          value: entry.data[0].y,
        }
    });
    const filteredData = transformedData.filter((data) => {
      return data.name !== 'Other'
    })
    return filteredData
  };

  // This helper transforms timeseries data to the format recharts expects.
  transformTimeseries = (rawData) => {
    return rawData.map((entry) => ({
      name: dayjs(entry.x).format('HH:mm'),
      value: entry.y,
    }));
  };

  /**
   * Format the given axis tick's numeric value into a string for display.
   */
  formatTick = (value) => {
    return value.toLocaleString();
  };

  render() {
    const {nrqlQueries, stroke, fill} = this.props;

    const nrqlQueryPropsAvailable =
      nrqlQueries &&
      nrqlQueries[0] &&
      nrqlQueries[0].accountId &&
      nrqlQueries[0].query;

    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }

    return (
      <AutoSizer>
        {({width, height}) => (
          <NrqlQuery query={nrqlQueries[0].query} accountId={parseInt(nrqlQueries[0].accountId)} pollInterval={NrqlQuery.AUTO_POLL_INTERVAL} >
            {({data, loading, error}) => {
              if (loading) {
                return <Spinner />;
              }

              if (error) {
                return <ErrorState />;
              }

              console.debug('Raw data:', data)

              // If the query contains the string timeseries, then we need to process this differently.
              if (nrqlQueries[0].query.match(/timeseries/i)) {
                console.debug('Timeseries')
                var transformedData = this.transformTimeseries(data[0].data);
              } else {
                var transformedData = this.transformData(data);
              }

              console.debug('Transformed Data:', transformedData)

              return (
                <BarChart
                  width={width}
                  height={height}
                  data={transformedData}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={ fill || '#8884d8' }/>
                </BarChart>
              );
            }}
          </NrqlQuery>
        )}
      </AutoSizer>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide at least one NRQL query & account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        An example NRQL query you can try is:
      </HeadingText>
      <code>FROM NrUsage SELECT sum(usage) FACET metric SINCE 1 week ago</code>
    </CardBody>
  </Card>
);

const ErrorState = () => (
  <Card className="ErrorState">
    <CardBody className="ErrorState-cardBody">
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Oops! Something went wrong.
      </HeadingText>
    </CardBody>
  </Card>
);
