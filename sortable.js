// *** sortable.js - https://github.com/rern/js/edit/master/sortable/ ***
/*
usage:
...
<link rel="stylesheet" href="/path/sortable.css">
</head>
<body>
	<div id="divbeforeid"> <!-- optional -->
		(divBeforeTable html)
	</div>
	<table id="tableid">
		<thead><tr><td></td></tr></thead>
		<tbody><tr><td></td></tr></tbody>
	</table>
	<div id="divafterid"> <!-- optional -->
		(divAfterTable html)
	</div>
<script src="/path/jquery.min.js"></script>
<script src="/path/sortable.js"></script>
<script>
...
$('tableid').sortable();             // without options > full page table
// or
$('tableid').sortable( {
	  divBeforeTable:  'divbeforeid' // default: (none) - div before table, enclosed in single div
	, divAfterTable:   'divafterid'  // default: (none) - div after table, enclosed in single div
	, initialSort:     'column#'     // default: (none) - start with 0
	, initialSortDesc: true          // default: false
	, locale:          'code'        // default: 'en'   - locale code
	, negativeSort:    [column#]     // default: (none) - column with negative value
	, rotateTimeout:   400           // try higher if 'thead2' misaligned
	, shortViewportH:  414           // max height to apply fixed 'thead2'
	, tableArray:      []            // default: (none) - use table data array directly
} );
...

custom css for table:
edit in sortable.css  
*/

( function ( $ ) {

$.fn.sortable = function ( options ) {
//******************************************************************
var settings = $.extend( {   // defaults:
	divBeforeTable: ''       // all elements in single div
	, divAfterTable: ''      // all elements in single div
	, initialSort: ''        // initial sort column
	, initialSortDesc: false // initial sort descending
	, locale: 'en'           // base language code
	, negativeSort: []       // column with negative value
	, timeout: 400     // try higher if 'thead2' misaligned
	, shortViewportH: 414    // max height to apply fixed 'thead2'
	, tableArray : ''        // raw data array to skip extraction
}, options );

var $window = $( window );
var $table = this;
var $thead = $table.find( 'thead' );
var $thtr = $thead.find( 'tr' );
var $thtd = $thtr.children(); // either 'th' or 'td'
var $tbody = $table.find( 'tbody' );
var $tbtr = $tbody.find( 'tr' );
var $tbtd = $tbtr.find( 'td' );

// #### raw data array [ [i, 'a', 'b', 'c', ...], [i, 'd', 'e', 'f', ...] ]
if ( settings.tableArray ) {
	var tableArray = settings.tableArray;
} else {
	// convert 'tbody' to raw data array 
	var tableArray = [];
	$tbtr.each( function ( i ) {
		var row = [ i ];
		$( this ).find( 'td' ).each( function ( j ) {
			if ( $.inArray( j+1, settings.negativeSort ) === -1 ) { // '+1' - make 1st column = 1, not 0
				var cell = $( this ).text();
			} else { // get minus value in alphanumeric column
				var cell = $( this ).text().replace( /[^0-9\.\-]/g, '' ); // get only '0-9', '.' and '-'
			}
			row.push( $thtd.eq( j ).text() == '' ? '' : cell ); // blank header not sortable
		} );
		tableArray.push( row );
	} );
}
var divBeforeH = 0;
var divAfterH = 0;
if ( settings.divBeforeTable ) {
	divBeforeH = $( settings.divBeforeTable ).outerHeight();
	$( settings.divBeforeTable ).addClass( 'divbefore' );
}
if ( settings.divAfterTable ) {
	divAfterH = $( settings.divAfterTable ).outerHeight();
	$( settings.divAfterTable ).addClass( 'divafter' );
}

// #### dynamic css - divBeforeH, divAfterH, thead2
var tableID = this[ 0 ].id;
var tableParent = '#sortable'+ tableID;
var trH = $tbtr.height();
$table.wrap( '<div id="sortable'+ tableID +'" class="tableParent"></div>' );
$table.addClass( 'sortable' );

$( 'head' ).append( '<style>'
	+'.tableParent::before {'
		+'content: "";'
		+'display: block;'
		+'height: '+ divBeforeH +'px;'
		+'width: 100%;'
	+'}\n'
	+'.sortableth2 {top: '+ divBeforeH +'px;}\n'
	+'#trlast {height: '+ ( divAfterH + trH ) +'px;}\n'
	+'@media(max-height: '+ settings.shortViewportH +'px) {\n'
		+'.divbefore {position: absolute;}'
		+'.divafter {position: relative;}'
		+'.sortableth2 {top: 0;}'
		+'.sortable thead {visibility: visible;}'
		+'#trlast {height: '+ trH +'px;}'
	+'}'
	+'</style>'
//	+'<meta name="viewport" content="width=device-width, initial-scale=1.0">'
);

// #### add l/r 'tdpad' to keep table center
var $tabletmp = $table.detach() // avoid many dom traversings (but cannot maintain width)
$thtd.addClass( 'asctmp' ); // add sort icon to allocate width
// change 'th' to 'td' for easier work
$thtd.prop( 'tagName' ) == 'TH' && $thtr.html( $thtr.html().replace( /th/g, 'td' ) );
// add 'tdpad'
$thtr.add( $tbtr )
	.prepend( '<td class="tdpad"></td>' )
	.append( '<td class="tdpad"></td>' )
;
// update cache after add 'tdpad'
$thtd = $thtr.find( 'td' );
$tbtd = $tbtr.find( 'td' );

var thead2html = '<a></a>';
$( tableParent ).append( $tabletmp ) // width available only after appended
	.find( 'thead td' ).each( function ( i ) { // allocate width for sort icon
		if ( i > 0 && i < ( $thtd.length - 1 ) ) { // without 'tdpad'
			var tdW = $( this ).outerWidth();
			$( this ).css( 'min-width', tdW  +'px' );
			thead2html += '<a>'+ $( this ).text() +'</a>';
		}
	} ).removeClass( 'asctmp' )
;

// #### add fixed header 'thead2'
$( 'body' ).prepend(
	'<div id="'+ tableID +'th2" class="sortableth2" style="display: none;">'+ thead2html +'</div>'
);
var $thead2 = $( '#'+ tableID +'th2' );
var $thead2a = $thead2.find( 'a' );
setTimeout( function () {
	$thtd.each( function ( i ) {
		var $th2a = $thead2a.eq( i );
		$th2a.css( {
			'width': $( this ).outerWidth() +'px'
			, 'text-align': $( this ).css( 'text-align' )
		} ); // for changed width
		$( this ).is( ':hidden' ) && $th2a.hide();
	} );
	$thead2.show();
}, settings.timeout );
// delegate click to 'thead'
$thead2a.click( function () {
	$thtd.eq( $( this ).index() ).click();
} );

// #### click 'thead' to sort
$thtd.click( function ( event, initdesc ) {
	var i = $( this ).index();
	var order = ( $( this ).hasClass( 'asc' ) || initdesc ) ? 'desc' : 'asc';
	// sort value-only array (multi-dimensional)
	var sorted = tableArray.sort( function ( a, b ) {
		var ab = ( order == 'desc' ) ? [ a, b ] : [ b, a ];
		if ( $.inArray( i, settings.negativeSort ) === -1 ) {
			return ab[ 0 ][ i ].localeCompare( ab[ 1 ][ i ], settings.locale, { numeric: true } );
		} else {
			return ab[ 0 ][ i ] - ab[ 1 ][ i ];
		}
	} );
	// sort 'tbody' in-place by each 'array[ 0 ]', reference i [ [i, 'a', 'b', 'c', ...], [i, 'd', 'e', 'f', ...] ]
	var $tbodytmp = $tbody.detach();
	$thead2a.add( $thtd ).add( $tbtd )
		.removeClass( 'asc desc sorted' );
	$.each( sorted, function () {
		$tbodytmp.prepend( $tbtr.eq( $( this )[ 0 ] ) );
	} );
	// switch sort icon and highlight sorted column
	$thead2a.eq( i ).add( this )
		.addClass( order )
			.add( $tbody.find( 'td:nth-child('+ ( i+1 ) +')' ) )
				.addClass( 'sorted' )
	;
	$table.append( $tbodytmp );
} );

// #### add empty 'tr' to bottom then initial sort
$tbody.append(
	$tbody.find( 'tr:last' )
		.clone()
		.empty()
		.prop( 'id', 'trlast' )
).prev() // initial sort
	.find( $thtd ).eq( settings.initialSort )
		.trigger( 'click', settings.initialSortDesc )
;

// #### maintain scroll position on rotate
// get scroll position
var positionY = 0;
var scrollTimeout;
function getScrollY() {
	$window.scroll( function () {
		// cancel previous 'scroll' within 'timeout'
		clearTimeout( scrollTimeout );
		scrollTimeout = setTimeout( function () {
			positionY = window.scrollY;
		}, settings.timeout );
	} );
};
getScrollY();
// reference for scrolling calculation
var fromShortViewport = ( $thead.css( 'visibility' ) == 'visible' ) ? 1 : 0;
var positionCurrent = 0;
// 'orientationchange' always followed by 'resize'
window.addEventListener( 'orientationchange', function () {
	$window.off( 'scroll' ); // suppress new 'scroll'
	$thead2.hide(); // suppress 'thead2' unaligned flash
	// maintain scroll (get 'scrollY' here works only on ios)
	if ( $thead.css( 'visibility' ) == 'visible' ) {
		positionCurrent = positionY + divBeforeH;
		fromShortViewport = 1;
	} else {
		// omit 'divBeforeTable' if H to V from short viewport
		positionCurrent = positionY - ( fromShortViewport ? divBeforeH : 0 );
		fromShortViewport = 0;
	}
	positionY = positionCurrent; // update to new value
//	alert( 'rotate '+ positionY );
	setTimeout( function () {
		$window.scrollTop( positionCurrent );
	}, settings.timeout );
} );

// #### realign 'thead2' on rotate / resize
var resizeTimeout;
window.addEventListener( 'resize', function () {
	$window.off( 'scroll' ); // suppress new 'scroll'
	// cancel previous 'resize' within 'timeout'
	clearTimeout( resizeTimeout );
	resizeTimeout = setTimeout( function () {
//		alert( 'resize '+ positionY );
		$thead2a.show(); // reset hidden
		$thtd.each( function ( i ) {
			$thead2a.eq( i ).css( 'width', $( this ).outerWidth() +'px' ); // for changed width
			$( this ).is( ':hidden' ) && $thead2a.eq( i ).hide();
		} );
		$thead2.show();
		// re-enable 'scroll' after 'orientationchange' > 'resize'
		getScrollY();
	}, settings.timeout );
} );
//******************************************************************
}

} ( jQuery ) );
