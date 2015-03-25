// Copyright (c) Microsoft Corporation.  All Rights Reserved. Licensed under the MIT License. See License.txt in the project root for license information.
define([
    'exports',
    '../../Animations/_TransitionAnimation',
    '../../BindingList',
    '../../Core/_BaseUtils',
    '../../Core/_Global',
    '../../Core/_Base',
    '../../Core/_ErrorFromName',
    '../../Core/_Resources',
    '../../Core/_WriteProfilerMark',
    '../../Controls/ToolBar',
    '../../Controls/ToolBar/_Constants',
    '../../Promise',
    '../../Scheduler',
    '../../Utilities/_Control',
    '../../Utilities/_Dispose',
    '../../Utilities/_ElementUtilities',
    '../AppBar/_Command',
    './_Constants'
], function appBarLayoutsInit(exports, _TransitionAnimation, BindingList, _BaseUtils, _Global, _Base, _ErrorFromName, _Resources, _WriteProfilerMark, ToolBar, _ToolBarConstants, Promise, Scheduler, _Control, _Dispose, _ElementUtilities, _Command, _Constants) {
    "use strict";

    // AppBar will use this when AppBar.layout property is set to "custom"
    _Base.Namespace._moduleDefine(exports, "WinJS.UI", {
        _AppBarBaseLayout: _Base.Namespace._lazy(function () {
            var baseType = _Constants.appBarLayoutCustom;

            var strings = {
                get nullCommand() { return "Invalid argument: command must not be null"; }
            };

            var _AppBarBaseLayout = _Base.Class.define(function _AppBarBaseLayout_ctor(appBarEl, options) {
                this._disposed = false;

                options = options || {};
                _Control.setOptions(this, options);

                if (appBarEl) {
                    this.connect(appBarEl);
                }
            }, {
                // Members
                className: {
                    get: function _AppBarBaseLayout_get_className() {
                        return this._className;
                    },
                },
                type: {
                    get: function _AppBarBaseLayout_get_className() {
                        return this._type || baseType;
                    },
                },
                commandsInOrder: {
                    get: function _AppBarBaseLayout_get_commandsInOrder() {
                        // Get a DOM ordered collection of the AppBarCommand elements in the AppBar.
                        var commandElements = this.appBarEl.querySelectorAll("." + _Constants.appBarCommandClass);

                        // Return an array of AppBarCommand objects.
                        return Array.prototype.map.call(commandElements, function (commandElement) {
                            return commandElement.winControl;
                        });
                    }
                },
                connect: function _AppBarBaseLayout_connect(appBarEl) {
                    if (this.className) {
                        _ElementUtilities.addClass(appBarEl, this.className);
                    }
                    this.appBarEl = appBarEl;
                },
                disconnect: function _AppBarBaseLayout_disconnect() {
                    if (this.className) {
                        _ElementUtilities.removeClass(this.appBarEl, this.className);
                    }
                    this.appBarEl = null;
                    this.dispose();
                },
                layout: function _AppBarBaseLayout_layout(commands) {
                    // Append commands to the DOM.
                    var len = commands.length;
                    for (var i = 0; i < len; i++) {
                        var command = this.sanitizeCommand(commands[i]);
                        this.appBarEl.appendChild(command._element);
                    }
                },
                showCommands: function _AppBarBaseLayout_showCommands(commands) {
                    // Use the default overlay showCommands implementation
                    this.appBarEl.winControl._showCommands(commands);
                },
                showOnlyCommands: function _AppBarBaseLayout_showOnlyCommands(commands) {
                    // Use the default overlay _showOnlyCommands implementation
                    this.appBarEl.winControl._showOnlyCommands(commands);
                },
                hideCommands: function _AppBarBaseLayout_hideCommands(commands) {
                    // Use the default overlay _hideCommands implementation
                    this.appBarEl.winControl._hideCommands(commands);
                },
                sanitizeCommand: function _AppBarBaseLayout_sanitizeCommand(command) {
                    if (!command) {
                        throw new _ErrorFromName("WinJS.UI.AppBar.NullCommand", strings.nullCommand);
                    }
                    // See if it's a command already
                    command = command.winControl || command;
                    if (!command._element) {
                        // Not a command, so assume it is options for the command's constructor.
                        command = new _Command.AppBarCommand(null, command);
                    }
                    // If we were attached somewhere else, detach us
                    if (command._element.parentElement) {
                        command._element.parentElement.removeChild(command._element);
                    }

                    return command;
                },
                dispose: function _AppBarBaseLayout_dispose() {
                    this._disposed = true;
                },
                disposeChildren: function _AppBarBaseLayout_disposeChildren() {
                    var appBarFirstDiv = this.appBarEl.querySelectorAll("." + _Constants.firstDivClass);
                    appBarFirstDiv = appBarFirstDiv.length >= 1 ? appBarFirstDiv[0] : null;
                    var appBarFinalDiv = this.appBarEl.querySelectorAll("." + _Constants.finalDivClass);
                    appBarFinalDiv = appBarFinalDiv.length >= 1 ? appBarFinalDiv[0] : null;

                    var children = this.appBarEl.children;
                    var length = children.length;
                    for (var i = 0; i < length; i++) {
                        var element = children[i];
                        if (element === appBarFirstDiv || element === appBarFinalDiv) {
                            continue;
                        } else {
                            _Dispose.disposeSubTree(element);
                        }
                    }
                },
                handleKeyDown: function _AppBarBaseLayout_handleKeyDown() {
                    // NOP
                },
                commandsUpdated: function _AppBarBaseLayout_commandsUpdated() {
                    // NOP
                },
                beginAnimateCommands: function _AppBarBaseLayout_beginAnimateCommands() {
                    // The parameters are 3 mutually exclusive arrays of win-command elements contained in this Overlay.
                    // 1) showCommands[]: All of the HIDDEN win-command elements that ARE scheduled to show.
                    // 2) hideCommands[]: All of the VISIBLE win-command elements that ARE scheduled to hide.
                    // 3) otherVisibleCommands[]: All VISIBLE win-command elements that ARE NOT scheduled to hide.

                    // NOP
                },
                endAnimateCommands: function _AppBarBaseLayout_endAnimateCommands() {
                    // NOP
                },
                scale: function _AppBarBaseLayout_scale() {
                    // NOP
                },
                resize: function _AppBarBaseLayout_resize() {
                    // NOP
                },
                positionChanging: function _AppBarBaseLayout_positionChanging(fromPosition, toPosition) {
                    // NOP
                    return Promise.wrap();
                },
                setFocusOnShow: function _AppBarBaseLayout_setFocusOnShow() {
                    this.appBarEl.winControl._setFocusToAppBar();
                }
            });
            return _AppBarBaseLayout;
        }),
    });

    // AppBar will use this when AppBar.layout property is set to "commands"
    _Base.Namespace._moduleDefine(exports, "WinJS.UI", {
        _AppBarCommandsLayout: _Base.Namespace._lazy(function () {
            var layoutClassName = _Constants.commandLayoutClass;
            var layoutType = _Constants.appBarLayoutCommands;

            var _AppBarCommandsLayout = _Base.Class.derive(exports._AppBarBaseLayout, function _AppBarCommandsLayout_ctor(appBarEl) {
                exports._AppBarBaseLayout.call(this, appBarEl, { _className: layoutClassName, _type: layoutType });
                this._commandLayoutsInit(appBarEl);
            }, {
                commandsInOrder: {
                    get: function _AppBarCommandsLayout_get_commandsInOrder() {
                        return this._originalCommands.filter(function (command) {
                            // Make sure the element is still in the AppBar.
                            return this.appBarEl.contains(command.element);
                        }, this);
                    }
                },
                layout: function _AppBarCommandsLayout_layout(commands) {
                    // Insert commands and other layout specific DOM into the AppBar element.

                    // Empty our tree.
                    _ElementUtilities.empty(this._primaryCommands);
                    _ElementUtilities.empty(this._secondaryCommands);

                    // Keep track of the order we receive the commands in.
                    this._originalCommands = [];

                    // Layout commands
                    for (var i = 0, len = commands.length; i < len; i++) {
                        var command = this.sanitizeCommand(commands[i]);

                        this._originalCommands.push(command);

                        if ("primary" === command.section || "global" === command.section) {
                            this._primaryCommands.appendChild(command._element);
                        } else {
                            this._secondaryCommands.appendChild(command._element);
                        }
                    }

                    // Append layout containers to AppBar element.
                    // Secondary Commands should come first in Tab Order.
                    this.appBarEl.appendChild(this._secondaryCommands);
                    this.appBarEl.appendChild(this._primaryCommands);


                    // Need to measure all content commands after they have been added to the AppBar to make sure we allow
                    // user defined CSS rules based on the ancestor of the content command to take affect.
                    this._needToMeasureNewCommands = true;

                    // In case this is called from the constructor before the AppBar element has been appended to the DOM,
                    // we schedule the initial scaling of commands, with the expectation that the element will be added
                    // synchronously, in the same block of code that called the constructor.
                    Scheduler.schedule(function () {
                        if (this._needToMeasureNewCommands && !this._disposed) {
                            this.scale();
                        }
                    }.bind(this), Scheduler.Priority.idle, this, "WinJS._commandLayoutsMixin._scaleNewCommands");

                },
                disposeChildren: function _AppBarCommandsLayout_disposeChildren() {
                    _Dispose.disposeSubTree(this._primaryCommands);
                    _Dispose.disposeSubTree(this._secondaryCommands);
                },
                handleKeyDown: function _AppBarCommandsLayout_handleKeyDown(event) {
                    var Key = _ElementUtilities.Key;

                    if (_ElementUtilities._matchesSelector(event.target, ".win-interactive, .win-interactive *")) {
                        return; // Ignore left, right, home & end keys if focused element has win-interactive class.
                    }
                    var rtl = _Global.getComputedStyle(this.appBarEl).direction === "rtl";
                    var leftKey = rtl ? Key.rightArrow : Key.leftArrow;
                    var rightKey = rtl ? Key.leftArrow : Key.rightArrow;

                    if (event.keyCode === leftKey || event.keyCode === rightKey || event.keyCode === Key.home || event.keyCode === Key.end) {

                        var globalCommandHasFocus = this._primaryCommands.contains(_Global.document.activeElement);
                        var focusableCommands = this._getFocusableCommandsInLogicalOrder(globalCommandHasFocus);
                        var targetCommand;

                        if (focusableCommands.length) {
                            switch (event.keyCode) {
                                case leftKey:
                                    // Arrowing past the last command wraps back around to the first command.
                                    var index = Math.max(-1, focusableCommands.focusedIndex - 1) + focusableCommands.length;
                                    targetCommand = focusableCommands[index % focusableCommands.length].winControl.lastElementFocus;
                                    break;

                                case rightKey:
                                    // Arrowing previous to the first command wraps back around to the last command.
                                    var index = focusableCommands.focusedIndex + 1 + focusableCommands.length;
                                    targetCommand = focusableCommands[index % focusableCommands.length].winControl.firstElementFocus;
                                    break;

                                case Key.home:
                                    var index = 0;
                                    targetCommand = focusableCommands[index].winControl.firstElementFocus;
                                    break;

                                case Key.end:
                                    var index = focusableCommands.length - 1;
                                    targetCommand = focusableCommands[index].winControl.lastElementFocus;
                                    break;
                            }
                        }

                        if (targetCommand && targetCommand !== _Global.document.activeElement) {
                            targetCommand.focus();
                            // Prevent default so that the browser doesn't also evaluate the keydown event on the newly focused element.
                            event.preventDefault();
                        }
                    }
                },
                commandsUpdated: function _AppBarCommandsLayout_commandsUpdated(newSetOfVisibleCommands) {
                    // Whenever new commands are set or existing commands are hiding/showing in the AppBar, this
                    // function is called to update the cached width measurement of all visible AppBarCommands.

                    var visibleCommands = (newSetOfVisibleCommands) ? newSetOfVisibleCommands : this.commandsInOrder.filter(function (command) {
                        return !command.hidden;
                    });
                    this._fullSizeWidthOfLastKnownVisibleCommands = this._getWidthOfFullSizeCommands(visibleCommands);
                },
                beginAnimateCommands: function _AppBarCommandsLayout_beginAnimateCommands(showCommands, hideCommands, otherVisibleCommands) {
                    // The parameters are 3 mutually exclusive arrays of win-command elements contained in this Overlay.
                    // 1) showCommands[]: All of the HIDDEN win-command elements that ARE scheduled to show.
                    // 2) hideCommands[]: All of the VISIBLE win-command elements that ARE scheduled to hide.
                    // 3) otherVisibleCommands[]: All VISIBLE win-command elements that ARE NOT scheduled to hide.

                    this._scaleAfterAnimations = false;

                    // Determine if the overall width of visible commands in the primary row will be increasing OR decreasing.
                    var changeInWidth = this._getWidthOfFullSizeCommands(showCommands) - this._getWidthOfFullSizeCommands(hideCommands);
                    if (changeInWidth > 0) {
                        // Width of contents is going to increase, update our command counts now, to what they will be after we complete the animations.
                        var visibleCommandsAfterAnimations = otherVisibleCommands.concat(showCommands);
                        this.commandsUpdated(visibleCommandsAfterAnimations);
                        // Make sure we will have enough room to fit everything on a single row.
                        this.scale();
                    } else if (changeInWidth < 0) {
                        // Width of contents is going to decrease. Once animations are complete, check if
                        // there is enough available space to make the remaining commands full size.
                        this._scaleAfterAnimations = true;
                    }
                },
                endAnimateCommands: function _AppBarCommandsLayout_endAnimateCommands() {
                    if (this._scaleAfterAnimations) {
                        this.commandsUpdated();
                        this.scale();
                    }
                },
                resize: function _AppBarCommandsLayout_resize() {
                    if (!this._disposed) {
                        // Check for horizontal window resizes.
                        this._appBarTotalKnownWidth = null;
                        if (this.appBarEl.winControl.opened) {
                            this.scale();
                        }
                    }
                },
                disconnect: function _AppBarCommandsLayout_disconnect() {
                    exports._AppBarBaseLayout.prototype.disconnect.call(this);
                },
                _getWidthOfFullSizeCommands: function _AppBarCommandsLayout_getWidthOfFullSizeCommands(commands) {
                    // Commands layout puts primary commands and secondary commands into the primary row.
                    // Return the total width of all visible primary and secondary commands as if they were full-size.

                    // Perform any pending measurements on "content" type AppBarCommands.
                    if (this._needToMeasureNewCommands) {
                        this._measureContentCommands();
                    }
                    var accumulatedWidth = 0;
                    var separatorsCount = 0;
                    var buttonsCount = 0;

                    if (!commands) {
                        // Return the cached full size width of the last known visible commands in the AppBar.
                        return this._fullSizeWidthOfLastKnownVisibleCommands;
                    } else {
                        // Return the width of the specified commands.
                        var command;
                        for (var i = 0, len = commands.length; i < len; i++) {
                            command = commands[i].winControl || commands[i];
                            if (command._type === _Constants.typeSeparator) {
                                separatorsCount++;
                            } else if (command._type !== _Constants.typeContent) {
                                // button, toggle, and flyout types all have the same width.
                                buttonsCount++;
                            } else {
                                accumulatedWidth += command._fullSizeWidth;
                            }
                        }
                    }
                    return accumulatedWidth += (separatorsCount * _Constants.separatorWidth) + (buttonsCount * _Constants.buttonWidth);
                },
                _getFocusableCommandsInLogicalOrder: function _AppBarCommandsLayout_getCommandsInLogicalOrder() {
                    // Function returns an array of all the contained AppBarCommands which are reachable by left/right arrows.

                    var secondaryCommands = this._secondaryCommands.children,
                        primaryCommands = this._primaryCommands.children,
                        focusedIndex = -1;

                    var getFocusableCommandsHelper = function (commandsInReach) {
                        var focusableCommands = [];
                        for (var i = 0, len = commandsInReach.length; i < len; i++) {
                            var element = commandsInReach[i];
                            if (_ElementUtilities.hasClass(element, _Constants.appBarCommandClass) && element.winControl) {
                                var containsFocus = element.contains(_Global.document.activeElement);
                                // With the inclusion of content type commands, it may be possible to tab to elements in AppBarCommands that are not reachable by arrow keys.
                                // Regardless, when an AppBarCommand contains the element with focus, we just include the whole command so that we can determine which
                                // commands are adjacent to it when looking for the next focus destination.
                                if (element.winControl._isFocusable() || containsFocus) {
                                    focusableCommands.push(element);
                                    if (containsFocus) {
                                        focusedIndex = focusableCommands.length - 1;
                                    }
                                }
                            }
                        }
                        return focusableCommands;
                    };

                    // Determines which set of commands the user could potentially reach through Home, End, and arrow keys.
                    // All commands in the commands layout AppBar, from left to right are in reach. Secondary (previously known as Selection)
                    // then Primary (previously known as Global).
                    var commandsInReach = Array.prototype.slice.call(secondaryCommands).concat(Array.prototype.slice.call(primaryCommands));

                    var focusableCommands = getFocusableCommandsHelper(commandsInReach);
                    focusableCommands.focusedIndex = focusedIndex;
                    return focusableCommands;
                },
                _commandLayoutsInit: function _AppBarCommandsLayout_commandLayoutsInit() {
                    // Create layout infrastructure
                    this._primaryCommands = _Global.document.createElement("DIV");
                    this._secondaryCommands = _Global.document.createElement("DIV");
                    _ElementUtilities.addClass(this._primaryCommands, _Constants.primaryCommandsClass);
                    _ElementUtilities.addClass(this._secondaryCommands, _Constants.secondaryCommandsClass);
                },
                _scaleHelper: function _AppBarCommandsLayout_scaleHelper() {
                    // This exists as a single line function so that unit tests can
                    // overwrite it since they can't resize the WWA window.

                    // It is expected that AppBar is an immediate child of the <body> and will have 100% width.
                    // We measure the clientWidth of the documentElement so that we can scale the AppBar lazily
                    // even while its element is display: 'none'
                    var extraPadding = this.appBarEl.winControl.closedDisplayMode === "minimal" ? _Constants.appBarInvokeButtonWidth : 0;
                    return _Global.document.documentElement.clientWidth - extraPadding;
                },
                _measureContentCommands: function _AppBarCommandsLayout_measureContentCommands() {
                    // AppBar measures the width of content commands when they are first added
                    // and then caches that value to avoid additional layouts in the future.

                    // Can't measure unless We're in the document body
                    if (_Global.document.body.contains(this.appBarEl)) {
                        this._needToMeasureNewCommands = false;

                        var hadHiddenClass = _ElementUtilities.hasClass(this.appBarEl, "win-navbar-closed");
                        _ElementUtilities.removeClass(this.appBarEl, "win-navbar-closed");

                        // Make sure AppBar and children have width dimensions.
                        var prevAppBarDisplay = this.appBarEl.style.display;
                        this.appBarEl.style.display = "";
                        var prevCommandDisplay;

                        var contentElements = this.appBarEl.querySelectorAll("div." + _Constants.appBarCommandClass);
                        var element;
                        for (var i = 0, len = contentElements.length; i < len; i++) {
                            element = contentElements[i];
                            if (element.winControl && element.winControl._type === _Constants.typeContent) {
                                // Make sure command has width dimensions before we measure.
                                prevCommandDisplay = element.style.display;
                                element.style.display = "";
                                element.winControl._fullSizeWidth = _ElementUtilities.getTotalWidth(element) || 0;
                                element.style.display = prevCommandDisplay;
                            }
                        }

                        // Restore state to AppBar.
                        this.appBarEl.style.display = prevAppBarDisplay;
                        if (hadHiddenClass) {
                            _ElementUtilities.addClass(this.appBarEl, "win-navbar-closed");
                        }

                        this.commandsUpdated();
                    }
                },
            });
            return _AppBarCommandsLayout;
        }),
    });

    _Base.Namespace._moduleDefine(exports, "WinJS.UI", {
        _AppBarMenuLayout: _Base.Namespace._lazy(function () {
            var layoutClassName = _Constants.menuLayoutClass;
            var layoutType = _Constants.appBarLayoutMenu;

            //
            // Resize animation
            //  The resize animation requires 2 animations to run simultaneously in sync with each other. It's implemented
            //  without PVL because PVL doesn't provide a way to guarantee that 2 animations will start at the same time.
            //
            var transformNames = _BaseUtils._browserStyleEquivalents["transform"];
            function transformWithTransition(element, transition) {
                // transition's properties:
                // - duration: Number representing the duration of the animation in milliseconds.
                // - timing: String representing the CSS timing function that controls the progress of the animation.
                // - to: The value of *element*'s transform property after the animation.
                var duration = transition.duration * _TransitionAnimation._animationFactor;
                var transitionProperty = _BaseUtils._browserStyleEquivalents["transition"].scriptName;
                element.style[transitionProperty] = duration + "ms " + transformNames.cssName + " " + transition.timing;
                element.style[transformNames.scriptName] = transition.to;

                var finish;
                return new Promise(function (c) {
                    var onTransitionEnd = function (eventObject) {
                        if (eventObject.target === element && eventObject.propertyName === transformNames.cssName) {
                            finish();
                        }
                    };

                    var didFinish = false;
                    finish = function () {
                        if (!didFinish) {
                            _Global.clearTimeout(timeoutId);
                            element.removeEventListener(_BaseUtils._browserEventEquivalents["transitionEnd"], onTransitionEnd);
                            element.style[transitionProperty] = "";
                            didFinish = true;
                        }
                        c();
                    };

                    // Watch dog timeout
                    var timeoutId = _Global.setTimeout(function () {
                        timeoutId = _Global.setTimeout(finish, duration);
                    }, 50);

                    element.addEventListener(_BaseUtils._browserEventEquivalents["transitionEnd"], onTransitionEnd);
                }, function () {
                    finish(); // On cancelation, complete the promise successfully to match PVL
                });
            }
            // See resizeTransition's comment for documentation on *args*.
            function growTransition(elementClipper, element, args) {
                var diff = args.anchorTrailingEdge ? args.to.total - args.from.total : args.from.total - args.to.total;
                var translate = args.dimension === "width" ? "translateX" : "translateY";
                var size = args.dimension;
                var duration = args.duration || 367;
                var timing = args.timing || "cubic-bezier(0.1, 0.9, 0.2, 1)";

                // Set up
                elementClipper.style[size] = args.to.total + "px";
                elementClipper.style[transformNames.scriptName] = translate + "(" + diff + "px)";
                element.style[size] = args.to.content + "px";
                element.style[transformNames.scriptName] = translate + "(" + -diff + "px)";

                // Resolve styles
                _Global.getComputedStyle(elementClipper).opacity;
                _Global.getComputedStyle(element).opacity;

                // Animate
                var transition = {
                    duration: duration,
                    timing: timing,
                    to: ""
                };
                return Promise.join([
                    transformWithTransition(elementClipper,  transition),
                    transformWithTransition(element, transition)
                ]);
            }
            // See resizeTransition's comment for documentation on *args*.
            function shrinkTransition(elementClipper, element, args) {
                var diff = args.anchorTrailingEdge ? args.from.total - args.to.total : args.to.total - args.from.total;
                var translate = args.dimension === "width" ? "translateX" : "translateY";
                var duration = args.duration || 367;
                var timing = args.timing || "cubic-bezier(0.1, 0.9, 0.2, 1)";

                // Set up
                elementClipper.style[transformNames.scriptName] = "";
                element.style[transformNames.scriptName] = "";

                // Resolve styles
                _Global.getComputedStyle(elementClipper).opacity;
                _Global.getComputedStyle(element).opacity;

                // Animate
                var transition = {
                    duration: duration,
                    timing: timing
                };
                var clipperTransition = _BaseUtils._merge(transition, { to: translate + "(" + diff + "px)" });
                var elementTransition = _BaseUtils._merge(transition, { to: translate + "(" + -diff + "px)" });
                return Promise.join([
                    transformWithTransition(elementClipper, clipperTransition),
                    transformWithTransition(element, elementTransition)
                ]);
            }
            // Plays an animation which makes an element look like it is resizing in 1 dimension. Arguments:
            // - elementClipper: The parent of *element*. It shouldn't have any margin, border, or padding and its
            //   size should match element's size. Its purpose is to clip *element* during the animation to give
            //   it the illusion that it is resizing.
            // - element: The element that should look like it's resizing.
            // - args: An object with the following required properties:
            //   - from: An object representing the old width/height of the element.
            //   - to: An object representing the new width/height of the element.
            //     from/to are objects of the form { content: number; total: number; }. "content" is the
            //     width/height of *element*'s content box (e.g. getContentWidth). "total" is the width/height
            //     of *element*'s margin box (e.g. getTotalWidth).
            //   - duration: The CSS transition duration property.
            //   - timing: The CSS transition timing property.
            //   - dimension: The dimension on which *element* is resizing. Either "width" or "height".
            //   - anchorTrailingEdge: During the resize animation, one edge will move and the other edge will
            //     remain where it is. This flag specifies which edge is anchored (i.e. won't move).
            //
            function resizeTransition(elementClipper, element, args) {
                if (args.to.total > args.from.total) {
                    return growTransition(elementClipper, element, args);
                } else if (args.to.total < args.from.total) {
                    return shrinkTransition(elementClipper, element, args);
                } else {
                    return Promise.as();
                }
            }

            var _AppBarMenuLayout = _Base.Class.derive(exports._AppBarBaseLayout, function _AppBarMenuLayout_ctor(appBarEl) {
                exports._AppBarBaseLayout.call(this, appBarEl, { _className: layoutClassName, _type: layoutType });
                this._tranformNames = _BaseUtils._browserStyleEquivalents["transform"];
                this._animationCompleteBound = this._animationComplete.bind(this);
                this._positionToolBarBound = this._positionToolBar.bind(this);
            }, {
                commandsInOrder: {
                    get: function _AppBarMenuLayout_get_commandsInOrder() {
                        return this._originalCommands;
                    }
                },
                layout: function _AppBarMenuLayout_layout(commands) {
                    this._writeProfilerMark("layout,info");

                    commands = commands || [];
                    this._originalCommands = [];

                    var that = this;
                    commands.forEach(function (command) {
                        that._originalCommands.push(that.sanitizeCommand(command));
                    });
                    this._displayedCommands = this._originalCommands.slice(0);

                    if (this._menu) {
                        _ElementUtilities.empty(this._menu);
                    } else {
                        this._menu = _Global.document.createElement("div");
                        _ElementUtilities.addClass(this._menu, _Constants.menuContainerClass);
                    }
                    this.appBarEl.appendChild(this._menu);

                    this._toolbarEl = _Global.document.createElement("div");
                    this._menu.appendChild(this._toolbarEl);

                    this._createToolBar(commands);
                },

                showCommands: function _AppBarMenuLayout_showCommands(commands) {
                    var elements = this._getCommandsElements(commands);
                    var data = [];
                    var newDisplayedCommands = [];
                    var that = this;
                    this._originalCommands.forEach(function (command) {
                        if (elements.indexOf(command.element) >= 0 || that._displayedCommands.indexOf(command) >= 0) {
                            newDisplayedCommands.push(command);
                            data.push(command);
                        }
                    });
                    this._displayedCommands = newDisplayedCommands;
                    this._updateData(data);
                },

                showOnlyCommands: function _AppBarMenuLayout_showOnlyCommands(commands) {
                    this._displayedCommands = [];
                    this.showCommands(commands);
                },

                hideCommands: function _AppBarMenuLayout_hideCommands(commands) {
                    var elements = this._getCommandsElements(commands);
                    var data = [];
                    var newDisplayedCommands = [];
                    var that = this;
                    this._originalCommands.forEach(function (command) {
                        if (elements.indexOf(command.element) === -1 && that._displayedCommands.indexOf(command) >= 0) {
                            newDisplayedCommands.push(command);
                            data.push(command);
                        }
                    });
                    this._displayedCommands = newDisplayedCommands;
                    this._updateData(data);
                },

                connect: function _AppBarMenuLayout_connect(appBarEl) {
                    this._writeProfilerMark("connect,info");

                    exports._AppBarBaseLayout.prototype.connect.call(this, appBarEl);
                    this._id = _ElementUtilities._uniqueID(appBarEl);
                },

                resize: function _AppBarMenuLayout_resize() {
                    this._writeProfilerMark("resize,info");

                    if (this._initialized) {
                        this._forceLayoutPending = true;
                    }
                },

                positionChanging: function _AppBarMenuLayout_positionChanging(fromPosition, toPosition) {
                    this._writeProfilerMark("positionChanging from:" + fromPosition + " to: " + toPosition + ",info");

                    this._animationPromise = this._animationPromise || Promise.wrap();

                    if (this._animating) {
                        this._animationPromise.cancel();
                    }

                    this._animating = true;
                    if (toPosition === "shown" || (fromPosition !== "shown" && toPosition === "compact")) {
                        this._positionToolBar();
                        this._animationPromise = this._animateToolBarEntrance();
                    } else {
                        if (fromPosition === "minimal" || fromPosition === "compact" || fromPosition === "hidden") {
                            this._animationPromise = Promise.wrap();
                        } else {
                            this._animationPromise = this._animateToolBarExit();
                        }
                    }
                    this._animationPromise.then(this._animationCompleteBound, this._animationCompleteBound);
                    return this._animationPromise;
                },

                disposeChildren: function _AppBarMenuLayout_disposeChildren() {
                    this._writeProfilerMark("disposeChildren,info");

                    if (this._toolbar) {
                        _Dispose.disposeSubTree(this._toolbarEl);
                    }
                    this._originalCommands = [];
                    this._displayedCommands = [];
                },

                setFocusOnShow: function _AppBarMenuLayout_setFocusOnShow() {
                    // Make sure the menu (used for clipping during the resize animation)
                    // doesn't scroll when we give focus to the AppBar.
                    this.appBarEl.winControl._setFocusToAppBar(true, this._menu);
                },

                _updateData: function _AppBarMenuLayout_updateData(data) {
                    var hadHiddenClass = _ElementUtilities.hasClass(this.appBarEl, "win-navbar-closed");
                    var hadShownClass = _ElementUtilities.hasClass(this.appBarEl, "win-navbar-opened");
                    _ElementUtilities.removeClass(this.appBarEl, "win-navbar-closed");

                    // Make sure AppBar and children have width dimensions.
                    var prevAppBarDisplay = this.appBarEl.style.display;
                    this.appBarEl.style.display = "";


                    this._toolbar.data = new BindingList.List(data);
                    if (hadHiddenClass) {
                        this._positionToolBar();
                    }

                    // Restore state to AppBar.
                    this.appBarEl.style.display = prevAppBarDisplay;
                    if (hadHiddenClass) {
                        _ElementUtilities.addClass(this.appBarEl, "win-navbar-closed");
                    }

                    if (hadShownClass) {
                        this._positionToolBar();
                        this._animateToolBarEntrance();
                    }
                },

                _getCommandsElements: function _AppBarMenuLayout_getCommandsElements(commands) {
                    if (!commands) {
                        return [];
                    }

                    if (typeof commands === "string" || !commands || !commands.length) {
                        commands = [commands];
                    }

                    var elements = [];
                    for (var i = 0, len = commands.length; i < len; i++) {
                        if (commands[i]) {
                            if (typeof commands[i] === "string") {
                                var element = _Global.document.getElementById(commands[i]);
                                if (element) {
                                    elements.push(element);
                                } else {
                                    // Check in the list we are tracking, since it might not be in the DOM yet
                                    for (var j = 0, len2 = this._originalCommands.length; j < len2; j++) {
                                        var element = this._originalCommands[j].element;
                                        if (element.id === commands[i]) {
                                            elements.push(element);
                                        }
                                    }
                                }
                            } else if (commands[i].element) {
                                elements.push(commands[i].element);
                            } else {
                                elements.push(commands[i]);
                            }
                        }
                    }

                    return elements;
                },

                _animationComplete: function _AppBarMenuLayout_animationComplete() {
                    if (!this._disposed) {
                        this._animating = false;
                    }
                },

                _createToolBar: function _AppBarMenuLayout_createToolBar(commands) {
                    this._writeProfilerMark("_createToolBar,info");

                    var hadHiddenClass = _ElementUtilities.hasClass(this.appBarEl, "win-navbar-closed");
                    _ElementUtilities.removeClass(this.appBarEl, "win-navbar-closed");

                    // Make sure AppBar and children have width dimensions.
                    var prevAppBarDisplay = this.appBarEl.style.display;
                    this.appBarEl.style.display = "";

                    this._toolbar = new ToolBar.ToolBar(this._toolbarEl, {
                        data: new BindingList.List(this._originalCommands),
                        shownDisplayMode: 'full',
                    });

                    var that = this;
                    this._appbarInvokeButton = this.appBarEl.querySelector("." + _Constants.invokeButtonClass);
                    this._overflowButton = this._toolbarEl.querySelector("." + _ToolBarConstants.overflowButtonCssClass);
                    this._overflowButton.addEventListener("click", function () {
                        that._appbarInvokeButton.click();
                    });

                    this._positionToolBar();

                    // Restore state to AppBar.
                    this.appBarEl.style.display = prevAppBarDisplay;
                    if (hadHiddenClass) {
                        _ElementUtilities.addClass(this.appBarEl, "win-navbar-closed");
                    }
                },

                _positionToolBar: function _AppBarMenuLayout_positionToolBar() {
                    if (!this._disposed) {
                        this._writeProfilerMark("_positionToolBar,info");
                        this._initialized = true;
                    }
                },

                _animateToolBarEntrance: function _AppBarMenuLayout_animateToolBarEntrance() {
                    this._writeProfilerMark("_animateToolBarEntrance,info");

                    if (this._forceLayoutPending) {
                        this._forceLayoutPending = false;
                        this._toolbar.forceLayout();
                        this._positionToolBar();
                    }
                    var heightVisible = this._isMinimal() ? 0 : this.appBarEl.offsetHeight;
                    if (this._isBottom()) {
                        // Bottom AppBar Animation
                        var offsetTop = this._menu.offsetHeight - heightVisible;
                        return this._executeTranslate(this._menu, "translateY(" + -offsetTop + "px)");
                    } else {
                        // Top AppBar Animation
                        return resizeTransition(this._menu, this._toolbarEl, {
                            from: { content: heightVisible, total: heightVisible },
                            to: { content: this._menu.offsetHeight, total: this._menu.offsetHeight },
                            dimension: "height",
                            duration: 400,
                            timing: "ease-in",
                        });
                    }
                },

                _animateToolBarExit: function _AppBarMenuLayout_animateToolBarExit() {
                    this._writeProfilerMark("_animateToolBarExit,info");

                    var heightVisible = this._isMinimal() ? 0 : this.appBarEl.offsetHeight;
                    if (this._isBottom()) {
                        return this._executeTranslate(this._menu, "none");
                    } else {
                        // Top AppBar Animation
                        return resizeTransition(this._menu, this._toolbarEl, {
                            from: { content: this._menu.offsetHeight, total: this._menu.offsetHeight },
                            to: { content: heightVisible, total: heightVisible },
                            dimension: "height",
                            duration: 400,
                            timing: "ease-in",
                        });
                    }
                },

                _executeTranslate: function _AppBarMenuLayout_executeTranslate(element, value) {
                    return _TransitionAnimation.executeTransition(element,
                        {
                            property: this._tranformNames.cssName,
                            delay: 0,
                            duration: 400,
                            timing: "ease-in",
                            to: value
                        });
                },

                _isMinimal: function _AppBarMenuLayout_isMinimal() {
                    return this.appBarEl.winControl.closedDisplayMode === "minimal";
                },

                _isBottom: function _AppBarMenuLayout_isBottom() {
                    return this.appBarEl.winControl.placement === "bottom";
                },

                _writeProfilerMark: function _AppBarMenuLayout_writeProfilerMark(text) {
                    _WriteProfilerMark("WinJS.UI._AppBarMenuLayout:" + this._id + ":" + text);
                }
            });

            return _AppBarMenuLayout;
        }),
    });
});
