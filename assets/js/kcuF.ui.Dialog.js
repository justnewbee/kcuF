(function(kcuF, $) {
	/**
	 * kcuF Dialog control.
	 * @author <a href="mailto:justnewbee@gmail.com">Jianchun Wang</a>
	 * @class
	 * @version 1.0.0
	 * @param {Object} opts
	 * @requires JS: jquery &gt;= 1.3.2; jQuery-UI; jquery.ui.core; jquery.ui.widget; jquery.ui.mouse; jquery.ui.draggable; kcuF.utils.
	 * CSS: common(clearfix); icons(); button; dialog
	 * @example // A simplest usage - alert a message.
	 * new kcuF.ui.Dialog({
	 *   title: "Alert",
	 *   content: "This is a message!",
	 *   buttons: [{
	 *     text: "Yes",
	 *     defaultButton: true
	 *   }]
	 * });
	 * @example // Full options.
	 * new kcuF.ui.Dialog({
	 *   title: "Title",
	 *   closable: false,
	 *   content: "content",
	 *   buttons: [{
	 *     text: "Yes",
	 *     tooltip: "Tooltip for yes button",
	 *     callback: function () {...},
	 *     disabled: false,
	 *     defaultButton: false
	 *   }, {
	 *     text: "No",
	 *     tooltip: "Tooltip for no button",
	 *     callback: function () {...},
	 *     disabled: false,
	 *     defaultButton: false
	 *   }, {
	 *     text: "Cancel",
	 *     tooltip: "Tooltip for cancel button",
	 *     callback: function () {...},
	 *     disabled: false,
	 *     defaultButton: true
	 *   }],
	 *   bottomExt: "bottomExt",
	 *   width: 600,
	 *   focus: ".to-focus",
	 *   refocus: ".xxx",
	 *   cancelEnter: ".cancel-enter",
	 *   onBeforeOpen: function() {...},
	 *   onOpen: function() {...},
	 *   onBeforeClose: function() {...},
	 *   onClose: function() {...}
	 * });
	 * @description
	 * <h3>Change History:</h3>
	 * <ul>
	 *   <li><b>1.0.0 [2011-04-30/Jianchun]:</b> Initial draft.</li>
	 * </ul>
	 */
	var Dialog = kcuF.ns("ui.Dialog"),
		
		util = kcuF.ns("util"),
		template = kcuF.ns("template");
	
	$.extend(Dialog, /** @lends kcuF.ui.Dialog */{
		/**
		 * Default options for {@link kcuF.ui.Dialog} instances.
		 */
		OPTS: {
			/**
			 * Title shown in the dialog header. If set to false, the header won't show.
			 * @type String
			 */
			title: "",
			/**
			 * The original content shown in dialog body.
			 * @type DomNode|JQNode|String
			 */
			content: "",
			/**
			 * Whether the close button is shown or hidden.
			 * @type Boolean
			 */
			closable: true,
			/**
			 * If true, the dialog will make other dialogs dimmed; otherwise, they will share one wrapper.
			 * @type Boolean
			 */
			modal: true,
			/**
			 * Whether reposition when scroll.
			 */
			reposition: true,
			/**
			 * How many buttons, and each button's behavior.
			 * @type Array[Object]
			 */
			buttons: null,
			/**
			 * The width of the dialog (in px).
			 * @type Number
			 */
			width: 540,
			/**
			 * How the dialog will select input boxes (input:text, input:password, textarea) when dialog opens. Allowed values are: "default", "none" and anything else.
			 * By "default", focus the first visible input box; and "none", focus nothing; other are treated as query string.
			 * @type String
			 */
			focus: "default",
			/**
			 * For accessibility, restore previous focus before the dialog opens when the dialog closes.
			 * @type {String|DomNode|JQNode}
			 */
			refocus: "",
			/**
			 * Selector string for not triggering default action when enter key is hit inside it.
			 * @type String
			 */
			cancelEnter: "",
			/**
			 * Called when dialog node is created and appended to DOM, but not shown, useful for filling contents.
			 * @type Function
			 */
			onBeforeOpen: null,
			/**
			 * Called when the dialog is fully opened.
			 * @type Function
			 */
			onOpen: null,
			/**
			 * Callback when the dialog starts to close, useful for reminding users some leftovers by returning false in it.
			 * @type Function
			 */
			onBeforeClose: null,
			/**
			 * Callback when the dialog closes, not always used.
			 * @type Function
			 */
			onClose: null
		},
		/**
		 * Default options for {@link kcuF.ui.Dialog} class. It will affect the overlay color and opacity, and the overall z-index of all dialogs.
		 * @namespace
		 */
		G_SETTING: {
			/**
			 * The overlay background color.
			 * @type Function
			 */
			overlayColor: "#FFF",
			/**
			 * The overlay opacity.
			 * @type Function
			 */
			overlayOpacity: 0.6,
			/**
			 * The overlay z-index.
			 * @type Function
			 */
			zIndex: 1000
		},
		
		QUERY_OVERLAY: "#kcuF-dialog-overlay",
		QUERY_WRAPPER: "div.kcuF-dialog-wrapper",
		QUERY_DIALOG: "div.kcuF-dialog",
		QUERY_DIALOG_HEADER: "div.dlg-header",
		QUERY_DIALOG_CLOSE: "div.dlg-header>a.dlg-close",
		QUERY_DIALOG_BODY: "div.dlg-body",
		QUERY_DIALOG_CONTENT: "div.dlg-content",
		QUERY_DIALOG_FOOTER: "div.dlg-footer",
		QUERY_DIALOG_BUTTON: "div.dlg-footer>button,div.dlg-footer>a.kcuF-button",
		
		DATAKEY_INSTANCE: "nb_dialog_instance",
		DATAKEY_BUTTON_OPTS: "nb_dialog_button_opts",
		DATAKEY_WRAPPER_ZINDEX: "nb_dialog_wrapper_zindex",
		
		DATA_BUTTON: {
			text: "",
			align: "",
			tooltip: "",
			realButton: false,
			disabled: false,
			disableOnClick: false,
			defaultButton: false,// whether it's a default button, NOTE: only the first true in buttons will be set as default
			callback: null
		},
		
		/**
		 * The template string of a dialog wrapper. A wrapper holds one or more dialog instance.
		 * It's at the same level of dialog overlay.
		 * @type String
		 */
//		/**
//		 * The template string of a button node in a dialog instance.
//		 * @type String
//		 */
//		TMPL_BUTTON: "<button title=\"${tooltip}\" class=\"${align}\">${text}</button>",
		/**
		 * Provides an interface for setups dialog component with user-defined global options.
		 * <b>NOTE:</b> you can only call this before any instance of Dialog is created.
		 * @param {Object} opts
		 * @see kcuF.ui.Dialog.G_SETTING
		 */
		setupDialog: function(opts) {
			$.extend(Dialog.G_SETTING, opts);
		},
		
		/* private(s) in Dislog instances, function names are like _xxx */
		_doOverlay: function() {
			var $overlay = Dialog.__findOrCreateOverlay__();
			if ($overlay.is(":hidden")) {// the key handlers will be unbind when $overlay is hidden, making no pollution to global environment
				$(document).bind("keydown", Dialog.__keydownHandler__);
				$(window).bind("resize", Dialog.__resizeHandler__);
				$(window).bind("scroll", Dialog.__scrollHandler__);
				$overlay.show();
			}
			return $overlay;
		},
		
		_doWrapper: function(modal) {
			var wrapper;
			if (modal) {// for modal dialog, the older dialogs will be dimmed by descending z-index of their wrapper, and a new wrapper is always created
				$("body").children(Dialog.QUERY_WRAPPER).css({
					zIndex: Dialog.G_SETTING.zIndex - 1
				});
				wrapper = Dialog.__createWrapper__().css("z-index", Dialog.G_SETTING.zIndex + 1);
			} else {
				wrapper = Dialog.__findTopMostWrapper__() || Dialog.__createWrapper__();
			}
			
			return wrapper;
		},
		
		_doSize: function() {
			var $overlay = $("body").children(Dialog.QUERY_OVERLAY).css("width", "auto"),// auto to get the real width when resize from big to small
				$wrapper = $("body").children(Dialog.QUERY_WRAPPER).css("width", "auto"),
				vp = util.viewport();
			
			$overlay.css({
				width: vp.fw,
				height: $.browser.msie ? vp.vh + 30 : vp.vh// when h-scrollbar disappears after maximize, have to count that in...
			});
			$wrapper.css({
				width: vp.fw,
				height: vp.fh
			});
		},
		
		_undoOverlay: function(dlg) {
			var wrapper = dlg._wrapper;
			if (wrapper.find(Dialog.QUERY_DIALOG).length) {
				return;
			}
			
			wrapper.remove();
			wrapper = Dialog.__findTopMostWrapper__();
			if (wrapper) {// previously-closed dialog probably is a model dialog, make the very below one in light
				wrapper.css("z-index", Dialog.G_SETTING.zIndex + 1);
				var topMostDlg = Dialog.__findTopMostDialog__();
				if (topMostDlg) {
					Dialog._positioning(topMostDlg);
				}
			} else {
				$("body").children(Dialog.QUERY_OVERLAY).hide();
				$(document).unbind("keydown", Dialog.__keydownHandler__);
				$(window).unbind("resize", Dialog.__resizeHandler__);
				$(window).unbind("scroll", Dialog.__scrollHandler__);
			}
		},
		
		_positioning: function(dlg) {
			var ui = dlg._ui,
				w = ui.outerWidth(),
				h = ui.outerHeight(),
				l = Math.max(($(window).width() - w) * 0.5 + $(document).scrollLeft(), 0),
				t = Math.max(($(window).height() - h) * 0.5 + $(document).scrollTop(), 0);
			
			ui.css({
				left: l,
				top: t
			});
		},
		
		/**
		 * Get the unique overlay node for Dialog class, if no create one.
		 * This will only happen when the very first time a Dialog instance is created.
		 * @return {JQNode}
		 */
		__findOrCreateOverlay__: function() {
			var $overlay = $("body").children(Dialog.QUERY_OVERLAY);
			if (!$overlay.length) {
				$overlay = template.getAsDom$("Dialog.overlay").css({
					zIndex: Dialog.G_SETTING.zIndex,
					backgroundColor: Dialog.G_SETTING.overlayColor,
					opacity: Dialog.G_SETTING.overlayOpacity
				}).appendTo("body");
			}
			return $overlay;
		},
		/**
		 * Create and return a wrapper node for one Dialog instance.
		 * @return {JQNode}
		 */
		__createWrapper__: function() {
			return template.getAsDom$("Dialog.wrapper").appendTo("body").data(Dialog.DATAKEY_WRAPPER_ZINDEX, 0);
		},
		/**
		 * Find the top-most wrapper node.
		 * @return {JQNode|null}
		 */
		__findTopMostWrapper__: function() {
			var topIdx = 0,
				topWrapper = null;
			$("body").children(Dialog.QUERY_WRAPPER).each(function() {
				var wrapper = $(this),
					wpIdx = parseInt(wrapper.css("zIndex"), 10) || 0;
				if (!topWrapper || wpIdx >= topIdx) {
					topWrapper = wrapper;
					topIdx = wpIdx;
				}
			});
			return topWrapper;
		},
		/**
		 * Find the top-most Dialog instance.
		 * @return {JQNode|null}
		 */
		__findTopMostDialog__: function() {
			var topMostWrapper = Dialog.__findTopMostWrapper__(),
				dlg = null,
				zIndex = 0;
			
			if (!topMostWrapper) {
				return null;
			}
			
			topMostWrapper.children().each(function() {
				var dlgEl = $(this),
					dlgElZ = dlgEl.css("zIndex");
				if (!dlg || dlgElZ >= zIndex) {
					dlg = dlgEl.data(Dialog.DATAKEY_INSTANCE);
					zIndex = dlgElZ;
				}
			});
			return dlg;
		},
		/**
		 * Keydown handler for document, when a Dialog instance is shown, especially for Enter and ESC.
		 * @param {Event} e
		 */
		__keydownHandler__: function(e) {
			var topMostDlg = Dialog.__findTopMostDialog__();
			if (!topMostDlg) {
				return;
			}
			
			return topMostDlg._handleKeydown(e);
		},
		/**
		 * Resize handler for window, for re-positioning top-most Dialog instance.
		 * @param {Event} e
		 */
		__resizeHandler__: function(e) {
			var topMostDlg = Dialog.__findTopMostDialog__();
			Dialog._doSize();
			if (topMostDlg) {
				Dialog._positioning(topMostDlg);
			}
		},
		/**
		 * Scroll handler for window, for re-positioning top-most Dialog instance.
		 * @param {Event} e
		 */
		__scrollHandler__: function() {
			var topMostDlg = Dialog.__findTopMostDialog__();
			if (topMostDlg) {
				topMostDlg._handleScroll();
			}
		}
	});
	
	$.extend(Dialog.prototype, /** @lends kcuF.ui.Dialog.prototype */{
		/**
		 * Holds the options used to create the dialog.
		 * @type Object
		 */
		_options: null,
		/**
		 * Holds the reference of the dialog node.
		 * @type JQNode
		 */
		_ui: null,
		/**
		 * Holds the reference of the wrapper node who holds the dialog node.
		 * @type JQNode
		 */
		_wrapper: null,
		/**
		 * Holds all the private data in key-value pairs.
		 * @type Object
		 */
		_data: null,
		/**
		 * Initialize dialog with options.
		 * @param {Object} opts
		 */
		_init: function(opts) {
			var options = $.extend({}, Dialog.OPTS, opts),
				$wrapper = Dialog._doWrapper(options.modal),
				$ui = template.getAsDom$("Dialog", {
					title: options.title,
					width: options.width,
					close: "x"
				}).data(Dialog.DATAKEY_INSTANCE, this).bind("mousedown", {
					dialog: this
				}, function(e) {
					e.data.dialog._makeTopMost();
				}).draggable({
					handle: Dialog.QUERY_DIALOG_HEADER,
					containment: $wrapper.get(0)// must get 0, use the concrete dom node
				});
			
			Dialog._doOverlay();
			
			Dialog._doSize();
			$ui.appendTo($wrapper).find(Dialog.QUERY_DIALOG_CLOSE).bind("click", {
				dialog: this
			}, function(e) {
				e.data.dialog._handleOperation($(this));
			});
			
			this._options = options;
			this._ui = $ui;
			this._wrapper = $wrapper;
			
			this._update();
			
			var dlg = this,
				$footer = $ui.find(Dialog.QUERY_DIALOG_FOOTER);
			if (options.buttons && $.isArray(options.buttons) && options.buttons.length) {
				$footer.show();
				var dfltBtn = "";
				$.each(options.buttons, function(idx, itm) {
					var btnData = $.extend({
						index: idx// the dom structure may mess with the real index of button, we have to put a index here
					}, Dialog.DATA_BUTTON, itm);
					
					var $btn = $(itm.realButton ? "<button></button>" : "<a class=\"kcuF-button\" href=\"javascript:void(0);\"></a>").data(Dialog.DATAKEY_BUTTON_OPTS, btnData).bind("click", {
						dialog: dlg
					}, function(e) {
						e.data.dialog._handleOperation($(this));
						return false;
					});
					
					$btn.text(btnData.text);
					if (btnData.tooltip) {
						$btn.attr("title", btnData.tooltip);
					}
					if (btnData.align === "left") {
						$btn.addClass("left");
						$btn.appendTo($footer);
					} else {
						$btn.prependTo($footer);
					}
					if (btnData.disabled) {
						$btn.attr("disabled", "disabled").addClass("disabled");
					}
					
					if (btnData.defaultButton && !dfltBtn) {
						dfltBtn = $btn;
						$btn.addClass("green");
					}
				});
			} else {
				$footer.hide();
			}
			
			$ui.find(Dialog.QUERY_DIALOG_CONTENT).append(options.content);
			
			this._makeTopMost();
			
			if (options.onBeforeOpen) {
				options.onBeforeOpen.call(this);
			}
			Dialog._positioning(this);
			
			setTimeout(function() {// IE has problem if we try to focus a text field in dialog, due to that body click event has not ended yet
				var focused = false;
				if (options.focus && options.focus !== "none") {// TODO default focusint input, textarea
					dlg.find(":tabbable").each(function() {
						var $me = $(this);
						if (options.focus === "default") {
							$me.focus();
							focused = true;
							return false;
						}
						if ($me.is(options.focus)) {
							$me.focus();
							focused = true;
							return false;
						}
					});
				}
				if (!focused) {// due to bug #402339, we cannot focus elmt, instead we focus the dlg-body
					dlg._ui.find(Dialog.QUERY_DIALOG_BODY).focus();
				}
				
				if (options.onOpen) {
					options.onOpen.call(dlg);
				}
			}, 0);
		},
		
		/* private(s) */
		_close: function() {
			if (!this._ui.parent().length) {// you cannot close twice
				return;
			}
			
			if (this._options.onBeforeClose && this._options.onBeforeClose.call(this) === false) {
				return;
			}
			this._ui.remove();
			Dialog._undoOverlay(this);
			
			if (this._options.refocus) {
				$(this._options.refocus).focus();
			}
			if (this._options.onClose) {
				this._options.onClose.call(this);
			}
		},
		
		_handleKeydown: function(e) {
			var $tgt = $(e.target),
				targetIsOp = false;// target is an operation node - close or button
			
			this._ui.find("div.dlg-header>a.dlg-close:visible, div.dlg-footer>button:visible").each(function() {
				targetIsOp = e.target === this;
				return !targetIsOp;
			});
			
			switch (e.keyCode) {
			case 13:// ENTER
				if (targetIsOp) {
					this._handleOperation($tgt);
					return false;
				} else if (!$tgt.is(":tabbable") || ($tgt.is("input:text") && !$tgt.is(this._options.cancelEnter))) {
					this._handleOperation(this._ui.find("div.dlg-footer>button.default:visible:first"));
					return false;
				}
				return true;
			case 32:// SPACE
				if (targetIsOp) {
					this._handleOperation($tgt);
					return false;
				}
				return true;
			case 27:// ESC
				this._handleOperation(this._ui.find("div.dlg-header>a.dlg-close:visible"));
				return false;
			case 9:// TAB
				var tabbables = this._ui.find(":tabbable"),
					firstTabbable = tabbables.filter(":first")[0],
					lastTabbable = tabbables.filter(":last")[0];
				
				if (e.target == lastTabbable && !e.shiftKey) {
					setTimeout(function() {
						firstTabbable.focus();
					}, 0);
					return false;
				} else if (e.target == firstTabbable && e.shiftKey) {
					setTimeout(function() {
						lastTabbable.focus();
					}, 0);
					return false;
				}
				return true;
			default:
				return true;
			}
		},
		
		_handleScroll: function() {
			if (this._options.reposition) {
				Dialog._positioning(this);
			}
		},
		
		_handleOperation: function($nd) {// Button click or close
			if (!$nd.length) {
				return;
			}
			if ($nd.is(".dlg-close")) {
				if ($nd.hasClass("disabled")) {
					return;
				}
				this._close();
			} else {// button
				var btnOpts = $nd.data(Dialog.DATAKEY_BUTTON_OPTS);
				if ($nd.hasClass("disabled") || !btnOpts) {
					return;
				}
				
				if (btnOpts.disableOnClick) {
					$nd.attr("disabled", "disabled").addClass("disabled");
				}
				
				if (btnOpts.callback && btnOpts.callback.call(this, $nd) === false) {
					return;
				}
				this._close();
			}
		},
		
		_makeTopMost: function() {
			var zIdx = parseInt(this._ui.css("zIndex"), 10) || 0,
				maxIdx = this._wrapper.data(Dialog.DATAKEY_WRAPPER_ZINDEX) || 0;
			
			if (!zIdx || zIdx < maxIdx) {
				maxIdx += 1;
				this._ui.css("zIndex", maxIdx);
				this._wrapper.data(Dialog.DATAKEY_WRAPPER_ZINDEX, maxIdx);
			}
		},
		
		/* public(s) */
		/**
		 * A safe sandbox data inside dialog instance.
		 * @name $.artemis.common.Dialog#data
		 * @function
		 * @param {String} key The data name.
		 * @param {String} [val] When provided, it's a setter function, when omitted, it's a getter. Same as jQuery.data.
		 * @return {Anything(getter)|Dialog instance(setter)}
		 */
		data: function(/* key[, val] */) {
			this._data = this._data || {};
			var data = this._data,
				args = arguments;
			
			if (!args.length) {// get all
				return this._data;
			} else if (args.length === 1) {// getter or settter
				if (args[0] === null || args[0] === false) {// clear
					for (var k in data) {
						if (data.hasOwnProperty(k)) {
							delete data[k];
						}
					}
					return this;
				} else if (typeof args[0] == "string") {// getter
					return data[args[0]] === undefined ? "" : data[args[0]];
				} else {// setter by object
					$.extend(data, args[0]);
					return this;
				}
			} else {
				data[args[0]] = args[1];
				return this;
			}
		},
		/**
		 * A safe sandbox find inside dialog body.
		 * @param {String} queryStr The very same query string used in jQuery $ function.
		 * @return {JQNode}
		 */
		find: function(queryStr) {
			return this._ui.find(Dialog.QUERY_DIALOG_CONTENT).find(queryStr);
		},
		/**
		 * Close and destroy the dialog instance via code.
		 * @return {Dialog}
		 */
		close: function() {
			this._close();
			return this;
		},
		/**
		 * @param {Number} idx
		 * @return {JQNode}
		 */
		findButton: function(idx) {
			return this._ui.find(Dialog.QUERY_DIALOG_BUTTON).filter(function() {
				return $(this).data(Dialog.DATAKEY_BUTTON_OPTS).index === idx;
			});
		},
		/**
		 * Update a button's label, default, disabled or callback.
		 * @param {String|Number} idx The button index.
		 * @param {Object|Function} btnOpts When is an object it follows the button object fomat, see {@link @.artemis.Dialog.OPTS.buttons}.
		 *     When is a function, that means you want a full control over the button (this in the function is the button itself).
		 * @return {Dialog}
		 * @example // A simpleset update - the label.
		 * dlg.updateButton(0, {
		 *   text: "A New Label",
		 * });
		 * @example // A fully change by object, all the options are optional, those omitted are left unchanged.
		 * dlg.updateButton(0, {
		 *   text: "A New Label",
		 *   callback: function() {...},
		 *   disabled: true,
		 *   defaultButton: true// Note: because default is exclusive,
		 *     // this only accepts true, and will set other default as undefault.
		 * });
		 * @example // When you want a full control of the button, use function as btnOpts.
		 * dlg.updateButton(0, function() {
		 *   this.replaceWith("xxx");
		 * });
		 */
		updateButton: function(idx, btnOpts) {
			var $btn = this.findButton(idx);
			if (!$btn.length || !btnOpts) {
				return this;
			}
			
			if ($.isFunction(btnOpts)) {// full control to the button
				btnOpts.call($btn);
			} else {
				if (btnOpts.text) {
					$btn.text(btnOpts.text);
				}
				
				if (btnOpts.disabled !== undefined) {
					if (btnOpts.disabled) {
						$btn.attr("disabled", "disabled").addClass("disabled");
					} else {
						$btn.removeAttr("disabled").removeClass("disabled");
					}
				}
				
				if (btnOpts.defaultButton === true && !$btn.hasClass("green")) {// TODO not green
					this._ui.find("div.dlg-footer>button.green,div.dlg-footer>a.kcuF-button.green,").removeClass("green");
					$btn.addClass("green");
				}
				
				$.extend($btn.data(Dialog.DATAKEY_BUTTON_OPTS), btnOpts);
			}
			
			return this;
		},
		_update: function() {
			var ui = this._ui,
				options = this._options,
				$header = ui.find(Dialog.QUERY_DIALOG_HEADER),
				$close = ui.find(Dialog.QUERY_DIALOG_CLOSE);
			
			if (options.title) {
				$header.find("div.dlg-title-inner").html(options.title);
			}
			if (options.title === false) {
				$header.hide();
			} else {
				$header.show();
			}
			
			if (options.closable) {
				$close.show();
			} else {
				$close.hide();
			}
		},
	//	/**
	//	 * Update a dialog's title, header, close and footer, show or hide or disable.
	//	 * @param {Object} dlgOpts
	//	 * @return {Dialog}
	//	 * @example // A full update.
	//	 * // Note: all the options are optional, those omitted are left unchanged.
	//	 * dlg.update({
	//	 *   title: "A New Title",
	//	 *   closable: false
	//	 * });
	//	 */
	//	update: function(dlgOpts) {
	//		this._update();
	//	},
		/**
		 * Toggles a message inside dialog with special UI feel.
		 * @param {String} [msg] If empty, clean the message.
		 * @param {String} [msgType="info"] Message type, values are "info", "warn", "error".
		 * @param {Function} [Function] Callback when message is shown or hidden, scope (this) is dialog instance and parameter is the msg node.
		 * @return {Dialog}
		 * @example // Show a warn message
		 * dlg.message("You're wrong!", "warn", function() {...});
		 * @example // Clean a message
		 * dlg.message();
		 * @example // Clean a message and then do something
		 * dlg.message("", "", function() {...});
		 */
		message: function(msg, msgType, callback) {
			var theDlg = this,
				$msg = this._ui.find("div.dlg-body > div.dlg-msg-wrapper"),
				msgVisible = $msg.is(":visible"),
				fadeCallback = /**@ignore*/function() {
					if (msg && !msgVisible) {
						var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop || 0;
						if (($msg.offset().top + $msg.height()) <= scrollTop) {// for bug #406334, only to focus the message node when the node is not visible to user
							$msg.focus();
						}
					}
					if (callback) {
						callback.call(theDlg, $msg);
					}
				};
			
			if (msg) {
				$msg.removeClass("dlg-msg-info dlg-msg-warn dlg-msg-error");
				switch ((msgType || "").toLowerCase()) {
				case "warn":
					$msg.addClass("dlg-msg-warn");
					break;
				case "error":
					$msg.addClass("dlg-msg-error");
					break;
				default:
					$msg.addClass("dlg-msg-info");
					break;
				}
				$msg.find("span.msg-text").html(msg);
				$msg.fadeIn("fast", fadeCallback);
			} else {
				$msg.fadeOut("fast", fadeCallback);
			}
			
			return this;
		}
	});
})(kcuF, kcuF.$);