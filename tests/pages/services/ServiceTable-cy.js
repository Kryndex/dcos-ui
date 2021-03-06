import { SERVER_RESPONSE_DELAY } from "../../_support/constants/Timeouts";

describe("Service Table", function() {
  function openDropdown(serviceName) {
    cy
      .get(".service-table")
      .contains(serviceName)
      .closest("tr")
      .find(".dropdown")
      .click();
  }

  function clickDropdownAction(actionText) {
    cy.get(".dropdown-menu-items").contains(actionText).click();
  }

  context("Destroy Action", function() {
    beforeEach(function() {
      cy.configureCluster({
        mesos: "1-task-healthy",
        nodeHealth: true
      });
      cy.visitUrl({ url: "/services/overview" });

      openDropdown("sleep");
      clickDropdownAction("Delete");
    });

    it("disables button during API request", function() {
      cy.route({
        method: "DELETE",
        url: /marathon\/v2\/apps\/\/sleep/,
        response: []
      });
      cy
        .get(".confirm-modal .button-collection .button-danger")
        .should("have.class", "disabled");
    });
  });

  context("Resume Action", function() {
    beforeEach(function() {
      cy.configureCluster({
        mesos: "1-service-suspended",
        nodeHealth: true
      });

      cy.visitUrl({ url: "/services/overview" });
    });

    it("hides the suspend option in the service action dropdown", function() {
      openDropdown("sleep");

      cy.get(".dropdown-menu-items li").contains("Suspend").should("not.exist");
    });

    it("shows the resume option in the service action dropdown", function() {
      openDropdown("sleep");

      cy
        .get(".dropdown-menu-items li")
        .contains("Resume")
        .should("not.have.class", "hidden");
    });

    it("opens the resume dialog", function() {
      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy
        .get(".modal-header")
        .contains("Resume Service")
        .should("have.length", 1);
    });

    it("opens the resume dialog with the instances textbox if the single app instance label does not exist", function() {
      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy.get('input[name="instances"]').should("have.length", 1);
    });

    it("opens the resume dialog without the instances textbox if the single app instance label exists", function() {
      cy.configureCluster({
        mesos: "1-service-suspended-single-instance",
        nodeHealth: true
      });

      cy.visitUrl({ url: "/services/overview" });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy.get('input[name="instances"]').should("have.length", 0);
    });

    it("disables button during API request", function() {
      cy.route({
        method: "PUT",
        url: /marathon\/v2\/apps\/\/sleep/,
        response: []
      });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy
        .get(".modal-footer .button-collection .button-primary")
        .click()
        .should("have.class", "disabled");
    });

    it("closes dialog on successful API request", function() {
      cy.route({
        method: "PUT",
        url: /marathon\/v2\/apps\/\/sleep/,
        response: []
      });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy.get(".modal-footer .button-collection .button-primary").click();
      cy.get(".modal-body").should("to.have.length", 0);
    });

    it("shows error message on conflict", function() {
      cy.route({
        method: "PUT",
        status: 409,
        url: /marathon\/v2\/apps\/\/sleep/,
        response: {
          message: "App is locked by one or more deployments."
        }
      });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy.get(".modal-footer .button-collection .button-primary").click();
      cy
        .get(".modal-body .text-danger")
        .should("to.have.text", "App is locked by one or more deployments.");
    });

    it("shows error message on not authorized", function() {
      cy.route({
        method: "PUT",
        status: 403,
        url: /marathon\/v2\/apps\/\/sleep/,
        response: {
          message: "Not Authorized to perform this action!"
        }
      });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy.get(".modal-footer .button-collection .button-primary").click();
      cy
        .get(".modal-body .text-danger")
        .should("to.have.text", "Not Authorized to perform this action!");
    });

    it("reenables button after faulty request", function() {
      cy.route({
        method: "PUT",
        url: /marathon\/v2\/apps\/\/sleep/,
        response: [],
        delay: SERVER_RESPONSE_DELAY
      });

      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy
        .get(".modal-footer .button-collection .button-primary")
        .as("primaryButton")
        .click();
      cy.get("@primaryButton").should("have.class", "disabled");
      cy.get("@primaryButton").should("not.have.class", "disabled");
    });

    it("closes dialog on secondary button click", function() {
      openDropdown("sleep");
      clickDropdownAction("Resume");

      cy
        .get(".modal-footer .button-collection .button")
        .contains("Cancel")
        .click();
      cy.get(".modal-body").should("to.have.length", 0);
    });
  });

  context("SDK Services", function() {
    beforeEach(function() {
      cy.configureCluster({
        mesos: "1-sdk-service",
        nodeHealth: true
      });

      cy.visitUrl({ url: "/services/overview/%2Fservices" });
    });

    it("opens the destroy dialog", function() {
      openDropdown("sdk-sleep");
      clickDropdownAction("Delete");

      cy
        .get(".modal-header")
        .contains("Delete Service")
        .should("to.have.length", 1);

      cy.get(".modal-body p").contains("sdk-sleep");
      cy.get(".modal .filter-input-text").should("exist");

      cy.get(".modal button").contains("Cancel").click();

      cy.get(".modal").should("not.exist");
    });

    it("opens the scale dialog", function() {
      openDropdown("sdk-sleep");
      clickDropdownAction("Scale");

      cy
        .get(".modal-header")
        .contains("Scale Service")
        .should("to.have.length", 1);

      cy
        .get(".modal pre")
        .contains(
          "dcos test --name=/services/sdk-sleep update start --options=options.json"
        );

      cy.get(".modal button").contains("Close").click();

      cy.get(".modal").should("not.exist");
    });

    it("restart should not exist", function() {
      openDropdown("sdk-sleep");

      cy.get(".dropdown-menu-items").contains("restart").should("not.exist");
    });

    it("suspend should not exist", function() {
      openDropdown("sdk-sleep");

      cy.get(".dropdown-menu-items").contains("suspend").should("not.exist");
    });
  });

  context("SDK Groups", function() {
    beforeEach(function() {
      cy.configureCluster({
        mesos: "1-sdk-service",
        nodeHealth: true
      });

      cy.visitUrl({ url: "/services/overview" });
    });

    it("opens the cannot delete group dialog", function() {
      openDropdown("services");
      clickDropdownAction("Delete");

      cy
        .get(".modal-header")
        .contains("Delete Group")
        .should("to.have.length", 1);

      cy
        .get(".modal-body")
        .contains(
          "This group needs to be empty to delete it. Please delete any services in the group first."
        );
      cy.get(".modal .filter-input-text").should("not.exist");

      cy.get(".modal button").contains("OK").click();

      cy.get(".modal").should("not.exist");
    });

    it("opens the scale dialog", function() {
      openDropdown("services");
      clickDropdownAction("Scale");

      cy
        .get(".modal-header")
        .contains("Scale Group")
        .should("to.have.length", 1);

      cy
        .get(".modal pre")
        .contains(
          "dcos test --name=/services/sdk-sleep update start --options=options.json"
        );

      cy
        .get(".modal pre")
        .contains("dcos marathon app update /services/sleep options.json");

      cy.get(".modal button").contains("Close").click();

      cy.get(".modal").should("not.exist");
    });
  });
});
