/**
 * Light pivot table global object.
 *
 * @param {object} configuration
 * @constructor
 */
var LightPivotTable = function (configuration) {

    var _ = this;

    if (typeof configuration !== "object") configuration = {};
    this.normalizeConfiguration(configuration);

    this._dataSourcesStack = [];

    this.DRILL_LEVEL = -1;
    this.CONFIG = configuration;
    this.VERSION = "".concat(/*{{replace:version}}*/) || "[NotBuilt]";

    /**
     * @see this.init
     * @type {object}
     */
    this.CONTROLS = {};

    this.mdxParser = new MDXParser();

    /**
     * @type {PivotView}
     */
    this.pivotView = new PivotView(this, configuration.container);
    this.dataSource = this.pushDataSource(configuration.dataSource);

    /**
     * @type {DataController}
     */
    this.dataController = new DataController(this, function () {
        _.dataIsChanged.call(_);
    });

    this.init();

};

/**
 * Load data again from actual data source and refresh table.
 */
LightPivotTable.prototype.refresh = function () {

    var _  = this,
        i;

    if (!this.dataSource.BASIC_MDX) {
        console.log("Unable to refresh: no basic MDX set.");
        return;
    }

    this.clearFilters();
    if (this.CONFIG["defaultFilterSpecs"] instanceof Array) {
        for (i in this.CONFIG["defaultFilterSpecs"]) {
            this.setFilter(this.CONFIG["defaultFilterSpecs"][i]);
        }
    }

    this.dataSource.getCurrentData(function (data) {
        if (_.dataController.isValidData(data)) {
            _.dataController.setData(data);
        } else {
            _.pivotView.displayMessage(data.error || pivotLocale.get(2));
        }
    });

};

/**
 * @param {string} mdx - New mdx.
 */
LightPivotTable.prototype.changeBasicMDX = function (mdx) {

    // return LPT to the first level
    for (var i = this._dataSourcesStack.length - 1; i > 0; i--) {
        this.popDataSource();
        this.pivotView.popTable();
        this.dataController.popData();
    }
    // change MDX
    this.CONFIG.dataSource.basicMDX = mdx;
    this.dataSource.BASIC_MDX = mdx;
    // do refresh
    this.refresh();

};

LightPivotTable.prototype.setRowCount = function (n) {

    this.CONFIG.rowCount = n;

};

/**
 * Returns current mdx including filters.
 * @returns {string}
 * @deprecated
 */
LightPivotTable.prototype.getActualMDX = function () {

    var mdx = this.dataSource.BASIC_MDX,
        mdxParser = new MDXParser(),
        filters = this.dataSource.FILTERS;

    for (var i in filters) {
        mdx = mdxParser.applyFilter(mdx, filters[i]);
    }

    if (typeof this.CONFIG.rowCount === "number") {
        mdx = mdxParser.applyRowCount(mdx, this.CONFIG.rowCount);
    }

    return mdx;

};

/**
 * Returns if current display is listing.
 */
LightPivotTable.prototype.isListing = function () {

    return (this.dataController.getData().info || {}).leftHeaderColumnsNumber === 0;

};

/**
 * Return array with selected rows indexes.
 */
LightPivotTable.prototype.getSelectedRows = function () {

    var arr = [], rows = this.pivotView.selectedRows, i;

    for (i in rows) {
        if (rows[i]) arr.push(+i);
    }

    return arr;

};

/**
 * Return array of passed rows values.
 * @param {Number[]} rows - Rows indices in the table. Index 1 points to the first row with data.
 * @returns {*[]}
 */
LightPivotTable.prototype.getRowsValues = function (rows) {
    if (typeof rows === "undefined")
        return [];
    if (!(rows instanceof Array))
        rows = [rows];
    if (rows.length === 0)
        return [];
    var d = this.dataController.getData(),
        arr = [];
    for (var i = 0; i < rows.length; i++) {
        arr.push(d.rawData[rows[i] - 1 + (d.info.topHeaderRowsNumber || 1)]);
    }
    return arr;
};

/**
 * Returns currently rendered model.
 */
LightPivotTable.prototype.getModel = function () {
    return this.dataController.getData();
};

/**
 * Performs resizing.
 */
LightPivotTable.prototype.updateSizes = function () {

    this.pivotView.updateSizes();

};

/**
 * Ability to set filter. Manual refresh is required.
 * Example: spec = "[DateOfSale].[Actual].[YearSold].&[2009]"; *.refresh();
 *
 * @param {string} spec - an MDX specification of the filter.
 */
LightPivotTable.prototype.setFilter = function (spec) {

    this.dataSource.setFilter(spec);

};

/**
 * Clear all filters that was set before.
 */
LightPivotTable.prototype.clearFilters = function () {

    this.dataSource.clearFilters();

};

/**
 * @param {object} config - part of dataSource configuration. Usually a part of config given to LPT.
 * @returns {DataSource}
 */
LightPivotTable.prototype.pushDataSource = function (config) {

    var newDataSource;

    this.DRILL_LEVEL++;
    this._dataSourcesStack.push(
        newDataSource = new DataSource(config || {}, this.CONFIG, this, this.DRILL_LEVEL)
    );
    this.dataSource = newDataSource;

    return newDataSource;

};

/**
 * @param {boolean} [popData = true] - Also pop data in dataSource.
 */
LightPivotTable.prototype.popDataSource = function (popData) {

    if (this._dataSourcesStack.length < 2) return;

    this.DRILL_LEVEL--;
    this._dataSourcesStack.pop();
    if (!popData) this.dataController.popData();

    this.dataSource = this._dataSourcesStack[this._dataSourcesStack.length - 1];

};

/**
 * Data change handler.
 */
LightPivotTable.prototype.dataIsChanged = function () {

    this.pivotView.dataChanged(this.dataController.getData());

};

/**
 * Try to DrillDown with given filter.
 *
 * @param {string} filter
 */
LightPivotTable.prototype.tryDrillDown = function (filter) {

    var _ = this,
        oldDataSource,
        ds = {};

    // clone dataSource config object
    for (var i in _.CONFIG.dataSource) { ds[i] = _.CONFIG.dataSource[i]; }

    if (this.CONFIG.DrillDownExpression && !(this.CONFIG.DrillDownExpression instanceof Array)) {
        this.CONFIG.DrillDownExpression = [this.CONFIG.DrillDownExpression];
    }

    if ((this.CONFIG.DrillDownExpression || [])[this.DRILL_LEVEL]) {
        ds.basicMDX = this.mdxParser.drillDown(
            this.dataSource.BASIC_MDX, filter, this.CONFIG.DrillDownExpression[this.DRILL_LEVEL]
        ) || this.dataSource.BASIC_MDX;
    } else {
        ds.basicMDX = this.mdxParser.drillDown(this.dataSource.BASIC_MDX, filter) || this.dataSource.BASIC_MDX;
    }

    oldDataSource = this.dataSource;

    this.pushDataSource(ds);

    this.dataSource.FILTERS = oldDataSource.FILTERS;

    this.dataSource.getCurrentData(function (data) {
        if (_.dataController.isValidData(data)
            && data.dataArray.length > 0
            && data.dimensions[1]
            && data.dimensions[1][0]
            && (data.dimensions[1][0]["caption"]
                || data.dimensions[1][0]["dimension"]
                || data.dimensions[1][0]["path"])) {
            _.pivotView.pushTable();
            _.dataController.pushData();
            _.dataController.setData(data);
            if (typeof _.CONFIG.triggers["drillDown"] === "function") {
                _.CONFIG.triggers["drillDown"].call(_, {
                    level: _.DRILL_LEVEL,
                    mdx: ds.basicMDX,
                    path: data.dimensions[1][0]["path"] || ""
                });
            }
        } else {
            _.popDataSource(true);
        }
    });

};

/**
 * Try to DrillThrough with given filters.
 *
 * @param {string[]} [filters]
 */
LightPivotTable.prototype.tryDrillThrough = function (filters) {

    var _ = this,
        oldDataSource,
        ds = {};

    // clone dataSource config object
    for (var i in _.CONFIG.dataSource) { ds[i] = _.CONFIG.dataSource[i]; }

    // get custom listing
    const customListing = this.CONFIG.controls?.find(c => c.action === 'showListing')?.targetProperty;

    ds.basicMDX = this.mdxParser.drillThrough(this.dataSource.BASIC_MDX, filters, customListing)
        || this.dataSource.basicMDX;

    oldDataSource = this.dataSource;
    this.pushDataSource(ds);
    this.dataSource.FILTERS = oldDataSource.FILTERS;

    this.dataSource.getCurrentData(function (data) {
        if (_.dataController.isValidData(data) && data.dataArray.length > 0) {
            _.pivotView.pushTable({
                disableConditionalFormatting: true
            });
            _.dataController.pushData();
            _.dataController.setData(data);
            if (typeof _.CONFIG.triggers["drillThrough"] === "function") {
                _.CONFIG.triggers["drillThrough"].call(_, {
                    level: _.DRILL_LEVEL,
                    mdx: ds.basicMDX
                });
            }
        } else {
            _.popDataSource(true);
        }
    });

};

/**
 * Crash-safe function to get properties of pivot.
 *
 * @param {string[]} path
 * @returns {*|undefined}
 */
LightPivotTable.prototype.getPivotProperty = function (path) {
    if (!this.CONFIG["pivotProperties"]) return undefined;
    if (!(path instanceof Array)) path = [];
    var obj = this.CONFIG["pivotProperties"]; path = path.reverse();
    while (path.length
           && typeof obj !== "undefined") {
        obj = obj[path.pop()];
    }
    return obj;
};

/**
 * Attaches the trigger during the runtime.
 * @param {string} triggerName
 * @param {function} trigger
 */
LightPivotTable.prototype.attachTrigger = function (triggerName, trigger) {
    if (typeof trigger !== "function") {
        console.warn("LPT.addTrigger: pass the trigger as a second argument.");
        return;
    }
    this.CONFIG.triggers[triggerName] = trigger;
};

/**
 * Fill up to normal config structure to avoid additional checks and issues.
 *
 * @param config
 */
LightPivotTable.prototype.normalizeConfiguration = function (config) {
    if (typeof config["columnResizing"] === "undefined") config.columnResizing = true;
    if (typeof config["pagination"] === "undefined") config.pagination = 200;
    if (typeof config["enableSearch"] === "undefined") config.enableSearch = true;
    if (typeof config["stretchColumns"] === "undefined") config.stretchColumns = true;
    if (typeof config["enableListingSelect"] === "undefined") config.enableListingSelect = true;
    if (typeof config["showListingRowsNumber"] === "undefined")
        config.showListingRowsNumber = true;
    if (!config["triggers"]) config.triggers = {};
    if (!config["dataSource"]) config.dataSource = {};
};

LightPivotTable.prototype.init = function () {

    var _ = this;

    this.CONTROLS.drillThrough = function () {
        _.pivotView._drillThroughClickHandler.call(_.pivotView);
    };

    this.CONTROLS.customDrillThrough = function (filters) {
        if (!(filters instanceof Array)) {
            console.error("Parameter \"filters\" must be array of strings.");
            return;
        }
        _.tryDrillThrough.call(_, filters);
    };

    this.CONTROLS.back = function () {
        _.pivotView._backClickHandler.call(_.pivotView);
    };

    if (this.CONFIG["locale"]) { pivotLocale.setLocale(this.CONFIG["locale"]); }

    this.refresh();

};
