/* eslint-disable no-unused-vars */
const React = require("react");
/* eslint-enable no-unused-vars */
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const Application = require("../../../structs/Application");
const ServiceConnectionEndpointList = require("../ServiceConnectionEndpointList");
const ServiceWithEndpoints = require("./fixtures/ServiceWithEndpoints.json");
const ServiceWithoutEndpoints = require("./fixtures/ServiceWithoutEndpoints.json");

describe("ServiceConnectionEndpointList", function() {
  const serviceWithEndpoints = new Application(ServiceWithEndpoints);
  const serviceWithoutEndpoints = new Application(ServiceWithoutEndpoints);

  afterEach(function() {
    ReactDOM.unmountComponentAtNode(this.container);
  });

  describe("#render", function() {
    it("renders the correct endpoints page with tables", function() {
      this.container = global.document.createElement("div");
      const instance = ReactDOM.render(
        <ServiceConnectionEndpointList service={serviceWithEndpoints} />,
        this.container
      );

      const endpointsTable = TestUtils.scryRenderedDOMComponentsWithClass(
        instance,
        "configuration-map-section"
      );

      expect(endpointsTable.length).toEqual(1);

      const endpointRows = TestUtils.scryRenderedDOMComponentsWithClass(
        instance,
        "configuration-map-row"
      );

      expect(endpointRows.length).toEqual(5);
    });
    it("renders the no endpoints area", function() {
      this.container = global.document.createElement("div");
      const instance = ReactDOM.render(
        <ServiceConnectionEndpointList service={serviceWithoutEndpoints} />,
        this.container
      );

      const noEndpoints = TestUtils.scryRenderedDOMComponentsWithClass(
        instance,
        "flush-top"
      );

      expect(noEndpoints.length).toEqual(1);
    });
  });
});
