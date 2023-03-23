Light pivot table for InterSystems Caché
====================

Lightweight, fast and featured pivot table realization for
[InterSystems Caché](http://www.intersystems.com).

## Features
<ul>
    <li>Basic functionality of standard pivot table;</li>
    <li>Additional features like pagination and quick search;</li>
    <li>Simple good looking design;</li>
    <li>Lightweight and speedy realization comparing to common DeepSee pivot table;</li>
    <li>Mobile platforms support;</li>
    <li>Easiest integration to any WEB project;</li>
    <li>And even more...</li>
</ul>

## Installation

There are several variants how to install Light pivot table.
+ Pre-requirement: install and configure [MDX2JSON](https://github.com/intersystems-ru/Cache-MDX2JSON) to your Caché instance;
+ If you want to use LPT as a DeepSee portlet, then just download latest release from [github releases](https://github.com/intersystems-ru/LightPivotTable/releases), unpack it and Simply inport XML file to Caché;
+ If you want to integrate LPT with your application, you need webModule/ directory contents that can be found in release you downloaded;
+ If you want to build most up-to-date version from sources, see the "build" section below.

## Integration

#### Javascript

Build the project, and then include <code>build/WEBModule/css/lightPivotTable.css</code> and
<code>build/WEBModule/js/lightPivotTable.js</code> files into your project. Usage is shown in
<code>build/WEBModule/index.html</code> example.

Then use global object constructed from <i>LightPivotTable</i>:
```js
var setup = { // Object that contain settings. Properties in brackets can be missed.
        container: document.getElementById("pivot") // HTMLElement which will contain table.
        [, locale: "en" ] // language to use (default: browser default or "en")
        [, logs: false ] // logging disabled by default
        , dataSource: {
            MDX2JSONSource: "http://localhost:57772/SAMPLES", // MDX2JSON server address
            basicMDX: typeof req === "object" ? req.basicMDX : req
            [ , pivot: "name of data source.pivot" ] // name of data source to apply pivot rules
            [ , namespace: "SAMPLES" ] // current namespace : default namespace
            [ , username: "USER" ] // user name : default user
            [ , password: "" ] // user password : default password
            [ , sendCookies: false ] // also send cookies with each request to server
        }
        [ , triggers: { // provide your functions here to handle certain events
             drillDown: function ({Object { level: {number}, mdx: {string} }}) {}
            , drillThrough: function ({Object { level: {number}, mdx: {string} }}) {}
            , back: function ({Object { level: {number} }}) {}
            // if cellDrillThrough callback returns boolean false, DrillThrough won't be performed.
            , cellDrillThrough: function ({Object { event: {event}, filters: {string[]}, cellData: {object} }}) {}
            , responseHandler: function ({Object {url: {string}, status: {number}}}) {}
            // triggers when row selected in listing:
            , rowSelect: function (row, rowData) { console.log("Row #", row, rowData); }
            // if rowClick callback returns boolean false, DrillDown won't be performed.
            , rowClick: function (row, rowData, cellData) { console.log(row, rowData, cellData); }
            , contentRendered: function () {}
            , cellSelected: function ({ x: Number, y: Number, leftHeaderColumnsNumber: Number, topHeaderRowsNumber: Number }) {
                return false; // return false to block default click action
            }
        } ]
        [ , stretchColumns: true ] // Stretch columns to fill available container space
        [ , pagination: 30 ] // Maximum rows number on one page (default: 200, turn off: 0)
        [ , hideButtons: true ] // hides "back" and "drillThrough" buttons
        [ , triggerEvent: "touchstart" ] // all "click" events will be replaced by this event
        [ , caption: "My table" ] // if set, table basic caption will be replaced by this text
        [ , showSummary: true ] // show summary by columns
        [ , attachTotals: true ] // display totals attached to table top header
        [ , conditionalFormattingOn: true ] // pass false to turn off conditional formatting
        [ , loadingMessageHTML: "LOADING DATA..." ] // HTML displaying during data load
        [ , enableHeadersScrolling: false ] // enable scrolling both for table and headers. Useful for mobile devices.
        [ , defaultFilterSpecs: ["[Date].[H1].[month].&[]"] ] // default filters array
        [ , drillDownTarget: "<dashboard name>" ] // deepSee only - dashboard to open
        [ , listingColumnMinWidth: 200 ] // minimal width of column in listing
        [ , maxHeaderWidth: 100 ] // maximum width of header
        [ , columnResizing: true ] // make columns resizable (default: true)
        [ , columnResizeAnimation: false ] // animate column when resizing
        [ , enableSearch: true ] // enables search panel in listing (default: true)
        [ , showRowNumbers: true ] // show the row number in first column
        [ , enableListingSelect: true ] // enable listing selection, true by default
        [ , showListingRowsNumber: true ] // show rows number in listing and tables if paginated
        [ , rowCount: 5 ] // number of rows to show. Use lp.setRowCount(N) to change rowCount. Manual lp.refresh() needed to apply.
        [ , initialData: { ... } ] // initial data from /MDX query (if present, in MDX2JSON format). Pivot won't request /MDX first time if initial data set. Check twice that dataSource.basicMDX is consistent with the data in this option.
        [ , linksTarget: "_blank" ] // the value of target attributes on all the links on light pivot
    },
    lp = new LightPivotTable(setup);
    
console.log(lp.CONTROLS); // object with functions that can be triggered to control pivot table:
/* Available controls:
 * lp.CONTROLS.drillThrough() - Perform drillThrough for current location.
 * lp.CONTROLS.customDrillThrough(["filterSpec1", ...]) - Perform drillThrough with filters.
 * lp.CONTROLS.back() - Back to the parent level.
 */

lp.setFilter("[DateOfSale].[Actual].[YearSold].&[2009]");

lp.refresh(); // refresh pivot contents
lp.updateSizes(); // recalculate pivot sizes
lp.changeBasicMDX("..."); // change mdx for LPT
var rows = lp.getRowsValues([1,2,3]); // returns the values in rows 1, 2, 3
var model = lp.getModel(); // returns data model representing currently rendered data set
lp.getSelectedRows(); // returns array with selected rows indexes. First row have index 1.
lp.attachTrigger("contentRendered", function (lptInstance) {  }); // attaches trigger during runtime
lp.setRowCount(5); // sets the number of rows to display
console.log( lp.isListing() ); // returns true if current data display is listing

// Additional calls:
lp.pivotView.getCellElement(x, y, considerHeaders); // returns cell element by given coordinates
lp.pivotView.getTableSize(considerHeaders); // returns { width: N, height: M }
```

#### Caché DeepSee

To integrate light pivot widget into DeepSee, just perform build and then import <code>
build/LightPivotTable.xml</code> into namespace you want. Make sure that MDX2JSON source is
installed and configured. Also you may need to change the widget property "MDX2JSON source" to make
it work with another MDX2JSON source.

You can obtain LPT instance from widget by calling widgetInstance.registerLPTOnCreateCallback method.
This method takes one argument - anonymous function, which will be executed when LPT instance is created.
The anonymous function takes one argument - LPT instance.

## Build

You need [NodeJS](http://nodejs.org/) platform to be installed in your system to perform any build
tasks.

To build project and see working example, gulp and it's plugins must be installed. Simple run 
<code>npm install</code> command to perform all required installations.

By running <code>npm run build</code> command later, <code>build</code> directory will appear with 
all required files there.

## Debug

Run <code>npm install</code> in the project root to
install all required modules, and then execute <code>node test/testServer</code> to run local
server. Then give the right URL and MDX as in the example in example/index.html file.

Also anytime you can build project and then check <code>build/example/index.html</code> page. 

## Preview

Run <code>npm run build</code> command and then check <code>build/WEBModule/index.html</code>.
![Light pivot table](https://cloud.githubusercontent.com/assets/4989256/5821832/b73c880c-a0d7-11e4-8458-832329b1c48a.png)
