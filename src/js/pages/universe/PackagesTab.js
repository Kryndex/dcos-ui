import classNames from "classnames";
import mixin from "reactjs-mixin";
import { Hooks } from "PluginSDK";
import { Link, routerShape } from "react-router";
import { MountService } from "foundation-ui";
/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import { StoreMixin } from "mesosphere-shared-reactjs";

import AlertPanel from "../../components/AlertPanel";
import AlertPanelHeader from "../../components/AlertPanelHeader";
import Breadcrumb from "../../components/Breadcrumb";
import BreadcrumbTextContent from "../../components/BreadcrumbTextContent";
import CosmosErrorMessage from "../../components/CosmosErrorMessage";
import CosmosPackagesStore from "../../stores/CosmosPackagesStore";
import CreateServiceModalUniversePanelOption
  from "../../components/CreateServiceModalUniversePanelOption";
import defaultServiceImage
  from "../../../../plugins/services/src/img/icon-service-default-medium@2x.png";
import FilterInputText from "../../components/FilterInputText";
import Image from "../../components/Image";
import Loader from "../../components/Loader";
import Page from "../../components/Page";
import StringUtil from "../../utils/StringUtil";
import UniversePackageOption from "./UniversePackageOption";

const PackagesBreadcrumbs = () => {
  const crumbs = [
    <Breadcrumb key={0} title="Packages">
      <BreadcrumbTextContent>
        <Link to="/universe/packages">Packages</Link>
      </BreadcrumbTextContent>
    </Breadcrumb>
  ];

  return <Page.Header.Breadcrumbs iconID="packages" breadcrumbs={crumbs} />;
};

const METHODS_TO_BIND = ["handleSearchStringChange"];

const shouldRenderUniverseOption = Hooks.applyFilter(
  "hasCapability",
  true,
  "packageAPI"
);

if (shouldRenderUniverseOption) {
  MountService.MountService.registerComponent(
    CreateServiceModalUniversePanelOption,
    "CreateService:ServicePicker:GridOptions",
    0
  );
}

class PackagesTab extends mixin(StoreMixin) {
  constructor() {
    super();

    this.state = {
      errorMessage: false,
      installModalPackage: null,
      isLoading: true,
      searchString: ""
    };

    this.store_listeners = [
      {
        name: "cosmosPackages",
        events: ["availableError", "availableSuccess"],
        suppressUpdate: true
      }
    ];

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    super.componentDidMount(...arguments);
    CosmosPackagesStore.fetchAvailablePackages();
  }

  onCosmosPackagesStoreAvailableError(errorMessage) {
    this.setState({ errorMessage });
  }

  onCosmosPackagesStoreAvailableSuccess() {
    this.setState({ errorMessage: false, isLoading: false });
  }

  handleDetailOpen(cosmosPackage, event) {
    event.stopPropagation();
    this.context.router.push({
      pathname: `/universe/packages/${cosmosPackage.getName()}`,
      query: {
        version: cosmosPackage.getCurrentVersion()
      }
    });
  }

  handleSearchStringChange(searchString = "") {
    this.setState({ searchString });
  }

  getErrorScreen() {
    const { errorMessage } = this.state;

    return (
      <AlertPanel>
        <AlertPanelHeader>An Error Occurred</AlertPanelHeader>
        <CosmosErrorMessage error={errorMessage} flushBottom={true} />
      </AlertPanel>
    );
  }

  getIcon(cosmosPackage) {
    return (
      <div className="icon icon-jumbo icon-image-container icon-app-container icon-app-container--borderless icon-default-white">
        <Image
          fallbackSrc={defaultServiceImage}
          src={cosmosPackage.getIcons()["icon-medium"]}
        />
      </div>
    );
  }

  getLoadingScreen() {
    return <Loader />;
  }

  getPackageGrid(packages) {
    return packages.getItems().map((cosmosPackage, index) => {
      return (
        <UniversePackageOption
          image={this.getIcon(cosmosPackage)}
          key={index}
          label={this.getPackageOptionBadge(cosmosPackage)}
          onOptionSelect={this.handleDetailOpen.bind(this, cosmosPackage)}
        >
          <div className="h6 flush-top short">
            {cosmosPackage.getName()}
          </div>
          <small className="flush">
            {cosmosPackage.getCurrentVersion()}
          </small>
        </UniversePackageOption>
      );
    });
  }

  getPackageOptionBadge(cosmosPackage) {
    const isCertified = cosmosPackage.isCertified();
    const copy = isCertified ? "Certified" : "Community";
    const classes = classNames("badge badge-rounded", {
      "badge--primary": isCertified
    });

    return <span className={classes}>{copy}</span>;
  }

  getCertifiedPackagesGrid(packages) {
    if (this.state.searchString || packages.getItems().length === 0) {
      return null;
    }

    return (
      <div className="pod flush-top flush-horizontal clearfix">
        <h4 className="short flush-top">Certified Services</h4>
        <p className="tall flush-top">
          Certified services have been tested and are guaranteed to work with DC/OS.
        </p>
        <div className="panel-grid row">
          {this.getPackageGrid(packages)}
        </div>
      </div>
    );
  }

  getCommunityPackagesGrid(packages) {
    if (packages.getItems().length === 0) {
      return null;
    }

    let subtitle = (
      <p className="tall flush-top">
        Community services have not been tested extensively with DC/OS.
      </p>
    );
    let title = "Community Services";
    const isSearchActive = this.state.searchString !== "";
    const titleClasses = classNames("flush-top", {
      short: !isSearchActive,
      tall: isSearchActive
    });

    if (isSearchActive) {
      const foundPackagesLength = packages.getItems().length;
      const packagesWord = StringUtil.pluralize("service", foundPackagesLength);

      subtitle = null;
      title = `${packages.getItems().length} ${packagesWord} found`;
    }

    return (
      <div className="clearfix">
        <h4 className={titleClasses}>{title}</h4>
        {subtitle}
        <div className="panel-grid row">
          {this.getPackageGrid(packages)}
        </div>
      </div>
    );
  }

  render() {
    const { state } = this;
    let content;

    if (state.errorMessage) {
      content = this.getErrorScreen();
    } else if (state.isLoading) {
      content = this.getLoadingScreen();
    } else {
      const packages = CosmosPackagesStore.getAvailablePackages();
      const splitPackages = packages.getSelectedAndNonSelectedPackages();

      let communityPackages = splitPackages.nonSelectedPackages;
      const selectedPackages = splitPackages.selectedPackages;

      if (state.searchString) {
        communityPackages = packages.filterItemsByText(state.searchString);
      }

      content = (
        <div className="container">
          <div className="pod flush-horizontal flush-top">
            <FilterInputText
              className="flex-grow"
              placeholder="Search packages"
              searchString={state.searchString}
              handleFilterChange={this.handleSearchStringChange}
            />
          </div>
          {this.getCertifiedPackagesGrid(selectedPackages)}
          {this.getCommunityPackagesGrid(communityPackages)}
        </div>
      );
    }

    return (
      <Page>
        <Page.Header breadcrumbs={<PackagesBreadcrumbs />} />
        {content}
      </Page>
    );
  }
}

PackagesTab.contextTypes = {
  router: routerShape
};

PackagesTab.routeConfig = {
  label: "Packages",
  matches: /^\/universe\/packages/
};

module.exports = PackagesTab;
