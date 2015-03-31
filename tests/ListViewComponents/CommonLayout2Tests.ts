// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
// <reference path="ms-appx://$(TargetFramework)/js/WinJS.js" />
// <reference path="ms-appx://$(TargetFramework)/css/ui-dark.css" />
/// <reference path="../TestLib/Helper.ListView.ts" />
/// <deploy src="../TestData/" />

module WinJSTests {
    "use strict";

    export class CommonListViewLayoutTests {


        setUp() {
            LiveUnit.LoggingCore.logComment("In setup");
            var newNode = document.createElement("div");
            newNode.id = "CommonLayoutTests";
            document.body.appendChild(newNode);
        }
        tearDown() {
            LiveUnit.LoggingCore.logComment("In tearDown");
            var element = document.getElementById("CommonLayoutTests");
            if (element) {
                WinJS.Utilities.disposeSubTree(element);
                document.body.removeChild(element);
            }
        }
    }

    function generate(name, testFunction) {
        function generateTest(direction, grouped, headersAbove, rtl, layoutName, forceOneItemPerBar) {
            var fullName = name + layoutName + "_" + direction + (grouped ? "_grouped_" + (headersAbove ? "headersOnTop_" : "headersOnLeft_") : "_") + (rtl ? "rtl" : "ltr");
            if (forceOneItemPerBar) {
                fullName += "(OneRow/Col)";
            }
            CommonListViewLayoutTests.prototype[fullName] = function (complete) {
                LiveUnit.LoggingCore.logComment("in " + fullName);
                var element = document.getElementById("CommonLayoutTests");
                var lvDetails = Helper.ListView.buildGenericListView(element, {
                    orientation: direction,
                    layout: layoutName,
                    rtl: rtl,
                    grouped: grouped,
                    headersAbove: headersAbove,
                    forceOneItemPerBar: forceOneItemPerBar
                });
                var listView = lvDetails.listView;
                Helper.ListView.waitForAllContainers(listView).then(function () {
                    testFunction(listView, lvDetails.layoutInfo, rtl, complete);
                });
            };
        }

        function generateTestSuite(layoutName, forceOneItemPerBar?) {
            function generateTestsForOrientation(o) {
                generateTest(o, false, false, false, layoutName, forceOneItemPerBar);
                generateTest(o, false, false, true, layoutName, forceOneItemPerBar);
                generateTest(o, true, false, false, layoutName, forceOneItemPerBar);
                generateTest(o, true, false, true, layoutName, forceOneItemPerBar);
                generateTest(o, true, true, false, layoutName, forceOneItemPerBar);
                generateTest(o, true, true, true, layoutName, forceOneItemPerBar);
            }
            generateTestsForOrientation("horizontal");
            generateTestsForOrientation("vertical");
        }
        generateTestSuite("ListLayout");
        generateTestSuite("GridLayout");
        generateTestSuite("GridLayout", true);
    }

    generate("testFirstLastVisible", function (listView, layoutDetails, rtl, complete) {
        var layout = listView.layout;
        var groupsCount = layoutDetails.groupsInfo.length;
        for (var i = 0; i < groupsCount; i++) {
            var currentGroup = layoutDetails.groupsInfo[i];
            var groupBars = currentGroup.bars;
            for (var j = 0; j < groupBars.length; j++) {
                var currentBar = groupBars[j],
                    firstItemInBar = currentBar[0],
                    lastItemInBar = currentBar[currentBar.length - 1];
                for (var indexInBar = 0; indexInBar < currentBar.length; indexInBar++) {
                    var itemInfo = currentBar[indexInBar];
                    LiveUnit.Assert.areEqual(firstItemInBar.absoluteIndex, layout._firstItemFromRange(itemInfo.start, { wholeItem: false }));
                    LiveUnit.Assert.areEqual(firstItemInBar.absoluteIndex, layout._firstItemFromRange(itemInfo.start, { wholeItem: true }));
                    if (j < groupBars.length - 1 || (j === groupBars.length - 1 && i < groupsCount - 1)) {
                        var nextBar = (j < groupBars.length - 1 ? groupBars[j + 1] : layoutDetails.groupsInfo[i + 1].bars[0]),
                            lastItemInNextBar = nextBar[nextBar.length - 1];
                        if (j === groupBars.length - 1 && itemInfo.end !== lastItemInNextBar.start) {
                            // itemInfo.end is in the margin or header between groups so it's not yet in
                            // the next bar.
                            LiveUnit.Assert.areEqual(lastItemInBar.absoluteIndex, layout._lastItemFromRange(itemInfo.end, { wholeItem: false }));
                        } else {
                            LiveUnit.Assert.areEqual(lastItemInNextBar.absoluteIndex, layout._lastItemFromRange(itemInfo.end, { wholeItem: false }));
                        }

                        LiveUnit.Assert.areEqual(lastItemInBar.absoluteIndex, layout._lastItemFromRange(itemInfo.end, { wholeItem: true }));
                    }
                }
            }
        }

        complete();
    });

    function getKeysForConfiguration(horizontal, rtl) {
        var Key = WinJS.Utilities.Key;
        var leftArrow = rtl ? Key.rightArrow : Key.leftArrow,
            rightArrow = rtl ? Key.leftArrow : Key.rightArrow;
        // In vertical mode, the keys to change slots back get swapped with keys to change bars back,
        // and slots forward with bars forward (in other words, up/down move you between columns, while left/right go between rows in vertical).
        var keyInfo = {
            moveOneSlotBack: horizontal ? Key.upArrow : leftArrow,
            moveOneSlotForward: horizontal ? Key.downArrow : rightArrow,
            moveOneBarBack: horizontal ? leftArrow : Key.upArrow,
            moveOneBarForward: horizontal ? rightArrow : Key.downArrow
        };

        return keyInfo;
    }

    generate("testKeyboardArrows", function (listView, layoutDetails, rtl, complete) {
        var layout = listView.layout;
        var keyHelper = getKeysForConfiguration(layoutDetails.horizontal, rtl);
        var groupsCount = layoutDetails.groupsInfo.length;
        var oneItemPerBar = (layoutDetails.itemsPerBar === 1);
        for (var i = 0; i < groupsCount; i++) {
            var currentGroup = layoutDetails.groupsInfo[i];
            var groupBars = currentGroup.bars;
            for (var j = 0; j < groupBars.length; j++) {
                var currentBar = groupBars[j],
                    firstItemInBar = currentBar[0],
                    lastItemInBar = currentBar[currentBar.length - 1];
                for (var indexInBar = 0; indexInBar < currentBar.length; indexInBar++) {
                    var itemInfo = currentBar[indexInBar];
                    var currentItem = { type: "item", index: itemInfo.absoluteIndex };
                    if (oneItemPerBar) {
                        LiveUnit.Assert.areEqual(itemInfo.absoluteIndex - 1, layout.getAdjacent(currentItem, keyHelper.moveOneSlotBack).index);
                        LiveUnit.Assert.areEqual(itemInfo.absoluteIndex - 1, layout.getAdjacent(currentItem, keyHelper.moveOneBarBack).index);
                        LiveUnit.Assert.areEqual(Math.min(itemInfo.absoluteIndex + 1, layoutDetails.itemsCount - 1), layout.getAdjacent(currentItem, keyHelper.moveOneSlotForward).index);
                        LiveUnit.Assert.areEqual(Math.min(itemInfo.absoluteIndex + 1, layoutDetails.itemsCount - 1), layout.getAdjacent(currentItem, keyHelper.moveOneBarForward).index);
                    } else {
                        var expectedSlotBackwards = Math.max(firstItemInBar.absoluteIndex, itemInfo.absoluteIndex - 1),
                            expectedSlotForwards = Math.min(lastItemInBar.absoluteIndex, itemInfo.absoluteIndex + 1),
                            expectedBarForwards = -1,
                            expectedBarBackwards = -1;
                        if (i + 1 < layoutDetails.groupsInfo.length || j + 1 < groupBars.length) {
                            var nextBar = (j + 1 < groupBars.length ? groupBars[j + 1] : layoutDetails.groupsInfo[i + 1].bars[0]);
                            var slotInBar = Math.min(nextBar.length - 1, itemInfo.slot);
                            expectedBarForwards = nextBar[slotInBar].absoluteIndex;
                        }
                        if (i - 1 >= 0 || j - 1 >= 0) {
                            var previousBar = (j - 1 >= 0 ? groupBars[j - 1] : layoutDetails.groupsInfo[i - 1].bars[layoutDetails.groupsInfo[i - 1].bars.length - 1]);
                            var slotInBar = Math.min(previousBar.length - 1, itemInfo.slot);
                            expectedBarBackwards = previousBar[slotInBar].absoluteIndex;
                        }
                        LiveUnit.Assert.areEqual(expectedSlotBackwards, layout.getAdjacent(currentItem, keyHelper.moveOneSlotBack).index);
                        LiveUnit.Assert.areEqual(expectedSlotForwards, layout.getAdjacent(currentItem, keyHelper.moveOneSlotForward).index);
                        if (expectedBarForwards >= 0) {
                            LiveUnit.Assert.areEqual(expectedBarForwards, layout.getAdjacent(currentItem, keyHelper.moveOneBarForward).index);
                        }
                        if (expectedBarBackwards >= 0) {
                            LiveUnit.Assert.areEqual(expectedBarBackwards, layout.getAdjacent(currentItem, keyHelper.moveOneBarBack).index);
                        }
                    }
                }
            }
        }
        complete();
    });

    function getLocationsInsideItem(itemInfo, horizontal, useListSemantics, grouped) {
        var positions = {
            topLeft: {
                x: itemInfo.left + (itemInfo.itemWidth / 3),
                y: itemInfo.top + (itemInfo.itemHeight / 3),
                expectedInsertAfter: undefined
            },
            topRight: {
                x: itemInfo.left + 2 * (itemInfo.itemWidth / 3),
                y: itemInfo.top + (itemInfo.itemHeight / 3),
                expectedInsertAfter: undefined
            },
            bottomLeft: {
                x: itemInfo.left + (itemInfo.itemWidth / 3),
                y: itemInfo.top + 2 * (itemInfo.itemHeight / 3),
                expectedInsertAfter: undefined
            },
            bottomRight: {
                x: itemInfo.left + 2 * (itemInfo.itemWidth / 3),
                y: itemInfo.top + 2 * (itemInfo.itemHeight / 3),
                expectedInsertAfter: undefined
            }
        };

        function populateVerticalMidPoint() {
            positions.topLeft.expectedInsertAfter = itemInfo.absoluteIndex - 1,
            positions.bottomLeft.expectedInsertAfter = itemInfo.absoluteIndex - 1;
            positions.topRight.expectedInsertAfter = itemInfo.absoluteIndex;
            positions.bottomRight.expectedInsertAfter = itemInfo.absoluteIndex;
        }
        function populateHorizontalMidPoint() {
            positions.topLeft.expectedInsertAfter = itemInfo.absoluteIndex - 1,
            positions.topRight.expectedInsertAfter = itemInfo.absoluteIndex - 1;
            positions.bottomLeft.expectedInsertAfter = itemInfo.absoluteIndex;
            positions.bottomRight.expectedInsertAfter = itemInfo.absoluteIndex;
        }
        if (!grouped) {
            if (useListSemantics) {
                if (horizontal) {
                    populateVerticalMidPoint();
                } else {
                    populateHorizontalMidPoint();
                }
            } else {
                if (horizontal) {
                    populateHorizontalMidPoint();
                } else {
                    populateVerticalMidPoint();
                }
            }
        }
        return positions;
    }
    generate("testHitTest", function (listView, layoutDetails, rtl, complete) {
        var layout = listView.layout;
        var keyHelper = getKeysForConfiguration(layoutDetails.horizontal, rtl);
        var groupsCount = layoutDetails.groupsInfo.length;
        var oneItemPerBar = (layoutDetails.itemsPerBar === 1);
        for (var i = 0; i < groupsCount; i++) {
            var currentGroup = layoutDetails.groupsInfo[i];
            var groupBars = currentGroup.bars;
            for (var j = 0; j < groupBars.length; j++) {
                var currentBar = groupBars[j];
                for (var indexInBar = 0; indexInBar < currentBar.length; indexInBar++) {
                    var itemInfo = currentBar[indexInBar];
                    var locations = getLocationsInsideItem(itemInfo, layoutDetails.horizontal, oneItemPerBar, layoutDetails.grouped);
                    for (var position in locations) {
                        var hitTestResult = layout.hitTest(locations[position].x, locations[position].y);
                        LiveUnit.Assert.areEqual(itemInfo.absoluteIndex, hitTestResult.index);
                        if (!layoutDetails.grouped) {
                            LiveUnit.Assert.areEqual(locations[position].expectedInsertAfter, hitTestResult.insertAfterIndex);
                        }
                    }
                }
            }
        }
        complete();
    });

}
LiveUnit.registerTestClass("WinJSTests.CommonListViewLayoutTests");
