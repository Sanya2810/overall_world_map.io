(function (React$1, ReactDOM, d3, topojson, ReactDropdown) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && ReactDOM.hasOwnProperty('default') ? ReactDOM['default'] : ReactDOM;
  ReactDropdown = ReactDropdown && ReactDropdown.hasOwnProperty('default') ? ReactDropdown['default'] : ReactDropdown;

  const jsonUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json';

  const useDataMap = () => {
    const [data, setData] = React$1.useState(null);
    console.log("Map Data: ", data);

    React$1.useEffect(() => {
      d3.json(jsonUrl).then(topology => {
        const { countries, land } = topology.objects;
        setData({
          land: topojson.feature(topology, land),
          interiors: topojson.mesh(topology, countries, (a, b) => a !== b)
        });
      });
    }, []);

    return data;
  };

  const csvUrl = 'overall_map_data_2.csv';

  const useDataRegion = () => {
    const [data, setData] = React$1.useState(null);
    console.log("Region Data: ", data);

    React$1.useEffect(() => {
      const row = d => {
        d.longitude = +d.longitude;
        d.latitude = +d.latitude;
        d.nkill = +d.nkill;
        //d.year = new Date(d.year);
        d.year = +d.year;
        return d;
      };
      d3.csv(csvUrl, row).then(setData);
    }, []);
    

    return data;
  };

  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  const Marks = ({
    mapData: { land, interiors },
    regionData,
    longitude,
    latitude,
    name,
    sizeScale,
    sizeValue,
    colorScale,
    colorValue,
    onClick,
    attack,
    target
  }) => (
    React.createElement( React.Fragment, null,
      React.createElement( 'g', { className: "marks" },
        React.createElement( 'path', { className: "sphere", d: path({ type: 'Sphere' }) }),
        React.createElement( 'path', { className: "graticules", d: path(graticule()) }),
        land.features.map(feature => (
          React.createElement( 'path', { className: "land", d: path(feature) })
        )),
        React.createElement( 'path', { className: "interiors", d: path(interiors) }),
        regionData.map(d => {
          const [x, y] = projection([longitude(d), latitude(d)]);
          const isEqualattack = attack === d.attack_type;
          const isEqualtarget= target === d.target_type;
          if ((isEqualattack || attack === 'ALL') && (isEqualtarget || target === 'ALL')) {
            return (
              React.createElement( 'g', {
                onClick: () => {
                  onClick(d);
                } },
                React.createElement( 'circle', {
                  className: "points", cx: x, cy: y, fill: colorScale(colorValue(d)), r: sizeScale(sizeValue(d)) },
                  React.createElement( 'title', null,
                    name(d), ": ", latitude(d), ", ", longitude(d)
                  )
                )
              )
            );
          }
        })
      )
    )
  );

  const ColorLegend = ({
    colorScale,
    tickSpacing,
    tickSize,
    tickTextOffset,
    onHover,
    hoveredValue,
    fadeOpacity
  }) =>
    colorScale.domain().map((domainValue, i) => (
      React.createElement( 'g', {
        className: "text", transform: `translate(0,${i * tickSpacing})`, onMouseEnter: () => {
          onHover(domainValue);
        }, onMouseOut: () => {
          onHover(null);
        }, opacity: hoveredValue && domainValue !== hoveredValue ? fadeOpacity : 1 },
        React.createElement( 'circle', { fill: colorScale(domainValue), r: tickSize }),
        React.createElement( 'text', { x: tickTextOffset, dy: ".32em" },
          domainValue
        )
      )
    ));

  const fadeOpacity = 0.25;

  const BubbleMap = ({
    regionData,
    mapData,
    setClickedValue,
    attributeattack,
    attributetarget,
    setHoveredValue,
    hoveredValue, 
    clickedValue,
    width,
    height
  }) => {
    const longitude = d => d.longitude;
    const latitude = d => d.latitude;
    const name = d => d.country;

    const sizeValue = d => d.nkill;
    const maxRadius = 20;
    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(regionData, sizeValue)])
      .range([3, maxRadius]);

    const colorValue = d => d.country;
    const colorLegendLabel = 'Country';
    const colorScale = d3.scaleOrdinal()
      .domain(regionData.map(colorValue))
      .range(["#3fa29e", "#8e8bd8", "#be8851", "#c979ae", "#f4645c", "#5ba35d", 
      "#c38476", "#7d9f1f", "#3c210f", "#d47c5a", "#e661c4", "#e265bc", "#eb5fb6", "#281b60", "#6698c2", "#3c1848", "#182842"]);


    const filteredRegionData = regionData.filter(
      d => hoveredValue === colorValue(d)
    );

    return (
      React$1__default.createElement( 'svg', { width: width, height: height },
        React$1__default.createElement( Marks, {
          mapData: mapData, regionData: filteredRegionData, longitude: longitude, latitude: latitude, name: name, sizeScale: sizeScale, sizeValue: sizeValue, colorScale: colorScale, colorValue: colorValue, onClick: setClickedValue, attack: attributeattack, target: attributetarget }),
        React$1__default.createElement( 'g', { opacity: hoveredValue ? fadeOpacity : 1 },
          React$1__default.createElement( Marks, {
            mapData: mapData, regionData: regionData, longitude: longitude, latitude: latitude, name: name, sizeScale: sizeScale, sizeValue: sizeValue, colorScale: colorScale, colorValue: colorValue, onClick: setClickedValue, attack: attributeattack, target: attributetarget })
        ),
        React$1__default.createElement( 'g', { transform: `translate(10, 40)` },
          React$1__default.createElement( 'text', { x: 20, y: -17, className: "axis-label", textAnchor: "middle" },
            colorLegendLabel
          ),
          React$1__default.createElement( ColorLegend, {
            colorScale: colorScale, tickSpacing: 13.5, tickSize: 4, tickTextOffset: 9, onHover: setHoveredValue, hoveredValue: hoveredValue, fadeOpacity: fadeOpacity })
        ),
        React$1__default.createElement( 'g', { transform: `translate(10, 40)` },
          React$1__default.createElement( 'text', { x: 1, y: 294, className: "info" },
            clickedValue ? 'Name: ' + clickedValue.country : ''
          ),
          React$1__default.createElement( 'text', { x: 1, y: 306, className: "info" },
            clickedValue ? 'Year: ' + clickedValue.year : ''
          ),
          React$1__default.createElement( 'text', { x: 1, y: 318, className: "info" },
            clickedValue ? 'Type: ' + clickedValue.attack_type : ''
          ),
          React$1__default.createElement( 'text', { x: 1, y: 330, className: "info" },
            clickedValue ? 'Magnitude: ' + clickedValue.nkill : ''
          )
        )
      )
    );
  };

  const AxisBottom = ({ yearScale, innerHeight, tickOffset = 3 }) =>
    yearScale.ticks().map(tickValue => (
      React.createElement( 'g', {
        className: "tick", key: tickValue, transform: `translate(${yearScale(tickValue)},0)` },
        React.createElement( 'line', { y2: innerHeight }),
        React.createElement( 'text', { style: { textAnchor: 'middle' }, dy: ".71em", y: innerHeight + tickOffset },
          tickValue
        )
      )
    ));

  const AxisLeft = ({ yScale, innerWidth, tickOffset = 3 }) =>
    yScale.ticks().map(tickValue => (
      React.createElement( 'g', { className: "tick", transform: `translate(0,${yScale(tickValue)})` },
        React.createElement( 'line', { x2: innerWidth }),
        React.createElement( 'text', {
          key: tickValue, style: { textAnchor: 'end' }, x: -tickOffset, dy: ".32em" },
          tickValue
        )
      )
    ));

  const Marks$1 = ({
    binnedRegionData,
    yearScale,
    yScale,
    tooltipFormat,
    innerHeight
  }) =>
    binnedRegionData.map(d => (
      React.createElement( 'rect', {
        className: "mark", x: yearScale(d.x0), y: yScale(d.nkill), width: yearScale(d.x1) - yearScale(d.x0), height: innerHeight - yScale(d.nkill) },
        React.createElement( 'title', null, tooltipFormat(d.nkill) )
      )
    ));

  const margin = { top: 10, right: 20, bottom: 70, left: 40 };
  const xAxisLabelOffset = 54;
  const yAxisLabelOffset = 30;

  const DateHistogram = ({ regionData, width, height }) => {
    const innerHeight = height - margin.top - margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    const year = d => d.year; // x Value
    const xAxisLabel = 'Year';
    const yearScale = d3.scaleLinear() // x Scale
      .domain(d3.extent(regionData, year))
      .range([0, innerWidth]);

    const [start, stop] = yearScale.domain();

    const binnedRegionData = d3.histogram()
      .value(year)
      .domain(yearScale.domain())
    	.thresholds(yearScale.ticks(stop - start))(regionData)
      .map(array => ({
        nkill: array.length,
        x0: array.x0,
        x1: array.x1
      }));
    console.log(binnedRegionData);

    const yAxisLabel = 'Number of Kills';
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(binnedRegionData, d => d.nkill)])
      .range([innerHeight, 0]);

    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'rect', { width: width, height: height, fill: 'white' }),
        React.createElement( 'g', { transform: `translate(${margin.left},${margin.top})` },
          React.createElement( AxisBottom, {
            yearScale: yearScale, innerHeight: innerHeight, tickOffset: 5 }),
          React.createElement( 'text', {
            className: "axis-label-histogram", textAnchor: "middle", transform: `translate(${-yAxisLabelOffset},${innerHeight /
            2}) rotate(-90)` },
            yAxisLabel
          ),
          React.createElement( AxisLeft, { yScale: yScale, innerWidth: innerWidth, tickOffset: 5 }),
          React.createElement( 'text', {
            className: "axis-label", x: innerWidth / 2, y: innerHeight + xAxisLabelOffset, textAnchor: "middle" },
            xAxisLabel
          ),
          React.createElement( Marks$1, {
            binnedRegionData: binnedRegionData, yearScale: yearScale, yScale: yScale, tooltipFormat: d => d, circleRadius: 2, innerHeight: innerHeight })
        )
      )
    );
  };

  const width = 960;
  const height = 500;
  const dateHistogramSize = 0.25;

  const attributesattack = [
    { value: 'ALL', label: 'All' },
    { value: 'Hostage Taking (Kidnapping)', label: 'Hostage Taking (Kidnapping)' },
    { value: 'Bombing/Explosion', label: 'Bombing/Explosion' },
    { value: 'Facility/Infrastructure Attack', label: 'Facility/Infrastructure Attack' },
    { value: 'Armed Assault', label: 'Armed Assault' },
    { value: 'Hijacking', label: 'Hijacking' },
    { value: 'Unarmed Assault', label: 'Unarmed Assault' },
    { value: 'Hostage Taking (Barricade Incident)', label: 'Hostage Taking (Barricade Incident) ' },
    { value: 'Unknown', label: 'Unknown' }
  ];

  const attributestarget = [
    { value: 'ALL', label: 'All' },
    { value: 'Private Citizens & Property', label: 'Private Citizens & Property' },
    { value: 'Government (Diplomatic)', label: 'Government (Diplomatic)' },
    { value: 'Journalists & Media', label: 'Journalists & Media' },
    { value: 'Police', label: 'Police' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Military', label: 'Military' },
    { value: 'Government (General)', label: 'Government (General)' },
    { value: 'Airports & Aircraft', label: 'Airports & Aircraft' },
    { value: 'Business', label: 'Business' },
    { value: 'Educational Institution', label: 'Educational Institution' },
    { value: 'Violent Political Party', label: 'Violent Political Party' },
    { value: 'Religious Figures/Institutions', label: 'Religious Figures/Institutions' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Tourists', label: 'Tourists' },
    { value: 'NGO', label: 'NGO' },
    { value: 'Telecommunication', label: 'Telecommunication' },
    { value: 'Food or Water Supply', label: 'Food or Water Supply' },
    { value: 'Terrorists/Non-State Militia', label: 'Terrorists/Non-State Militia' },
    { value: 'Maritime', label: 'Maritime' },
    { value: 'Abortion Related', label: 'Abortion Related' },
    { value: 'Unknown', label: 'Unknown' },
    { value: 'Other', label: 'Other' }
  ];

  const App = () => {
    const mapData = useDataMap();
    const regionData = useDataRegion();

    const [hoveredValue, setHoveredValue] = React$1.useState(null);
    const [clickedValue, setClickedValue] = React$1.useState(null);

    const initialAttributeattack = 'ALL';
    const [attributeattack, setAttributeattack] = React$1.useState(
      initialAttributeattack
    );
    console.log('Chosen: ', attributeattack);

    const initialAttributetarget = 'ALL';
    const [attributetarget, setAttributetarget] = React$1.useState(initialAttributetarget);
    console.log('Chosen: ', attributetarget);

    if (!mapData || !regionData) {
      return React$1__default.createElement( 'pre', null, "Loading..." );
    }

    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( 'div', { className: "menus-container" },
          React$1__default.createElement( 'span', { className: "dropdown-label" }, "Types of Attacks:"),
          React$1__default.createElement( ReactDropdown, {
            options: attributesattack, value: attributeattack, onChange: ({ value }) => setAttributeattack(value) }),
          React$1__default.createElement( 'span', { className: "dropdown-label" }, "Type of Targets:"),
          React$1__default.createElement( ReactDropdown, {
            options: attributestarget, value: attributetarget, onChange: ({ value }) => setAttributetarget(value) })
        ),
        React$1__default.createElement( 'svg', { width: width, height: height },
          React$1__default.createElement( BubbleMap, {
            regionData: regionData, mapData: mapData, setClickedValue: setClickedValue, attributeattack: attributeattack, attributetarget: attributetarget, setHoveredValue: setHoveredValue, hoveredValue: hoveredValue, clickedValue: clickedValue, width: width, height: height }),
          React$1__default.createElement( 'g', { transform: `translate(0, ${height - dateHistogramSize * height})` },
            React$1__default.createElement( DateHistogram, {
              regionData: regionData, width: width, height: dateHistogramSize * height })
          )
        )
      )
    );
  };
  const rootElement = document.getElementById('root');
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, d3, topojson, ReactDropdown));

