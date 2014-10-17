// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
// <reference path="ms-appx://$(TargetFramework)/js/base.js" />
// <reference path="ms-appx://$(TargetFramework)/js/ui.js" />
// <reference path="ms-appx://$(TargetFramework)/js/en-us/ui.strings.js" />
// <reference path="ms-appx://$(TargetFramework)/css/ui-dark.css" />
/// <reference path="../TestLib/Helper.ts" />
/// <reference path="SplitViewUtilities.ts" />
// <reference path="SplitViewStyles.less.css" />
/// <deploy src="../TestData/" />

module SplitViewTests {
    "use strict";
    
    // Horizontal (placement left/right)
    var defaultHiddenPaneWidth = 0;
    var defaultShownPaneWidth = 320;
    // Vertical (placement top/bottom)
    var defaultHiddenPaneHeight = 0;
    var defaultShownPaneHeight = 320;
    
    var testRoot: HTMLElement;
    var Utils = SplitViewTests.Utilities;
    var createSplitView: (options?: any) => WinJS.UI.PrivateSplitView;
   
   
    /*function assertProperties(dialog: WinJS.UI.ContentDialog, providedOptions) {
        providedOptions = providedOptions || {};
        var defaultOptions: IContentDialogOptions = {
            title: "",
            primaryCommandText: "",
            secondaryCommandText: "",
            primaryCommandDisabled: false,
            secondaryCommandDisabled: false
        };
        var validPropreties = Object.keys(defaultOptions);
        Utils.assertValidKeys(providedOptions, validPropreties);
        var options: IContentDialogOptions = WinJS.Utilities._merge(defaultOptions, providedOptions);

        var title = dialog.element.querySelector("." + ContentDialog._ClassNames.title);
        LiveUnit.Assert.areEqual(options.title !== "", isVisible(title), "title element has unexpected visibility");
        LiveUnit.Assert.areEqual(options.title, title.textContent, "title element has unexpected textContent");
        LiveUnit.Assert.areEqual(options.title, dialog.title, "title has unexpected value");

        var primaryCommand = <HTMLButtonElement>dialog.element.querySelector("." + ContentDialog._ClassNames.primaryCommand);
        LiveUnit.Assert.areEqual(options.primaryCommandText, dialog.primaryCommandText,
            "primaryCommandText has unexpected value");
        LiveUnit.Assert.areEqual(options.primaryCommandText, primaryCommand.textContent,
            "primaryCommand element has unexpected textContent");
        LiveUnit.Assert.areEqual(options.primaryCommandText !== "", isVisible(primaryCommand),
            "primaryCommand element has unexpected visibility");
        LiveUnit.Assert.areEqual(options.primaryCommandDisabled, primaryCommand.disabled,
            "primaryCommand element has unexpected disabled state");

        var secondaryCommand = <HTMLButtonElement>dialog.element.querySelector("." + ContentDialog._ClassNames.secondaryCommand);
        LiveUnit.Assert.areEqual(options.secondaryCommandText, dialog.secondaryCommandText,
            "secondaryCommandText has unexpected value");
        LiveUnit.Assert.areEqual(options.secondaryCommandText, secondaryCommand.textContent,
            "secondaryCommand element has unexpected textContent");
        LiveUnit.Assert.areEqual(options.secondaryCommandText !== "", isVisible(secondaryCommand),
            "secondaryCommand element has unexpected visibility");
        LiveUnit.Assert.areEqual(options.secondaryCommandDisabled, secondaryCommand.disabled,
            "secondaryCommand element has unexpected disabled state");
    }*/
    
    interface IRect {
        left: number;
        top: number;
        width: number;
        height: number;
    }
    
    function measureMarginBox(element: HTMLElement, relativeTo: HTMLElement): IRect {
        var style = getComputedStyle(element);
        var position = WinJS.Utilities._getPositionRelativeTo(element, relativeTo);
        var marginLeft = parseInt(style.marginLeft, 10);
        var marginTop = parseInt(style.marginTop, 10);
        return {
            left: position.left - marginLeft,
            top: position.top - marginTop,
            width: WinJS.Utilities.getContentWidth(element),
            height: WinJS.Utilities.getContentHeight(element),
        };
    }
    
    function assertAreRectsEqual(expectedRect: IRect, actualRect: IRect, context: string): void {
        LiveUnit.Assert.areEqual(expectedRect.left, actualRect.left, context + ": incorrect left");
        LiveUnit.Assert.areEqual(expectedRect.top, actualRect.top, context + ": incorrect top");
        LiveUnit.Assert.areEqual(expectedRect.width, actualRect.width, context + ": incorrect width");
        LiveUnit.Assert.areEqual(expectedRect.height, actualRect.height, context + ": incorrect height");
    }
    
    interface ILayoutConfig {
        rootWidth: number;
        rootHeight: number;
        hiddenPaneWidth: number;
        shownPaneWidth: number;
        hiddenPaneHeight: number;
        shownPaneHeight: number;
        placement: string;
        shownDisplayMode: string;
        hidden: boolean;
        rtl: boolean;
    }
    
    function expectedPaneRect(config: ILayoutConfig): IRect {
        var placementLeft = config.rtl ? SplitView.Placement.right : SplitView.Placement.left;
        var placementRight = config.rtl ? SplitView.Placement.left : SplitView.Placement.right;
        
        var paneWidth = config.hidden ? config.hiddenPaneWidth : config.shownPaneWidth;
        var paneHeight = config.hidden ? config.hiddenPaneHeight : config.shownPaneHeight;
        
        var horizontal = config.placement === placementLeft || config.placement === placementRight;
        var size = horizontal ? {
            width: paneWidth,
            height: config.rootHeight
        } : {
            width: config.rootWidth,
            height: paneHeight
        };
            
        var pos: { left: number; top: number; }
        switch (config.placement) {
            case placementLeft:
            case SplitView.Placement.top:
                pos = { left: 0, top: 0 };
                break;
            case placementRight:
                pos = { 
                    left: config.rootWidth - paneWidth,
                    top: 0
                };
                break;
            case SplitView.Placement.bottom:
                pos = {
                    left: 0,
                    top: config.rootHeight - paneHeight
                };
                break;
        }
        
        return {
            left: pos.left,
            top: pos.top,
            width: size.width,
            height: size.height
        };
    }
    
    function expectedContentRect(config: ILayoutConfig): IRect {
        var placementLeft = config.rtl ? SplitView.Placement.right : SplitView.Placement.left;
        var placementRight = config.rtl ? SplitView.Placement.left : SplitView.Placement.right;
        
        var paneWidth: number;
        var paneHeight: number;
        if (config.hidden || config.shownDisplayMode === SplitView.ShownDisplayMode.overlay) {
            paneWidth = config.hiddenPaneWidth;
            paneHeight = config.hiddenPaneHeight;
        } else {
            paneWidth = config.shownPaneWidth;
            paneHeight = config.shownPaneHeight;
        }
        
        var horizontal = config.placement === placementLeft || config.placement === placementRight;
        var size = horizontal ? {
            width: config.rootWidth - paneWidth,
            height: config.rootHeight
        } : {
            width: config.rootWidth,
            height: config.rootHeight - paneHeight
        };
            
        var pos: { left: number; top: number; }
        switch (config.placement) {
            case placementLeft:
                pos = { left: paneWidth, top: 0 };
                break;
            case SplitView.Placement.top:
                pos = { left: 0, top: paneHeight };
                break;
            case placementRight:
            case SplitView.Placement.bottom:
                pos = { left: 0, top: 0 };
                break;
        }
        
        return {
            left: pos.left,
            top: pos.top,
            width: size.width,
            height: size.height
        };
    }
    
    function assertContentLayoutCorrect(splitView: WinJS.UI.PrivateSplitView, config: ILayoutConfig): void {
        var contentRect = measureMarginBox(splitView.contentElement, splitView.element);
        assertAreRectsEqual(expectedContentRect(config), contentRect, "Content rect");
    }
    
    function assertLayoutCorrect(splitView: WinJS.UI.PrivateSplitView, config: ILayoutConfig): void {
        var paneRect = measureMarginBox(splitView.paneElement, splitView.element);
        assertAreRectsEqual(expectedPaneRect(config), paneRect, "Pane rect");
        assertContentLayoutCorrect(splitView, config);
    }
    
    function testLayout(args: { rootHeight: number; rootWidth: number; hiddenPaneWidth: number; hiddenPaneHeight: number; shownPaneWidth: number; shownPaneHeight: number }, splitViewOptions?: any) {
        testRoot.style.height = args.rootHeight + "px";
        testRoot.style.width = args.rootWidth + "px";
        
        [true, false].forEach((rtl) => { // rtl
            if (rtl) {
                document.documentElement.setAttribute("lang", "ar");
            } else {
                document.documentElement.removeAttribute("lang");
            }
            var splitView = Utils.useSynchronousAnimations(createSplitView(splitViewOptions));
        
            ["left", "right", "top", "bottom"].forEach((placement) => { // placement
                ["inline", "overlay"].forEach((shownDisplayMode) => { // shownDisplayMode
                    [true, false].forEach((hidden) => { // hidden
                        splitView.placement = placement;
                        splitView.shownDisplayMode = shownDisplayMode;
                        splitView.hidden = hidden;
                        
                        var config = {
                            placement: placement,
                            shownDisplayMode: shownDisplayMode,
                            hidden: hidden,
                            rootWidth: args.rootWidth,
                            rootHeight: args.rootHeight,
                            hiddenPaneWidth: args.hiddenPaneWidth,
                            hiddenPaneHeight: args.hiddenPaneHeight,
                            shownPaneWidth: args.shownPaneWidth,
                            shownPaneHeight: args.shownPaneHeight,
                            rtl: rtl
                        };
                        
                        assertLayoutCorrect(splitView, config);
                    });
                });
            });
        });
    }
    
    // Taking the registration mechanism as a parameter allows us use this code to test both
    // DOM level 0 (e.g. onbeforeshow) and DOM level 2 (e.g. addEventListener) events.
    function testEvents(registerForEvent: (splitView: WinJS.UI.PrivateSplitView, eventName: string, handler: Function) => void) {
        var splitView = Utils.useSynchronousAnimations(createSplitView());

        var counter = 0;
        registerForEvent(splitView, "beforeshow", () => {
            LiveUnit.Assert.areEqual(1, counter, "beforeshow fired out of order");
            counter++;
            LiveUnit.Assert.isTrue(splitView.hidden, "beforeshow: SplitView should be in hidden state");
        });
        registerForEvent(splitView, "aftershow", () => {
            LiveUnit.Assert.areEqual(2, counter, "aftershow fired out of order");
            counter++;
            LiveUnit.Assert.isFalse(splitView.hidden, "aftershow: SplitView should not be in hidden state");
        });
        registerForEvent(splitView, "beforehide", () => {
            LiveUnit.Assert.areEqual(4, counter, "beforehide fired out of order");
            counter++;
            LiveUnit.Assert.isFalse(splitView.hidden, "beforehide: SplitView should not be in hidden state");
        });
        registerForEvent(splitView, "afterhide", () => {
            LiveUnit.Assert.areEqual(5, counter, "afterhide fired out of order");
            counter++;
            LiveUnit.Assert.isTrue(splitView.hidden, "afterhide: SplitView should be in hidden state");
        });
        
        LiveUnit.Assert.areEqual(0, counter, "before showPane: wrong number of events fired");
        counter++;
        LiveUnit.Assert.isTrue(splitView.hidden, "before showPane: SplitView should be in hidden state");
        
        splitView.showPane();
        LiveUnit.Assert.areEqual(3, counter, "after showPane: wrong number of events fired");
        counter++;
        LiveUnit.Assert.isFalse(splitView.hidden, "after showPane: SplitView should not be in hidden state");
        
        splitView.hidePane();
        LiveUnit.Assert.areEqual(6, counter, "after hidePane: wrong number of events fired");
        LiveUnit.Assert.isTrue(splitView.hidden, "after hidePane: SplitView should be in hidden state");
    }
    
    export class BasicTests {
        setUp() {
            testRoot = document.createElement("div");
            // Give it an id so that we can use it in styles to make sure our styles win over the defaults.
            // We encourage apps to do the same.
            testRoot.id = "test-root";
            createSplitView = Utils.makeCreateSplitView(testRoot);
            document.body.appendChild(testRoot);
        }

        tearDown() {
            WinJS.Utilities.disposeSubTree(testRoot);
            Helper.removeElement(testRoot);
            document.documentElement.removeAttribute("lang");
        }

        testDomLevel0Events() {
            testEvents((splitView: WinJS.UI.PrivateSplitView, eventName: string, handler: Function) => {
                splitView["on" + eventName] = handler;
            });
        }
        
        testDomLevel2Events() {
            testEvents((splitView: WinJS.UI.PrivateSplitView, eventName: string, handler: Function) => {
                splitView.addEventListener(eventName, handler);
            });
        }
        
        testBeforeShowIsCancelable() {
            var splitView = Utils.useSynchronousAnimations(createSplitView());
            
            splitView.onbeforeshow = function (eventObject) {
                eventObject.preventDefault();
            };
            splitView.onaftershow = function (eventObject) {
                LiveUnit.Assert.fail("aftershow shouldn't have fired due to beforeshow being canceled");
            };
            splitView.onbeforehide = function (eventObject) {
                LiveUnit.Assert.fail("beforehide shouldn't have fired due to beforeshow being canceled");
            };
            splitView.onafterhide = function (eventObject) {
                LiveUnit.Assert.fail("afterhide shouldn't have fired due to beforeshow being canceled");
            };
            
            splitView.showPane();
            LiveUnit.Assert.isTrue(splitView.hidden, "SplitView should still be hidden");
        }
        
        testBeforeHideIsCancelable() {
            function showShouldNotHaveCompleted() {
                LiveUnit.Assert.fail("show should not have completed");
            }
            
            var splitView = Utils.useSynchronousAnimations(createSplitView());
            
            splitView.showPane();
            splitView.onbeforehide = function (eventObject) {
                eventObject.preventDefault();
            };
            splitView.onafterhide = function (eventObject) {
                LiveUnit.Assert.fail("Hide should have been canceled");
            };
            splitView.hidePane();
            LiveUnit.Assert.isFalse(splitView.hidden, "SplitView should still be shown");
        }
        
        testDispose() {
            function failEventHandler(eventName) {
                return function () {
                    LiveUnit.Assert.fail(eventName + ": shouldn't have run due to control being disposed");  
                };
            }
            
            var splitView = Utils.useSynchronousAnimations(createSplitView());
            splitView.showPane();
            
            splitView.onbeforeshow = failEventHandler("beforeshow");
            splitView.onbeforehide = failEventHandler("beforehide");
            splitView.onaftershow = failEventHandler("aftershow");
            splitView.onafterhide = failEventHandler("afterhide");
            
            splitView.dispose();
            LiveUnit.Assert.isTrue(splitView._disposed, "SplitView didn't mark itself as disposed");
            LiveUnit.Assert.areEqual("Disposed", splitView._state.name, "SplitView didn't move into the disposed state");
            
            splitView.showPane();
            splitView.hidePane();
            splitView.dispose();
        }
        
        testDefaultLayout() {
            testLayout({
                rootHeight: 500,
                rootWidth: 1000,
                hiddenPaneWidth: defaultHiddenPaneWidth,
                hiddenPaneHeight: defaultHiddenPaneHeight,
                shownPaneWidth: defaultShownPaneWidth,
                shownPaneHeight: defaultShownPaneHeight
            })
        }
        
        // Make sure SplitView lays out correctly if the developer uses custom pane dimensions
        testCustomLayoutFixedSizes() {
            WinJS.Utilities.addClass(testRoot, "file-splitviewstyles-less");
            WinJS.Utilities.addClass(testRoot, "custom-sizes-fixed");
            testLayout({
                rootHeight: 500,
                rootWidth: 1000,
                hiddenPaneWidth: 321,
                hiddenPaneHeight: 123,
                shownPaneWidth: 409,
                shownPaneHeight: 242
            })
        }
        
        // Make sure SplitView lays out correctly if the developer configures the pane to size to its content
        testCustomLayoutAutoSizes() {
            WinJS.Utilities.addClass(testRoot, "file-splitviewstyles-less");
            WinJS.Utilities.addClass(testRoot, "custom-sizes-auto");
            testLayout({
                rootHeight: 500,
                rootWidth: 1000,
                hiddenPaneWidth: 223,
                hiddenPaneHeight: 343,
                shownPaneWidth: 303,
                shownPaneHeight: 444
            }, {
                paneHTML: '<div class="pane-sizer"></div>'
            })
        }
        
        // Verifies that animations start and end in the correct locations
        testAnimations(complete) {
            var rootHeight = 500;
            var rootWidth = 1000;
            var allConfigs = Helper.pairwise({
                rtl: [true, false],
                placement: ["left", "right", "top", "bottom"],
                shownDisplayMode: ["inline", "overlay"],
                peek: [true, false]
            });
            
            var testConfig = (index) => {
                if (index >= allConfigs.length) {
                    complete();
                } else {
                    var config = allConfigs[index];
                    var fullConfig = WinJS.Utilities._merge(config, {
                        rootHeight: rootHeight,
                        rootWidth: rootWidth,
                        hiddenPaneWidth: config.peek ? 48 : 0,
                        hiddenPaneHeight: config.peek ? 53 : 0,
                        shownPaneWidth: defaultShownPaneWidth,
                        shownPaneHeight: defaultShownPaneHeight,
                        hidden: false
                    });
                    var hooksRan = 0;
                    
                    if (fullConfig.rtl) {
                        document.documentElement.setAttribute("lang", "ar");
                    } else {
                        document.documentElement.removeAttribute("lang");
                    }
                    if (config.peek) {
                        WinJS.Utilities.addClass(testRoot, "file-splitviewstyles-less");
                        WinJS.Utilities.addClass(testRoot, "animations-pane-peek");
                    } else {
                        WinJS.Utilities.removeClass(testRoot, "file-splitviewstyles-less");
                        WinJS.Utilities.removeClass(testRoot, "animations-pane-peek");
                    }
                    var splitView = createSplitView({
                        placement: config.placement,
                        shownDisplayMode: config.shownDisplayMode
                    });
                    
                    var init = () => {
                        Utils.hookAfterPrepareAnimationOnce(splitView, () => {
                            hooksRan++;
                            fullConfig.hidden = true;
                            // It's tricky to verify the layout of the pane at the start of the hidden -> shown transition
                            // because the pane needs to be at its shown size during the animation but at the start it needs
                            // to look like it's in its hidden state (off screen)
                            // So we'll punt and just verify the layout of the content.
                            assertContentLayoutCorrect(splitView, fullConfig);
                        });
                        Utils.hookBeforeClearAnimationOnce(splitView, () => {
                            hooksRan++;
                            fullConfig.hidden = false;
                            assertLayoutCorrect(splitView, fullConfig);
                        });
                        splitView.showPane();
                    };
                    
                    splitView.onaftershow = () => {
                        Utils.hookAfterPrepareAnimationOnce(splitView, () => {
                            hooksRan++;
                            fullConfig.hidden = false;
                            assertLayoutCorrect(splitView, fullConfig);
                        });
                        Utils.hookBeforeClearAnimationOnce(splitView, () => {
                            hooksRan++;
                            fullConfig.hidden = true;
                            // It's tricky to verify the layout of the pane at the end of the shown -> hidden transition
                            // because the pane needs to be at its shown size during the animation but at the end it needs
                            // to look like it's in its hidden state (off screen)
                            // So we'll punt and just verify the layout of the content.
                            assertContentLayoutCorrect(splitView, fullConfig);
                        });
                        splitView.hidePane();
                    };
                    
                    splitView.onafterhide = () => {
                        LiveUnit.Assert.areEqual(4, hooksRan, "Not all of the animations hooks ran");
                        splitView.dispose();
                        Helper.removeElement(splitView.element);
                        testConfig(index + 1);
                    };
                    
                    init();
                }
            }
            
            testRoot.style.height = rootHeight + "px";
            testRoot.style.width = rootWidth + "px";
            testConfig(0);
        }
        
        /*testInsertInDomAfterConstruction(complete) {
            var splitView = Utils.useSynchronousAnimations(new SplitView());
            splitView.onbeforeshow = function () {
                // SplitView must have noticed that it is now in the DOM
                complete();  
            };
            splitView.showPane();
            testRoot.appendChild(splitView.element);
        }*/
        
        /*testInitializingProperties() {            
            var optionsRecords = [
                null,
                { title: "A title" },
                { primaryCommandText: "Yes!" },
                { secondaryCommandText: "Nay" },
                { title: "A title", primaryCommandText: "Yes!", secondaryCommandText: "Nay" },
                {
                    title: "A title",
                    primaryCommandText: "OK", primaryCommandDisabled: true,
                    secondaryCommandText: "Cancel", secondaryCommandDisabled: false
                }
            ];

            optionsRecords.forEach(function (options) {
                var dialog = Utils.useSynchronousAnimations(new ContentDialog(null, options));
                testRoot.appendChild(dialog.element);
                dialog.show();

                assertProperties(dialog, options);

                dialog.hide();
            });
        }

        testChangingProperties() {
            function applyChanges(changes) {
                Object.keys(changes).forEach(function (propertyName) {
                    dialog[propertyName] = changes[propertyName];
                    currentConfig[propertyName] = changes[propertyName];
                });
            }

            var propertiesToChange = [
                { title: "My Title" },
                { title: "" },
                { primaryCommandText: "Yes!" },
                { primaryCommandDisabled: true },
                { primaryCommandDisabled: false },
                { primaryCommandText: "" },
                { secondaryCommandText: "Nay" },
                { secondaryCommandDisabled: true },
                { secondaryCommandDisabled: false },
                { secondaryCommandText: "" }
            ];

            var currentConfig = {};
            var dialog = Utils.useSynchronousAnimations(new ContentDialog(null, currentConfig));
            testRoot.appendChild(dialog.element);
            dialog.show();

            // Change properties while dialog is showing
            propertiesToChange.forEach(function (changes) {
                applyChanges(changes);
                assertProperties(dialog, currentConfig);
            });

            // Change properties while dialog is hidden
            propertiesToChange.forEach(function (changes) {
                dialog.hide();
                applyChanges(changes);
                dialog.show();
                assertProperties(dialog, currentConfig);
            });
        }*/
    }
}
LiveUnit.registerTestClass("SplitViewTests.BasicTests");
