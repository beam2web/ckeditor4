/* bender-tags: editor,widget */
/* bender-ckeditor-plugins: imagebase,toolbar */
/* bender-include: ../../widget/_helpers/tools.js */
/* global widgetTestsTools */

( function() {
	'use strict';

	bender.editors = {
		classic: {},

		divarea: {
			config: {
				extraPlugins: 'divarea'
			}
		},

		inline: {
			creator: 'inline'
		}
	};

	function addTestWidget( editor ) {
		if ( editor.widgets.registered.testWidget ) {
			return;
		}

		var plugin = CKEDITOR.plugins.imagebase;

		plugin.addImageWidget( editor, 'testWidget', plugin.addFeature( editor, 'caption', {} ) );
	}

	function getFixture( name ) {
		return CKEDITOR.document.getById( name ).getHtml();
	}

	function assertVisibility( caption, isVisible, msg ) {
		assert[ 'is' + ( isVisible ? 'False' : 'True' ) ]( caption.hasAttribute( 'data-cke-hidden' ), msg );
	}

	function createToggleTest( options ) {
		return function( editor, bot ) {
			addTestWidget( editor );

			bot.setData( getFixture( options.fixture ), function() {
				var widget = widgetTestsTools.getWidgetByDOMOffset( editor, 0 ),
					caption = widget.parts.caption,
					focusTrap = editor.editable().findOne( 'p' ).getChild( 0 ),
					range = editor.createRange();

				assertVisibility( caption, options.initial, 'caption visibility (initial)' );

				widget.focus();

				assertVisibility( caption, options.focus, 'caption visibility (focus)' );

				if ( options.onFocus ) {
					options.onFocus( widget );
				}

				range.setStart( focusTrap, 1 );
				range.collapse();
				range.select();

				assertVisibility( caption, options.blur, 'caption visibility (blur)' );
			} );
		};
	}

	function createMultipleToggleTest( options ) {
		return function( editor, bot ) {
			var forEach = CKEDITOR.tools.array.forEach;

			addTestWidget( editor );

			function getWidgets( editor, amount ) {
				var i,
					widgets = [];

				for ( i = 0; i < amount; i++ ) {
					widgets.push( widgetTestsTools.getWidgetByDOMOffset( editor, i ) );
				}

				return widgets;
			}

			function assertMultipleVisibility( widgets, expected, msg ) {
				forEach( widgets, function( widget, i ) {
					assertVisibility( widget.parts.caption, expected[ i ],
						'caption#' + i + ' visibility (' + msg + ')' );
				} );
			}

			function assertOnFocus( widgets, expected ) {
				forEach( widgets, function( widget, i ) {
					widget.focus();

					assertMultipleVisibility( widgets, expected[ i ], 'focus widget#' + i );
				} );
			}

			bot.setData( getFixture( options.fixture ), function() {
				var widgets = getWidgets( editor, options.widgetsCount );

				assertMultipleVisibility( widgets, options.initial, 'initial' );

				assertOnFocus( widgets, options.focus );
			} );
		};
	}

	var tests = {
		'test upcasting widget without figcaption element': function( editor, bot ) {
			addTestWidget( editor );

			widgetTestsTools.assertWidget( {
				count: 1,
				widgetOffset: 0,
				nameCreated: 'testWidget',
				html: getFixture( 'upcastWithoutCaptionTest' ),
				bot: bot,

				assertCreated: function( widget ) {
					var figcaptions = widget.element.find( 'figcaption' );

					assert.areSame( 1, figcaptions.count(), 'captions count' );
					assert.isTrue( figcaptions.getItem( 0 ).equals( widget.parts.caption ),
						'Widget caption part element' );
					assert.isTrue( CKEDITOR.plugins.widget.isDomNestedEditable( widget.parts.caption ),
						'Caption is nested editable' );
				}
			} );
		},

		'test toggling caption (one widget with empty caption)': createToggleTest( {
			fixture: 'toggleOneEmpty',
			initial: false,
			focus: true,
			blur: false
		} ),

		'test toggling caption (one widget with non-empty caption)': createToggleTest( {
			fixture: 'toggleOne',
			initial: true,
			focus: true,
			blur: true
		} ),

		'test toggling caption (one widget with empty caption that gets filled)': createToggleTest( {
			fixture: 'toggleOneEmpty',
			initial: false,
			focus: true,
			blur: true,

			onFocus: function( widget ) {
				widget.editables.caption.setData( 'Test' );
			}
		} ),

		'test toggling caption (one widget with non-empty caption that gets emptied)': createToggleTest( {
			fixture: 'toggleOne',
			initial: true,
			focus: true,
			blur: false,

			onFocus: function( widget ) {
				widget.editables.caption.setData( '' );
			}
		} ),

		'test toggling captions (two widgets with empty captions)': createMultipleToggleTest( {
			fixture: 'toggleTwoEmpty',
			widgetsCount: 2,
			initial: [ false, false ],
			focus: [
				[ true, false ],
				[ false, true ]
			]
		} ),

		'test toggling captions (two widgets with non-empty captions)': createMultipleToggleTest( {
			fixture: 'toggleTwo',
			widgetsCount: 2,
			initial: [ true, true ],
			focus: [
				[ true, true ],
				[ true, true ]
			]
		} )
	};

	tests = bender.tools.createTestsForEditors( CKEDITOR.tools.objectKeys( bender.editors ), tests );
	bender.test( tests );
} )();
